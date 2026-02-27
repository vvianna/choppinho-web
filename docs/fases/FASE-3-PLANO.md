# 🚀 FASE 3: Implementação Real - Autenticação & Backend

## 📋 Objetivo

Substituir os **mocks** por implementações **reais** usando:
- Cloudflare Functions (backend serverless)
- Supabase (banco de dados)
- N8N (envio de WhatsApp via webhook)

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│  Frontend       │  Login.tsx → chama /api/auth/request
│  (React)        │  AuthVerify.tsx → chama /api/auth/verify
└────────┬────────┘
         │
         ↓ HTTP POST/GET
┌─────────────────┐
│  Cloudflare     │  Functions serverless (FREE tier)
│  Functions      │  /functions/api/auth/request.ts
│  /functions/    │  /functions/api/auth/verify.ts
│                 │  /functions/api/auth/logout.ts
└────────┬────────┘  /functions/api/user/profile.ts
         │           /functions/api/stats/dashboard.ts
         ↓           /functions/api/strava/disconnect.ts
┌─────────────────┐
│  Supabase       │  Banco PostgreSQL (schema: choppinho)
│  Database       │  - users
│                 │  - auth_tokens
└────────┬────────┘  - strava_connections
         │           - activities
         ↓           - notification_preferences
┌─────────────────┐
│  N8N Webhook    │  Recebe requisição → Envia WhatsApp
│  (Magic Link)   │  Evolution API → Usuário recebe link
└─────────────────┘
```

---

## 📦 O QUE SERÁ CRIADO

### **1. Cloudflare Functions (6 arquivos)**

#### **Autenticação:**
```
/functions/api/auth/
├── request.ts    → POST - Solicitar magic link
├── verify.ts     → GET  - Verificar token e criar sessão
└── logout.ts     → POST - Fazer logout
```

#### **Usuário:**
```
/functions/api/user/
├── profile.ts    → GET - Buscar perfil completo do usuário
└── preferences.ts → PUT - Atualizar preferências de notificação
```

#### **Estatísticas:**
```
/functions/api/stats/
└── dashboard.ts  → GET - Stats agregadas para o dashboard
```

#### **Strava:**
```
/functions/api/strava/
└── disconnect.ts → POST - Desconectar Strava (is_valid = false)
```

---

### **2. Alterações no Frontend (substituir mocks)**

#### **Login.tsx:**
```tsx
// ANTES (mock):
setTimeout(() => {
  setStep("sent");
}, 1500);

// DEPOIS (real):
const response = await fetch('/api/auth/request', {
  method: 'POST',
  body: JSON.stringify({ phone_number: fullPhone })
});
```

#### **AuthVerify.tsx:**
```tsx
// ANTES (mock):
localStorage.setItem("choppinho_session_token", token);

// DEPOIS (real):
const response = await fetch(`/api/auth/verify?token=${token}`);
const { user, session_token } = await response.json();
localStorage.setItem("choppinho_session_token", session_token);
```

#### **Dashboard/Index.tsx:**
```tsx
// ANTES (mock):
const mockStats = { total_km: 32.5, ... };

// DEPOIS (real):
const stats = await fetch('/api/stats/dashboard', {
  headers: { Authorization: `Bearer ${sessionToken}` }
});
```

---

## 🔧 DETALHAMENTO DAS FUNCTIONS

### **1️⃣ POST /api/auth/request**

**Arquivo:** `/functions/api/auth/request.ts`

**Recebe:**
```json
{
  "phone_number": "+5521967076547"
}
```

**Faz:**
1. Valida formato do telefone (regex brasileiro)
2. Gera token UUID v4
3. Insere em `choppinho.auth_tokens`:
   ```sql
   INSERT INTO auth_tokens (phone_number, token, expires_at)
   VALUES ($1, gen_random_uuid(), NOW() + INTERVAL '15 minutes')
   RETURNING token
   ```
4. Monta magic link: `https://choppinho-web.pages.dev/auth/verify?token=xxx`
5. Chama webhook N8N:
   ```json
   POST https://webhook.vvmbrrj.com.br/webhook/magic-link
   {
     "phone_number": "+5521967076547",
     "token": "uuid-gerado",
     "magic_link": "https://..."
   }
   ```
6. Retorna:
   ```json
   {
     "success": true,
     "message": "Magic link enviado para seu WhatsApp"
   }
   ```

**Tempo estimado:** < 5ms (dentro do limite de 10ms do Cloudflare Free)

---

### **2️⃣ GET /api/auth/verify?token=xxx**

**Arquivo:** `/functions/api/auth/verify.ts`

**Recebe:**
```
Query param: token (UUID)
```

**Faz:**
1. Busca token em `auth_tokens`:
   ```sql
   SELECT * FROM auth_tokens
   WHERE token = $1
     AND used = false
     AND expires_at > NOW()
   ```
2. Se não encontrou → erro 401
3. Marca token como usado:
   ```sql
   UPDATE auth_tokens SET used = true WHERE token = $1
   ```
4. Busca ou cria usuário pelo `phone_number`:
   ```sql
   INSERT INTO users (phone_number, web_session_token, last_login_at)
   VALUES ($1, gen_random_uuid(), NOW())
   ON CONFLICT (phone_number)
   DO UPDATE SET
     web_session_token = gen_random_uuid(),
     last_login_at = NOW()
   RETURNING *
   ```
5. Retorna:
   ```json
   {
     "success": true,
     "user": { ... },
     "session_token": "uuid-da-sessao"
   }
   ```

**Tempo estimado:** < 8ms

---

### **3️⃣ POST /api/auth/logout**

**Arquivo:** `/functions/api/auth/logout.ts`

**Recebe:**
```
Header: Authorization: Bearer {session_token}
```

**Faz:**
1. Extrai session_token do header
2. Limpa session no banco:
   ```sql
   UPDATE users
   SET web_session_token = NULL
   WHERE web_session_token = $1
   ```
3. Retorna:
   ```json
   {
     "success": true
   }
   ```

**Tempo estimado:** < 3ms

---

### **4️⃣ GET /api/user/profile**

**Arquivo:** `/functions/api/user/profile.ts`

**Recebe:**
```
Header: Authorization: Bearer {session_token}
```

**Faz:**
1. Busca usuário pelo session_token
2. Faz JOIN com `strava_connections` e `notification_preferences`:
   ```sql
   SELECT
     u.*,
     sc.id as strava_id,
     sc.strava_athlete_id,
     sc.connected_at,
     sc.is_valid as strava_connected,
     np.*
   FROM users u
   LEFT JOIN strava_connections sc ON u.id = sc.user_id AND sc.is_valid = true
   LEFT JOIN notification_preferences np ON u.id = np.user_id
   WHERE u.web_session_token = $1
   ```
3. Retorna:
   ```json
   {
     "user": { ... },
     "strava_connection": { ... } | null,
     "notification_preferences": { ... } | null
   }
   ```

**Tempo estimado:** < 6ms

---

### **5️⃣ GET /api/stats/dashboard**

**Arquivo:** `/functions/api/stats/dashboard.ts`

**Recebe:**
```
Header: Authorization: Bearer {session_token}
Query params:
  - period=week|month (default: week)
```

**Faz:**
1. Busca user_id pelo session_token
2. Verifica se tem Strava conectado
3. Se não conectado → retorna `{ connected: false }`
4. Se conectado → query agregada:
   ```sql
   SELECT
     COUNT(*) as total_runs,
     ROUND(SUM(distance_meters)/1000, 2) as total_km,
     SUM(moving_time_seconds) as total_time,
     ROUND(AVG(average_speed), 2) as avg_speed,
     ROUND(AVG(average_heartrate), 0) as avg_heartrate,
     SUM(calories) as total_calories
   FROM activities
   WHERE user_id = $1
     AND activity_type = 'Run'
     AND start_date > NOW() - INTERVAL '7 days'
   ```
5. Busca últimas 10 atividades
6. Busca evolução semanal (últimas 4 semanas)
7. Retorna:
   ```json
   {
     "connected": true,
     "total_runs": 4,
     "total_km": 32.5,
     "avg_pace": "5:45",
     "total_time": 11820,
     "recent_activities": [...],
     "weekly_evolution": [...]
   }
   ```

**Tempo estimado:** < 9ms (otimizado com indexes)

---

### **6️⃣ POST /api/strava/disconnect**

**Arquivo:** `/functions/api/strava/disconnect.ts`

**Recebe:**
```
Header: Authorization: Bearer {session_token}
```

**Faz:**
1. Busca user_id pelo session_token
2. Marca conexão como inválida:
   ```sql
   UPDATE strava_connections
   SET is_valid = false
   WHERE user_id = $1
   ```
3. Retorna:
   ```json
   {
     "success": true,
     "message": "Strava desconectado com sucesso"
   }
   ```

**Tempo estimado:** < 3ms

---

## 🔐 VARIÁVEIS DE AMBIENTE

### **Configurar no Cloudflare Pages Dashboard:**

```env
# Supabase
SUPABASE_URL=https://hlvebuymxlxhsnbbvvkc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (do .env)

# N8N
N8N_WEBHOOK_MAGIC_LINK=https://webhook.vvmbrrj.com.br/webhook/magic-link

# JWT (opcional - pode usar UUID também)
JWT_SECRET=<gerar com: openssl rand -base64 32>

# Ambiente
ENVIRONMENT=production
```

---

## 📝 N8N WEBHOOK NECESSÁRIO

### **Webhook:** `/webhook/magic-link`

**Método:** POST

**Recebe:**
```json
{
  "phone_number": "+5521967076547",
  "token": "uuid-do-token",
  "magic_link": "https://choppinho-web.pages.dev/auth/verify?token=uuid"
}
```

**Faz:**
1. Formata mensagem WhatsApp:
   ```
   🔐 *Choppinho Fit - Acesso ao Dashboard*

   Olá! Clique no link abaixo para acessar sua área de membros:

   {magic_link}

   ⏰ Este link expira em 15 minutos.

   Se você não solicitou este acesso, ignore esta mensagem.
   ```
2. Envia via Evolution API para `phone_number`
3. Retorna sucesso

**Você já tem esse webhook ou preciso ajudar a criar?**

---

## ✅ ORDEM DE EXECUÇÃO

### **Passo 1: Criar Functions (eu faço)**
- [ ] Criar `/functions/api/auth/request.ts`
- [ ] Criar `/functions/api/auth/verify.ts`
- [ ] Criar `/functions/api/auth/logout.ts`
- [ ] Criar `/functions/api/user/profile.ts`
- [ ] Criar `/functions/api/stats/dashboard.ts`
- [ ] Criar `/functions/api/strava/disconnect.ts`

### **Passo 2: Substituir mocks no frontend (eu faço)**
- [ ] Atualizar `Login.tsx` → usar `/api/auth/request`
- [ ] Atualizar `AuthVerify.tsx` → usar `/api/auth/verify`
- [ ] Atualizar `Dashboard/Index.tsx` → usar `/api/stats/dashboard`
- [ ] Atualizar `ProtectedRoute.tsx` → validar session real

### **Passo 3: Configurar (você faz)**
- [ ] Adicionar variáveis de ambiente no Cloudflare Pages
- [ ] Configurar webhook N8N (se ainda não tiver)
- [ ] Testar envio de WhatsApp

### **Passo 4: Deploy & Teste**
- [ ] Push para branch `feature/members-area`
- [ ] Cloudflare gera preview automático
- [ ] Testar fluxo completo no preview
- [ ] Merge para `main` quando estiver 100%

---

## ⚡ OTIMIZAÇÕES CLOUDFLARE FREE TIER

### **Respeitando limite de 10ms CPU:**

1. **Queries otimizadas com indexes** ✅
2. **Sem loops desnecessários** ✅
3. **Conexão reutilizada com Supabase** ✅
4. **Apenas 1 webhook HTTP externo** (N8N) ✅
5. **Cache futuro** (opcional - Cloudflare KV)

### **Limites monitorados:**
- 100.000 requisições/dia (FREE)
- 10ms CPU time por request
- Request succeeds < 120ms total

---

## 🧪 TESTES

### **Teste 1: Magic Link**
```bash
curl -X POST http://localhost:8788/api/auth/request \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+5521967076547"}'

# Espera: 200 OK + WhatsApp recebido
```

### **Teste 2: Verificar Token**
```bash
curl http://localhost:8788/api/auth/verify?token=<uuid-recebido>

# Espera: 200 OK + session_token
```

### **Teste 3: Dashboard**
```bash
curl http://localhost:8788/api/stats/dashboard \
  -H "Authorization: Bearer <session_token>"

# Espera: 200 OK + stats ou {connected: false}
```

---

## 📊 PROGRESSO ATUAL

- ✅ **FASE 1:** Banco de dados (SQL executado)
- ✅ **FASE 2:** Setup frontend (types, supabase, api)
- ✅ **FASE 2.5:** UI Mock (Login + Dashboard fake)
- ⏳ **FASE 3:** Implementação real ← **ESTAMOS AQUI**
- ⏳ **FASE 4:** Dashboard completo (gráficos Recharts)
- ⏳ **FASE 5:** Configurações (WhatsApp, Plano)

---

## 🎯 DECISÕES NECESSÁRIAS

Antes de começar a implementação, preciso saber:

1. **Webhook N8N:**
   - [ ] Já existe? Qual URL?
   - [ ] Preciso criar? Me passa detalhes do Evolution API

2. **Variáveis de ambiente:**
   - [ ] Confirmadas no .env?
   - [ ] JWT_SECRET: usar ou gerar UUID apenas?

3. **Prioridade:**
   - [ ] Fazer tudo de uma vez? (6 functions)
   - [ ] Fazer incremental? (auth primeiro, depois resto)

**Me confirma e eu começo a implementar!** 🚀
