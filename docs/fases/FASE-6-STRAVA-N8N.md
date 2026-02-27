# FASE 6 - Strava Sync via N8N Webhook ✅

## 📋 Resumo

Implementação completa do sistema de sincronização do Strava via webhook N8N, permitindo que usuários sincronizem suas atividades manualmente através da página de configurações.

---

## 🎯 O que foi implementado

### Backend (Cloudflare Functions)

#### 1. **GET /api/strava/status**
```typescript
// functions/api/strava/status.ts
// Retorna status da conexão Strava do usuário autenticado
Response: {
  success: true,
  data: {
    connected: boolean,
    athlete_id: number | null,
    last_sync: string | null,
    total_activities: number
  }
}
```

**Lógica:**
- Valida sessão do usuário via `extractSessionToken()`
- Busca conexão Strava na tabela `strava_connections` com `is_valid = true`
- Conta atividades na tabela `activities`
- Retorna `connected: false` se não houver conexão válida

---

#### 2. **POST /api/strava/sync**
```typescript
// functions/api/strava/sync.ts
// Dispara webhook N8N para sincronizar atividades

Request body: {} (vazio - user_id vem da sessão)

Response: {
  success: true,
  message: "Sincronização iniciada com sucesso"
}
```

**Lógica:**
1. Valida sessão do usuário
2. Busca conexão Strava válida (com `access_token` e `refresh_token`)
3. Retorna erro se não estiver conectado
4. Monta payload para N8N:
   ```json
   {
     "user_id": "uuid",
     "strava_athlete_id": 12345,
     "strava_access_token": "xxx",
     "strava_refresh_token": "yyy",
     "token_expires_at": "2025-03-01T12:00:00Z",
     "sync_since": "2025-01-27T00:00:00Z" // 30 dias atrás
   }
   ```
5. Chama webhook N8N (URL da env `N8N_WEBHOOK_STRAVA_SYNC`)
6. Retorna sucesso mesmo que webhook falhe (fire-and-forget assíncrono)

**Variável de ambiente necessária:**
```bash
N8N_WEBHOOK_STRAVA_SYNC=https://seu-n8n.com/webhook/strava-sync
```

---

#### 3. **POST /api/strava/disconnect**
```typescript
// functions/api/strava/disconnect.ts
// VERIFICADO - Já existia e está correto

// Marca is_valid = false na conexão Strava
```

---

### Frontend (React)

#### **src/pages/dashboard/Settings.tsx**

**Novo estado:**
```typescript
const [stravaConnected, setStravaConnected] = useState(false);
const [stravaAthleteId, setStravaAthleteId] = useState<number | null>(null);
const [stravaLastSync, setStravaLastSync] = useState<string | null>(null);
const [stravaTotalActivities, setStravaTotalActivities] = useState(0);
const [syncing, setSyncing] = useState(false);
```

**Funções:**

1. **fetchStravaStatus()** - Chamada no `useEffect` ao carregar página
   - GET /api/strava/status
   - Atualiza estado com dados da conexão

2. **handleSync()** - Dispara sincronização manual
   - Valida se está conectado
   - POST /api/strava/sync
   - Mostra toast de sucesso/erro
   - Recarrega status após sync

3. **handleDisconnect()** - Desconecta Strava
   - Confirmação com `confirm()`
   - POST /api/strava/disconnect
   - Toast de feedback
   - Recarrega status

**UI adicionada:**

```tsx
{/* Seção Strava */}
<div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-primary/10">
  {/* Header com ícone */}

  {stravaConnected ? (
    {/* Estado CONECTADO */}
    - Badge verde "Conectado"
    - Info box com: Atleta ID, Total atividades, Última sync
    - Botão "Sincronizar Agora" (com spinner quando syncing=true)
    - Link "Desconectar"
  ) : (
    {/* Estado NÃO CONECTADO */}
    - Ícone vermelho "Strava não conectado"
    - Texto explicativo
    - Botão disabled "Conectar Strava (em breve)"
  )}
</div>
```

**Ícones usados:**
- `ActivityIcon` - Header da seção
- `CheckCircle` - Badge de conectado
- `XCircle` - Badge de não conectado
- `RefreshCw` - Botão sync (com `animate-spin` quando carregando)

---

## 🔗 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuário clica "Sincronizar Agora" na página Settings    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend chama POST /api/strava/sync                    │
│    Header: Authorization: Bearer <session_token>           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Cloudflare Function valida sessão                       │
│    Busca strava_connections com is_valid=true              │
│    Retorna erro se não encontrar                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Cloudflare chama webhook N8N via fetch()                │
│    POST https://seu-n8n.com/webhook/strava-sync            │
│    Body: {                                                  │
│      user_id, strava_athlete_id,                           │
│      strava_access_token, strava_refresh_token,            │
│      token_expires_at, sync_since                          │
│    }                                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. N8N Workflow processa (você precisa configurar):        │
│    a) Verifica se token expirou                            │
│    b) Se sim: refresh token com Strava OAuth API           │
│    c) GET /athlete/activities desde sync_since             │
│    d) Para cada atividade:                                 │
│       - Transforma dados para schema do Supabase           │
│       - INSERT INTO choppinho.activities (ON CONFLICT...)  │
│    e) UPDATE strava_connections SET last_sync = NOW()      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Frontend mostra toast "Sincronização concluída!"        │
│    Chama fetchStravaStatus() para atualizar números        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Próximos Passos

### 1. Configurar Variável de Ambiente no Cloudflare

```bash
# Via Cloudflare Dashboard
Pages > choppinho-web > Settings > Environment Variables

# Ou via Wrangler CLI
wrangler pages secret put N8N_WEBHOOK_STRAVA_SYNC
# Cole a URL do webhook N8N quando solicitado
```

**Exemplo de URL:**
```
https://n8n.choppinhofit.com.br/webhook/strava-sync
```

---

### 2. Criar Workflow no N8N

#### **Estrutura sugerida:**

```
[Webhook Trigger]
    ↓
[Function: Check Token Expiry]
    ↓
[IF: Token expirado?]
    ├─ SIM → [HTTP: Refresh Strava Token]
    │           ↓
    │       [Supabase: Update tokens]
    │           ↓
    └─ NÃO → (continua)
    ↓
[HTTP: GET Strava Activities]
    • Endpoint: https://www.strava.com/api/v3/athlete/activities
    • Query: after={{ $json.sync_since }}, per_page=200
    • Header: Authorization: Bearer {{ $json.strava_access_token }}
    ↓
[Loop: Para cada atividade]
    ↓
[Function: Transform Strava → Supabase]
    • Mapear campos:
      - id → strava_activity_id
      - name → name
      - type → activity_type
      - distance → distance_meters
      - moving_time → moving_time_seconds
      - elapsed_time → elapsed_time_seconds
      - etc...
    ↓
[Supabase: Upsert Activity]
    • INSERT INTO choppinho.activities (...)
      ON CONFLICT (user_id, strava_activity_id)
      DO UPDATE SET ...
    ↓
[Supabase: Update Last Sync]
    • UPDATE choppinho.strava_connections
      SET last_sync = NOW()
      WHERE user_id = {{ $json.user_id }}
```

---

#### **Detalhes do N8N Webhook Node:**

**Webhook Settings:**
- HTTP Method: POST
- Path: `/webhook/strava-sync`
- Authentication: None (segurança via Cloudflare secret)
- Response Code: 200
- Response Body:
  ```json
  {
    "success": true,
    "message": "Sync job queued"
  }
  ```

**Input esperado:**
```typescript
interface WebhookPayload {
  user_id: string;              // UUID do usuário
  strava_athlete_id: number;    // ID do atleta no Strava
  strava_access_token: string;  // Token atual
  strava_refresh_token: string; // Para renovação
  token_expires_at: string;     // ISO timestamp
  sync_since: string;           // ISO timestamp (30 dias atrás)
}
```

---

#### **Function Node: Transform Strava → Supabase**

```javascript
// Exemplo de transformação
const items = $input.all();

return items.map(activity => ({
  json: {
    user_id: $('Webhook').item.json.user_id,
    strava_activity_id: activity.json.id,
    activity_type: activity.json.type,
    name: activity.json.name,
    start_date: activity.json.start_date,
    distance_meters: activity.json.distance,
    moving_time_seconds: activity.json.moving_time,
    elapsed_time_seconds: activity.json.elapsed_time,
    total_elevation_gain: activity.json.total_elevation_gain || 0,
    average_speed: activity.json.average_speed || 0,
    max_speed: activity.json.max_speed || 0,
    average_heartrate: activity.json.average_heartrate || null,
    max_heartrate: activity.json.max_heartrate || null,
    suffer_score: activity.json.suffer_score || null,
    calories: activity.json.calories || null,
    average_cadence: activity.json.average_cadence || null,
    splits_json: activity.json.splits_metric || null,
    insight_sent: false,
    synced_at: new Date().toISOString()
  }
}));
```

---

### 3. Testar Fluxo Completo

```bash
# 1. Conectar Strava manualmente no banco (temporário para teste)
INSERT INTO choppinho.strava_connections (
  id, user_id, strava_athlete_id,
  access_token, refresh_token, token_expires_at,
  connected_at, is_valid
) VALUES (
  gen_random_uuid(),
  '8b1cbbad-4a56-4bcb-a0ea-2f08aaa38b74', -- User de teste
  12345678, -- Seu athlete_id do Strava
  'seu_access_token_real',
  'seu_refresh_token_real',
  NOW() + INTERVAL '6 hours',
  NOW(),
  true
);

# 2. Fazer login no app com (21) 98223 8663
# 3. Acessar /dashboard/settings
# 4. Verificar que aparece "Conectado"
# 5. Clicar em "Sincronizar Agora"
# 6. Verificar logs do N8N
# 7. Verificar activities inseridas no banco
# 8. Verificar dashboard com dados reais
```

---

## 📝 Checklist de Implementação

- [x] Backend: GET /api/strava/status
- [x] Backend: POST /api/strava/sync
- [x] Backend: POST /api/strava/disconnect (já existia)
- [x] Frontend: Strava state management
- [x] Frontend: fetchStravaStatus()
- [x] Frontend: handleSync()
- [x] Frontend: handleDisconnect()
- [x] Frontend: UI da seção Strava
- [x] Frontend: Toast notifications
- [x] Build testado com sucesso
- [ ] **Adicionar N8N_WEBHOOK_STRAVA_SYNC no Cloudflare**
- [ ] **Configurar workflow no N8N**
- [ ] **Testar com dados reais do Strava**
- [ ] Deploy e teste em produção

---

## 🔐 Segurança

**✅ Implementado:**
- Validação de sessão em todos os endpoints
- Token curto só pode ser usado por 1 usuário (validação por session_token)
- Webhook URL é secret (não exposta no frontend)

**⚠️ Melhorias futuras:**
- Adicionar assinatura HMAC no payload do webhook
- Rate limiting no endpoint /api/strava/sync (max 1 req/min por usuário)
- Validar que access_token pertence ao user_id antes de chamar webhook

---

## 🐛 Troubleshooting

### "Strava não está conectado"
- Verificar se há registro em `strava_connections` com `is_valid = true`
- Verificar se `user_id` do registro bate com usuário logado

### "Erro ao sincronizar"
- Verificar logs do Cloudflare Function: `wrangler pages deployment tail`
- Verificar se variável `N8N_WEBHOOK_STRAVA_SYNC` está configurada
- Verificar logs do N8N workflow
- Verificar se access_token expirou (N8N deve renovar automaticamente)

### Atividades não aparecem no dashboard
- Verificar se N8N inseriu dados na tabela `activities`
- Verificar se query do dashboard filtra por `user_id` correto
- Verificar se `strava_activity_id` está único (não duplicando)

---

## 📚 Referências

- [Strava API Docs](https://developers.strava.com/docs/reference/)
- [N8N Webhook Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)

---

**Status:** ✅ FASE 6 - Código completo, aguardando configuração de N8N webhook
