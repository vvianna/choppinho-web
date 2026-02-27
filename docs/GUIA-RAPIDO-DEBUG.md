# 🔧 Guia Rápido de Debug - Magic Link

## 🚨 Erro: "Configuração do servidor incompleta"

Este erro significa que as **variáveis de ambiente não estão sendo lidas** pela Cloudflare Function.

---

## ✅ **Passo 1: Testar o Endpoint de Debug**

Acesse diretamente no navegador:

```
https://feature-members-area.choppinho-web.pages.dev/api/debug
```

**Resultado esperado:**

```json
{
  "message": "Debug info",
  "environment": {
    "SUPABASE_URL": "SET",
    "SUPABASE_URL_PREFIX": "https://hlvebuymxlxhsnb",
    "SUPABASE_SERVICE_ROLE_KEY": "SET",
    "SERVICE_KEY_PREFIX": "eyJhbGciOiJIUzI1NiIsI",
    "N8N_WEBHOOK_MAGIC_LINK": "SET",
    "WEBHOOK_URL": "https://webhook.vvmbrrj.com.br/webhook/magic-link",
    "ENVIRONMENT": "production"
  },
  "timestamp": "2026-02-26T...",
  "url": "https://..."
}
```

### **Interpretação:**

✅ **Todas as variáveis mostram "SET"** → Variáveis configuradas corretamente
❌ **Alguma mostra "MISSING"** → Falta configurar essa variável
❌ **Todas mostram "undefined"** → Variáveis não estão sendo lidas

---

## 🔍 **Passo 2: Diagnóstico Baseado no Debug**

### **Cenário A: Todas as variáveis estão "MISSING" ou "undefined"**

**Causa:** As variáveis não foram configuradas **para o ambiente correto** (Preview vs Production)

**Solução:**

1. Vá em: https://dash.cloudflare.com/ → Workers & Pages → choppinho-web
2. Settings → Environment variables
3. **IMPORTANTE:** Verifique se as variáveis estão marcadas para **Preview** também
4. Se não estiverem, edite cada variável e marque **Preview**
5. Faça um novo deploy (Deployments → Retry deployment)

---

### **Cenário B: Apenas algumas variáveis estão "MISSING"**

**Causa:** Essas variáveis específicas não foram configuradas

**Solução:**

Configure as variáveis que estão faltando:

**Variáveis obrigatórias:**

```env
SUPABASE_URL=https://hlvebuymxlxhsnbbvvkc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<sua-chave-do-supabase>
N8N_WEBHOOK_MAGIC_LINK=https://webhook.vvmbrrj.com.br/webhook/magic-link
ENVIRONMENT=production
```

---

### **Cenário C: Todas as variáveis mostram "SET" mas ainda dá erro**

**Causa:** O problema está no código da function ou na conexão com Supabase

**Solução:** Vá para o **Passo 3** abaixo

---

## 🧪 **Passo 3: Verificar Logs da Function**

1. Acesse: https://dash.cloudflare.com/ → Workers & Pages → choppinho-web
2. Clique em **Real-time Logs** (ou **Functions**)
3. Tente fazer login novamente no site
4. Observe os logs em tempo real

**Procure por:**

- `Environment check:` - Mostra se as variáveis foram detectadas
- `Missing environment variables:` - Lista quais estão faltando
- `Error creating auth token:` - Erro ao criar token no banco
- `Error creating Supabase client:` - Erro ao conectar com Supabase

---

## 🎯 **Passo 4: Soluções por Tipo de Erro**

### **Erro: "SUPABASE_URL: false, SERVICE_KEY: false"**

→ Variáveis não configuradas para o ambiente Preview
→ **Solução:** Configure para Preview também e faça redeploy

### **Erro: "Error creating Supabase client"**

→ SERVICE_ROLE_KEY incorreta ou malformada
→ **Solução:** Copie novamente do Supabase (https://supabase.com/dashboard/project/hlvebuymxlxhsnbbvvkc/settings/api)

### **Erro: "Error creating auth token"**

→ Tabela `auth_tokens` não existe ou sem permissão
→ **Solução:** Execute o SQL da FASE 1 novamente

---

## 📋 **Checklist de Verificação**

- [ ] Testei `/api/debug` e todas as variáveis mostram "SET"
- [ ] As variáveis estão configuradas para **Preview** e **Production**
- [ ] A `SUPABASE_SERVICE_ROLE_KEY` está correta (começa com `eyJhbGci...`)
- [ ] A URL do webhook N8N está correta
- [ ] Fiz redeploy depois de configurar as variáveis
- [ ] Aguardei o deploy finalizar (status verde)
- [ ] Limpei o cache do navegador (Ctrl+Shift+Delete)

---

## 🆘 **Se Ainda Não Funcionar**

Me passe estas informações:

1. **Resultado do `/api/debug`** (copie o JSON completo)
2. **Logs da Function** (do Cloudflare Dashboard)
3. **Mensagem de erro específica** (do Network tab no DevTools)
4. **Print da tela de Environment Variables** (para verificar configuração)

---

## 💡 **Teste Rápido (Bypass do Problema)**

Mesmo que o WhatsApp não funcione, você pode testar o token manualmente:

1. Tente solicitar o magic link (vai dar erro)
2. Acesse: https://supabase.com/dashboard/project/hlvebuymxlxhsnbbvvkc/editor
3. Execute:
   ```sql
   SELECT token FROM choppinho.auth_tokens
   ORDER BY created_at DESC
   LIMIT 1;
   ```
4. Copie o token e acesse:
   ```
   https://feature-members-area.choppinho-web.pages.dev/auth/verify?token=<token-copiado>
   ```

Se isso funcionar, o problema está **apenas no webhook N8N**, não na autenticação!

---

## 📊 **Status Atual**

- ✅ Functions deployadas corretamente
- ✅ Endpoint `/api/debug` disponível
- ⏳ Aguardando configuração de variáveis de ambiente
- ⏳ Aguardando teste do fluxo completo

---

**Faça o push e teste o `/api/debug` primeiro!** 🔍
