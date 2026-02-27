# FASE 6 - Strava Sync via N8N Webhook ✅

## 📋 Resumo

Implementação completa do sistema de sincronização do Strava via webhook N8N, permitindo que usuários sincronizem suas atividades manualmente através da página de configurações.

---

## 🎯 O que foi implementado

### Backend (Cloudflare Functions)

#### 1. **GET /api/strava/status**
Retorna status da conexão Strava do usuário autenticado.

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "athlete_id": 12345678,
    "last_sync": "2025-02-26T10:30:00Z",
    "total_activities": 42
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
Dispara webhook N8N para sincronizar atividades.

**Request:** `{}` (vazio - user_id vem da sessão)

**Response:**
```json
{
  "success": true,
  "message": "Sincronização iniciada com sucesso"
}
```

**Lógica:**
1. Valida sessão do usuário
2. Busca conexão Strava válida (com access_token e refresh_token)
3. Retorna erro se não estiver conectado
4. Monta payload para N8N com tokens e sync_since (últimos 30 dias)
5. Chama webhook N8N (URL da env `N8N_WEBHOOK_STRAVA_SYNC`)
6. Retorna sucesso (fire-and-forget assíncrono)

**Variável de ambiente necessária:**
```bash
N8N_WEBHOOK_STRAVA_SYNC=https://seu-n8n.com/webhook/strava-sync
```

---

### Frontend (React)

#### **src/pages/dashboard/Settings.tsx**

**Novo estado:**
- `stravaConnected`, `stravaAthleteId`, `stravaLastSync`, `stravaTotalActivities`, `syncing`

**Funções:**
- `fetchStravaStatus()` - carrega status na montagem
- `handleSync()` - dispara sincronização manual
- `handleDisconnect()` - desconecta conta Strava

**UI adicionada:**
- Seção "Strava" com status de conexão
- Botão "Sincronizar Agora" com loading state
- Informações: Atleta ID, total atividades, última sync
- Toast notifications para feedback

---

## 🔗 Fluxo Completo

1. Usuário clica "Sincronizar Agora"
2. Frontend chama POST /api/strava/sync
3. Cloudflare Function valida sessão e chama webhook N8N
4. N8N busca atividades da API Strava
5. N8N salva atividades no Supabase
6. Frontend atualiza status automaticamente

---

## 🚀 Próximos Passos

### 1. Configurar Variável de Ambiente no Cloudflare

```bash
# Via Cloudflare Dashboard:
# Pages > choppinho-web > Settings > Environment Variables
# Adicionar: N8N_WEBHOOK_STRAVA_SYNC
```

### 2. Criar Workflow no N8N

**Estrutura sugerida:**

```
[Webhook Trigger]
    ↓
[Function: Check Token Expiry]
    ↓
[IF: Token expirado?]
    ├─ SIM → [HTTP: Refresh Strava Token]
    └─ NÃO → (continua)
    ↓
[HTTP: GET Strava Activities]
    ↓
[Loop: Para cada atividade]
    ↓
[Supabase: Upsert Activity]
    ↓
[Supabase: Update Last Sync]
```

**Payload esperado pelo webhook:**
```json
{
  "user_id": "uuid",
  "strava_athlete_id": 12345,
  "strava_access_token": "xxx",
  "strava_refresh_token": "yyy",
  "token_expires_at": "2025-03-01T12:00:00Z",
  "sync_since": "2025-01-27T00:00:00Z"
}
```

---

## 📝 Checklist

- [x] Backend: GET /api/strava/status
- [x] Backend: POST /api/strava/sync
- [x] Frontend: Strava UI e handlers
- [x] Build testado com sucesso
- [ ] **Adicionar N8N_WEBHOOK_STRAVA_SYNC no Cloudflare**
- [ ] **Configurar workflow no N8N**
- [ ] **Testar com dados reais do Strava**

---

**Status:** ✅ Código completo, aguardando configuração de N8N webhook
