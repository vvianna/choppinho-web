# 🔍 Debug do Strava Sync

## Problema
Erro ao sincronizar com Strava: `{"success":false,"error":"Erro ao sincronizar com Strava. Tente novamente."}`

O webhook não está recebendo a mensagem.

---

## 📊 Fluxo de Sincronização

```
[Frontend] → [Cloudflare Functions] → [N8N Webhook] → [Strava API] → [Supabase]
    ↓              ↓                      ↓               ↓             ↓
  Botão        POST /api/          POST webhook    GET activities   INSERT
  Sync         strava/sync         com payload     from Strava      activities
```

---

## 🧪 Checklist de Debug

### 1️⃣ Verificar variáveis de ambiente em produção

**Local:** Cloudflare Pages Dashboard → Settings → Environment Variables → Production

Verificar se existe:
- ✅ `N8N_WEBHOOK_STRAVA_SYNC`
- ✅ Valor: `https://webhook.vvmbrrj.com.br/webhook/strava-sync`

**Como testar:**
```bash
curl https://choppinhofit.com.br/api/debug
```

Verificar o campo `N8N_WEBHOOK_STRAVA_SYNC` no response:
```json
{
  "environment": {
    "N8N_WEBHOOK_STRAVA_SYNC": "SET",
    "WEBHOOK_STRAVA_SYNC_URL": "https://webhook.vvmbrrj.com.br/webhook/strava-sync"
  }
}
```

**Se estiver MISSING:**
1. Adicionar variável no Cloudflare
2. Fazer redeploy (ou aguardar próximo deploy)

---

### 2️⃣ Testar webhook N8N diretamente

**Com script bash:**
```bash
cd /home/ubuntu/code/personal/choppinho-web
./test-webhook-strava.sh
```

**Com curl manual:**
```bash
curl -X POST https://webhook.vvmbrrj.com.br/webhook/strava-sync \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-123",
    "strava_athlete_id": 12345,
    "strava_access_token": "test_token",
    "strava_refresh_token": "test_refresh",
    "token_expires_at": "2026-12-31T23:59:59Z",
    "sync_since": "2026-01-28T00:00:00Z"
  }' \
  -v
```

**Respostas esperadas:**

✅ **Sucesso (200/201):**
```json
{
  "success": true,
  "activities_synced": 10,
  "activities_new": 5,
  "activities_updated": 5
}
```

❌ **Erro 404:** Workflow não existe ou URL errada
❌ **Erro 500:** Workflow com erro interno
❌ **Timeout:** N8N não está respondendo
❌ **Connection refused:** N8N offline ou firewall bloqueando

---

### 3️⃣ Verificar workflow N8N

**Acessar:** https://n8n.vvmbrrj.com.br (ou sua instância)

Checklist:
- [ ] Workflow "Strava Sync" está **ativado** (toggle ON)
- [ ] Webhook tem o path `/webhook/strava-sync`
- [ ] Webhook está em modo **Production** (não Test)
- [ ] Workflow não tem erros salvos

**Como testar:**
1. Abrir workflow no N8N
2. Clicar em "Executions" (histórico)
3. Verificar se há execuções recentes
4. Se não há execuções → webhook não está recebendo

---

### 4️⃣ Testar conexão Strava no banco

**Endpoint de debug:**
```bash
# Substitua SEU_TOKEN pelo seu session token
curl https://choppinhofit.com.br/api/strava/debug \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Como pegar o token:**
1. Abrir DevTools no navegador (F12)
2. Ir para Application → Cookies
3. Procurar por `cf_session`

**Response esperado:**
```json
{
  "success": true,
  "debug": {
    "user": {
      "id": "uuid-do-usuario",
      "email": "seu@email.com"
    },
    "strava_connection": {
      "connected": true,
      "athlete_id": 123456,
      "is_valid": true,
      "token_expired": false,
      "has_access_token": true,
      "has_refresh_token": true
    },
    "webhook": {
      "configured": true,
      "url": "https://webhook.vvmbrrj.com.br/webhook/strava-sync",
      "test": {
        "status": 200,
        "ok": true,
        "response_time_ms": 450
      }
    }
  }
}
```

**Possíveis problemas:**

❌ `"connected": false` → Strava não está conectado, fazer OAuth novamente
❌ `"is_valid": false` → Conexão inválida, reconectar
❌ `"token_expired": true` → Token expirado, N8N precisa fazer refresh
❌ `"webhook.test.status": 404` → Webhook não existe
❌ `"webhook.test.status": 500` → Erro no workflow N8N
❌ `"webhook.configured": false` → Variável de ambiente não configurada

---

### 5️⃣ Verificar logs do Cloudflare

**Local:** Cloudflare Pages Dashboard → Functions → Logs

Procurar por:
```
Calling N8N webhook for Strava sync: { user_id: '...', athlete_id: ... }
```

**Logs de erro possíveis:**

```
N8N webhook failed: 404 Not Found
```
→ Webhook URL errada ou workflow desativado

```
N8N webhook failed: Timeout
```
→ N8N demorando muito ou offline

```
N8N webhook failed: Network error
```
→ Cloudflare bloqueado pelo firewall do N8N

---

### 6️⃣ Verificar logs do N8N

**Local:** N8N Dashboard → Executions

Se não há execuções:
- Webhook não está sendo chamado
- Verificar URL e variável de ambiente

Se há execuções com erro:
- Abrir execução
- Ver qual step falhou
- Comum: erro ao chamar Strava API (token inválido)

---

## 🛠️ Soluções Comuns

### Problema: Webhook retorna 404

**Causa:** URL errada ou workflow desativado

**Solução:**
1. Verificar URL no N8N: deve ser `/webhook/strava-sync`
2. Verificar se workflow está ativado
3. Atualizar variável `N8N_WEBHOOK_STRAVA_SYNC` no Cloudflare
4. Redeploy

### Problema: Webhook retorna 500

**Causa:** Erro no workflow N8N

**Solução:**
1. Abrir N8N → Executions
2. Ver última execução com erro
3. Identificar step que falhou
4. Corrigir workflow
5. Testar novamente

### Problema: Token Strava expirado

**Causa:** Access token do Strava tem validade de 6h

**Solução:**
O workflow N8N deve ter um step para fazer refresh do token:

```javascript
// N8N Function node
const expiresAt = new Date($json.token_expires_at);
const now = new Date();

if (expiresAt < now) {
  // Token expirado, fazer refresh
  return {
    needsRefresh: true,
    refreshToken: $json.strava_refresh_token
  };
}

return {
  needsRefresh: false,
  accessToken: $json.strava_access_token
};
```

### Problema: Timeout

**Causa:** N8N demorando muito (>30s)

**Solução:**
1. Otimizar workflow N8N
2. Processar atividades em lote menor
3. Considerar fazer sync assíncrono (N8N retorna imediatamente e processa em background)

---

## 📝 Exemplo de Workflow N8N Completo

```
┌─────────────────┐
│  Webhook        │ POST /webhook/strava-sync
│  Trigger        │ Recebe: user_id, tokens, sync_since
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Check Token    │ Verifica se token está expirado
│  Expiration     │ Se sim → refresh
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Strava API     │ GET /athlete/activities
│  Get Activities │ after: sync_since, per_page: 30
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Loop Activities│ Para cada atividade
│                 │ └─> Upsert no Supabase
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Response       │ { activities_synced: N }
└─────────────────┘
```

---

## 🚀 Deploy Após Correções

Após fazer qualquer alteração:

```bash
cd choppinho-fit
npm run build
git add .
git commit -m "fix: corrige sincronização Strava"
git push origin main
```

Cloudflare faz deploy automático em ~2 minutos.

---

## 📚 Arquivos Relacionados

- [functions/api/strava/sync.ts](../choppinho-fit/functions/api/strava/sync.ts#L72-L84) - Endpoint de sync
- [functions/api/strava/debug.ts](../choppinho-fit/functions/api/strava/debug.ts) - Endpoint de debug
- [functions/api/debug.ts](../choppinho-fit/functions/api/debug.ts#L26-L27) - Debug geral
- [test-webhook-strava.sh](../test-webhook-strava.sh) - Script de teste

---

## ✅ Checklist Final

Antes de abrir issue:

- [ ] Variável `N8N_WEBHOOK_STRAVA_SYNC` configurada em produção
- [ ] Webhook N8N responde com 200 ao testar diretamente
- [ ] Workflow N8N está ativado
- [ ] Conexão Strava válida no banco (`is_valid: true`)
- [ ] Token Strava não expirado (ou workflow faz refresh)
- [ ] Logs do Cloudflare mostram chamada ao webhook
- [ ] Logs do N8N mostram execução do workflow

Se todos os itens estão ✅ e ainda não funciona:
1. Verificar se há firewall bloqueando
2. Testar com ferramenta externa (Postman, Insomnia)
3. Verificar se N8N está em modo de produção
