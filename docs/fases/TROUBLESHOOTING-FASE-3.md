# 🔧 Troubleshooting - FASE 3: Magic Link

## ❌ **Problema: "Erro ao conectar com servidor. Tente novamente."**

Este erro acontece quando o frontend não consegue se comunicar com a Cloudflare Function `/api/auth/request`.

---

## 🔍 **Checklist de Diagnóstico**

### **1. Verificar Variáveis de Ambiente no Cloudflare**

As variáveis de ambiente **DEVEM** estar configuradas no Cloudflare Pages Dashboard:

✅ Acesse: https://dash.cloudflare.com/
✅ **Workers & Pages** → Seu projeto → **Settings** → **Environment variables**

**Variáveis obrigatórias:**

```env
SUPABASE_URL=https://hlvebuymxlxhsnbbvvkc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<seu-service-role-key>
N8N_WEBHOOK_MAGIC_LINK=https://webhook.vvmbrrj.com.br/webhook/magic-link
ENVIRONMENT=production
```

**⚠️ IMPORTANTE:**
- Certifique-se de que configurou para o ambiente **Production** (não apenas Preview)
- Após adicionar as variáveis, faça um **novo deploy** para aplicar

---

### **2. Verificar se o Deploy foi bem-sucedido**

✅ Acesse: https://dash.cloudflare.com/ → Seu projeto → **Deployments**
✅ Verifique se o último deploy está com status **Success** (verde)
✅ Verifique os logs do build para erros

---

### **3. Testar a Function Diretamente**

Teste a function diretamente via curl:

```bash
curl -X POST https://SEU-SITE.pages.dev/api/auth/request \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+5521967076547"}' \
  -v
```

**Respostas esperadas:**

**✅ Sucesso (200):**
```json
{
  "success": true,
  "message": "Magic link enviado para seu WhatsApp! Verifique suas mensagens."
}
```

**❌ Erro de validação (400):**
```json
{
  "success": false,
  "error": "Número de telefone inválido. Use formato: +5521967076547"
}
```

**❌ Erro de servidor (500):**
```json
{
  "success": false,
  "error": "Erro ao gerar token de autenticação"
}
```

ou

```json
{
  "success": false,
  "error": "Erro interno do servidor"
}
```

---

### **4. Verificar Logs da Function**

✅ Acesse: https://dash.cloudflare.com/ → Seu projeto → **Functions**
✅ Veja os logs de execução em tempo real
✅ Procure por erros como:

- `Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables`
- `Error creating auth token`
- `N8N webhook failed`

---

### **5. Verificar se a Function está sendo chamada**

Abra o **DevTools do navegador** (F12) → **Network**:

1. Acesse `/login`
2. Digite um número de telefone
3. Clique em "Enviar Link"
4. Na aba Network, procure pela requisição `request`

**O que verificar:**

- **Status Code:** Deve ser 200 (sucesso) ou 4xx/5xx (erro específico)
- **Response:** Verifique o JSON retornado
- **Request Headers:** Verifique se `Content-Type: application/json` está presente
- **Request Payload:** Verifique se o `phone_number` está no formato correto

---

### **6. Problemas Comuns e Soluções**

#### **Problema A: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"**

**Causa:** Variáveis de ambiente não configuradas

**Solução:**
1. Configure as variáveis no Cloudflare Pages Dashboard
2. Faça um novo deploy (ou force redeploy)
3. Aguarde o deploy finalizar (1-2 minutos)

---

#### **Problema B: "Error creating auth token"**

**Causa:** Erro de conexão com Supabase ou problema no banco

**Solução:**
1. Verifique se o SQL da FASE 1 foi executado corretamente
2. Verifique se a tabela `choppinho.auth_tokens` existe:
   ```sql
   SELECT * FROM information_schema.tables
   WHERE table_schema = 'choppinho'
     AND table_name = 'auth_tokens';
   ```
3. Verifique se a SERVICE_ROLE_KEY está correta:
   - https://supabase.com/dashboard/project/hlvebuymxlxhsnbbvvkc/settings/api
   - Copie o campo **service_role (secret)**

---

#### **Problema C: CORS Error (aparece no console do navegador)**

**Causa:** Headers CORS não configurados ou middleware não funcionando

**Solução:**
O middleware já está configurado em `/functions/_middleware.ts`. Se o erro persistir:

1. Verifique se o arquivo `_middleware.ts` foi deployado:
   ```bash
   ls -la functions/
   ```
2. Faça um novo deploy
3. Limpe o cache do navegador (Ctrl+Shift+Delete)

---

#### **Problema D: Function não encontrada (404)**

**Causa:** Roteamento não configurado corretamente

**Solução:**
1. Verifique se a estrutura de pastas está correta:
   ```
   /functions/
   ├── _middleware.ts
   └── api/
       └── auth/
           └── request.ts
   ```
2. O arquivo DEVE se chamar exatamente `request.ts` (não `request.tsx` ou `auth-request.ts`)
3. Faça um novo deploy

---

#### **Problema E: N8N webhook não dispara WhatsApp**

**Causa:** Webhook N8N com problema ou URL incorreta

**Solução:**
1. Teste o webhook N8N diretamente:
   ```bash
   curl -X POST https://webhook.vvmbrrj.com.br/webhook/magic-link \
     -H "Content-Type: application/json" \
     -d '{
       "phone_number": "+5521967076547",
       "token": "test-token-123",
       "magic_link": "https://test.com/auth/verify?token=test-token-123"
     }'
   ```
2. Verifique se o webhook responde com sucesso (200)
3. Verifique nos logs do N8N se a requisição foi recebida
4. **IMPORTANTE:** O token ainda é criado mesmo se o webhook falhar. O usuário pode testar acessando manualmente:
   ```
   https://SEU-SITE.pages.dev/auth/verify?token=<token-do-banco>
   ```

---

### **7. Como Verificar se o Token foi Criado no Banco**

Mesmo que o WhatsApp não seja enviado, o token deve ser criado no banco.

**Verifique no Supabase:**

1. Acesse: https://supabase.com/dashboard/project/hlvebuymxlxhsnbbvvkc/editor
2. Execute:
   ```sql
   SELECT * FROM choppinho.auth_tokens
   ORDER BY created_at DESC
   LIMIT 10;
   ```
3. Deve aparecer um registro com:
   - `phone_number`: Seu telefone
   - `token`: UUID gerado
   - `used`: false
   - `expires_at`: NOW() + 15 minutes

Se o token foi criado, você pode **testá-lo manualmente**:
```
https://SEU-SITE.pages.dev/auth/verify?token=<uuid-do-banco>
```

---

### **8. Forçar um Redeploy**

Se nada funcionar, force um redeploy:

1. Faça uma mudança mínima no código (ex: adicione um espaço em branco)
2. Commit e push:
   ```bash
   git add .
   git commit -m "chore: force redeploy"
   git push origin feature/members-area
   ```
3. Aguarde o deploy finalizar
4. Teste novamente

---

## 📞 **Teste Manual Rápido**

Para testar se o problema é no webhook ou na function:

### **Opção 1: Testar sem N8N**

Temporariamente, comente o bloco do webhook no código:

```typescript
// Comentar este bloco TEMPORARIAMENTE para testar:
/*
try {
  const webhookUrl = context.env.N8N_WEBHOOK_MAGIC_LINK;
  // ...
} catch (webhookError) {
  // ...
}
*/
```

Se funcionar, o problema está no webhook N8N.

### **Opção 2: Testar Token Manualmente**

1. Solicite o magic link
2. Vá no Supabase e copie o token criado
3. Acesse manualmente:
   ```
   https://SEU-SITE.pages.dev/auth/verify?token=<token-copiado>
   ```
4. Deve funcionar e redirecionar para o dashboard

---

## ✅ **Checklist Final**

Antes de reportar o bug, certifique-se:

- [ ] Variáveis de ambiente configuradas no Cloudflare
- [ ] Deploy bem-sucedido (status verde)
- [ ] SQL da FASE 1 executado no Supabase
- [ ] Tabela `auth_tokens` existe no schema `choppinho`
- [ ] SERVICE_ROLE_KEY está correta
- [ ] Webhook N8N responde corretamente
- [ ] Testou a function diretamente via curl
- [ ] Verificou os logs da function no Cloudflare
- [ ] Verificou o Network tab no DevTools
- [ ] Limpou cache do navegador

---

## 🆘 **Ainda com Problema?**

Me passe as seguintes informações:

1. **URL do seu site:** https://...
2. **Response da API** (copie do DevTools → Network → request → Response)
3. **Status Code** da requisição
4. **Logs da Function** (se disponível no Cloudflare Dashboard)
5. **Screenshot do erro** (se possível)

Com essas informações, consigo diagnosticar exatamente o problema! 🔍
