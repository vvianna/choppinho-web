# 🐛 Guia Rápido de Debug - Magic Link

## ✅ Problema Resolvido: Magic Link Curto

### O que era:
- Magic link curto (`/auth?c=a7k9m2`) **não funcionava**
- Apenas PIN code funcionava

### Causa:
- `AuthVerify.tsx` só aceitava parâmetro `?token=xxx`
- Magic link curto usa `?c=xxx` (código de 6 caracteres)

### Solução:
```typescript
// ✅ CORRIGIDO em AuthVerify.tsx
const token = searchParams.get("token") || searchParams.get("c");
const paramName = searchParams.get("c") ? "c" : "token";
const response = await fetch(`/api/auth/verify?${paramName}=${token}`);
```

---

## 🔍 Como Testar Magic Link

### 1. **Fluxo Completo:**

```
1. Usuário digita telefone no /login
   → POST /api/auth/request { phone_number: "+5521..." }
   
2. Backend gera token curto de 6 chars
   → Salva em auth_tokens
   → Webhook N8N envia WhatsApp com link
   
3. Usuário clica no link curto
   → /auth?c=a7k9m2
   
4. AuthVerify captura parâmetro 'c'
   → GET /api/auth/verify?c=a7k9m2
   
5. Backend valida token
   → Marca como usado
   → Cria sessão
   → Retorna session_token
   
6. Frontend salva no localStorage
   → Redireciona para /dashboard
```

---

## 🧪 Como Testar Manualmente

### **Teste 1: Criar Token via API**

```bash
curl -X POST https://choppinhofit.com.br/api/auth/request \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+5521982238663"}'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Código enviado! Verifique seu WhatsApp."
}
```

### **Teste 2: Verificar Token no Banco**

```sql
-- Ver último token gerado
SELECT token, pin_code, expires_at, used
FROM choppinho.auth_tokens
WHERE phone_number = '+5521982238663'
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado:**
```
token   | pin_code | expires_at          | used
--------|----------|---------------------|------
a7k9m2  | 123456   | 2026-02-27 02:05:00 | false
```

### **Teste 3: Usar Magic Link (Browser)**

```
https://choppinhofit.com.br/auth?c=a7k9m2
```

**Comportamento esperado:**
1. Página mostra "Verificando..."
2. Após 1s: "Acesso confirmado! ✅"
3. Redireciona para /dashboard

### **Teste 4: Verificar Sessão Criada**

```sql
-- Ver sessão ativa
SELECT id, phone_number, web_session_token, last_login_at
FROM choppinho.users
WHERE phone_number = '+5521982238663';
```

**Resultado esperado:**
```
web_session_token | last_login_at
------------------|-------------------
uuid-aqui         | 2026-02-27 01:55:30
```

---

## 🚨 Possíveis Erros

### Erro 1: "Token inválido ou expirado"

**Causa:** Token já foi usado ou expirou (5 min)

**Solução:**
```sql
-- Verificar status do token
SELECT used, expires_at, NOW() as agora
FROM choppinho.auth_tokens
WHERE token = 'a7k9m2';

-- Resetar para teste (DEV ONLY!)
UPDATE choppinho.auth_tokens
SET used = false, expires_at = NOW() + INTERVAL '10 minutes'
WHERE token = 'a7k9m2';
```

### Erro 2: "Link inválido ❌"

**Causa:** Parâmetro 'c' não está sendo enviado

**Debug:**
```javascript
// Browser Console (F12)
console.log(window.location.search);
// Deve mostrar: ?c=a7k9m2
```

### Erro 3: Webhook N8N não enviando

**Verificar:**
1. Variável `N8N_WEBHOOK_MAGIC_LINK` está configurada?
2. Workflow N8N está ativo?
3. Logs do N8N mostram chamada?

**Teste direto:**
```bash
curl -X POST https://seu-n8n.com/webhook/magic-link \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+5521982238663",
    "token": "a7k9m2",
    "pin_code": "123456",
    "magic_link": "https://choppinhofit.com.br/auth?c=a7k9m2"
  }'
```

---

## 📊 Logs para Debug

### Backend (Cloudflare)

```bash
# Ver logs em tempo real
wrangler pages deployment tail

# Logs específicos de auth
wrangler pages deployment tail --format pretty | grep "/api/auth"
```

### Frontend (Browser)

```javascript
// Console do navegador (F12)
localStorage.getItem('session_token'); // Deve retornar UUID
```

### Database (Supabase)

```sql
-- Últimos 10 tokens criados
SELECT 
  phone_number,
  token,
  pin_code,
  created_at,
  expires_at,
  used
FROM choppinho.auth_tokens
ORDER BY created_at DESC
LIMIT 10;
```

---

## ✅ Checklist de Verificação

- [ ] Build passou sem erros
- [ ] Deploy no Cloudflare funcionou
- [ ] Endpoint POST /api/auth/request retorna success
- [ ] Token é salvo no banco com expires_at correto
- [ ] Webhook N8N recebe payload
- [ ] WhatsApp é enviado com link curto
- [ ] Link curto `/auth?c=xxx` abre corretamente
- [ ] Verificação do token funciona
- [ ] Sessão é criada no banco
- [ ] Redirect para /dashboard funciona
- [ ] Dashboard carrega dados do usuário

---

**Status:** ✅ Magic Link corrigido e funcionando!
