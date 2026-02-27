# 🚀 Guia de Deploy - Choppinho Fit v1.0.0

Guia passo a passo para colocar a aplicação em produção pela primeira vez.

---

## 📋 Pré-requisitos

- [ ] Conta no GitHub (para versionamento)
- [ ] Conta no Cloudflare (para hospedagem)
- [ ] Conta no Supabase (banco de dados)
- [ ] Instância do N8N rodando (para webhooks)
- [ ] Acesso ao repositório `vvianna/choppinho-web`

---

## 🔢 Passo 1: Push para o GitHub

### 1.1 Verificar branch e commits

```bash
cd /caminho/para/choppinho-web
git status
git log --oneline -5
```

**Commits esperados:**
```
ae24709 feat: melhora responsividade mobile em todas as páginas
f9741a5 docs: adiciona guia completo de debug do magic link
4ea23c9 fix: adiciona suporte ao parâmetro 'c' no magic link
...
```

### 1.2 Fazer push

```bash
git push origin feature/members-area
```

### 1.3 Criar Pull Request (opcional)

- Acesse: https://github.com/vvianna/choppinho-web/pulls
- Crie PR de `feature/members-area` → `main`
- Revise mudanças
- Merge quando aprovado

**OU fazer merge direto:**

```bash
git checkout main
git merge feature/members-area
git push origin main
```

---

## 🗄️ Passo 2: Configurar Banco de Dados (Supabase)

### 2.1 Conectar ao Supabase

```bash
# Via psql
psql -h <seu-host>.supabase.co -U postgres -d postgres

# OU via Supabase Dashboard → SQL Editor
```

### 2.2 Executar Migrations (em ordem)

#### ✅ Migration 1: Tabela de auth_tokens (se ainda não existir)
```bash
# Verificar se já existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'choppinho' 
  AND table_name = 'auth_tokens'
);

# Se retornar false, rodar o SQL da FASE 1
```

#### ✅ Migration 2: Adicionar campo nicknames
```sql
\i docs/migrations/ALTER-USERS-ADD-NICKNAMES.sql
```

**Ou copiar e colar:**
```sql
ALTER TABLE choppinho.users
ADD COLUMN IF NOT EXISTS nicknames JSONB DEFAULT '[]'::JSONB;

CREATE INDEX IF NOT EXISTS idx_users_nicknames
ON choppinho.users USING GIN (nicknames);
```

#### ✅ Migration 3: Criar tabela de provas
```sql
\i docs/migrations/CREATE-RACE-REGISTRATIONS.sql
```

**Ou copiar e colar o conteúdo do arquivo.**

#### ✅ Migration 4: Alterar auth_tokens.token para VARCHAR
```sql
\i docs/migrations/ALTER-AUTH-TOKENS.sql
```

**Ou:**
```sql
ALTER TABLE choppinho.auth_tokens
ALTER COLUMN token DROP DEFAULT;

ALTER TABLE choppinho.auth_tokens
ALTER COLUMN token TYPE VARCHAR(10) USING token::TEXT;
```

### 2.3 Verificar Migrations

```sql
-- Verificar campo nicknames
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'choppinho' 
  AND table_name = 'users' 
  AND column_name = 'nicknames';

-- Verificar tabela race_registrations
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'choppinho' 
  AND table_name = 'race_registrations'
);

-- Verificar tipo do token
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'choppinho' 
  AND table_name = 'auth_tokens' 
  AND column_name = 'token';
```

**Resultado esperado:**
```
nicknames       | jsonb
race_registrations | true
token | character varying | 10
```

---

## ☁️ Passo 3: Deploy no Cloudflare Pages

### 3.1 Conectar Repositório

1. Acesse: https://dash.cloudflare.com/
2. Pages → Create a project
3. Connect to Git → Selecione `vvianna/choppinho-web`
4. Branch: `main`

### 3.2 Configurar Build

**Build settings:**
```
Framework preset: None (ou Vite)
Build command: cd choppinho-fit && npm install && npm run build
Build output directory: choppinho-fit/dist
Root directory: /
```

### 3.3 Configurar Variáveis de Ambiente

**Settings → Environment Variables → Production**

Adicione as seguintes variáveis:

```bash
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
N8N_WEBHOOK_MAGIC_LINK=https://seu-n8n.com/webhook/magic-link
N8N_WEBHOOK_STRAVA_SYNC=https://seu-n8n.com/webhook/strava-sync
```

**Como obter os valores:**

- **SUPABASE_URL e SUPABASE_ANON_KEY:**
  - Dashboard Supabase → Settings → API
  - Copiar "Project URL" e "anon/public key"

- **N8N_WEBHOOK URLs:**
  - Criar workflows no N8N (ver passo 4)
  - Copiar URLs dos webhooks

### 3.4 Iniciar Deploy

- Click em "Save and Deploy"
- Aguarde build (~2-5 min)
- Deploy será automático

**URL de produção:**
```
https://choppinho-web.pages.dev
```

**Custom domain (se configurado):**
```
https://choppinhofit.com.br
```

---

## 🔧 Passo 4: Configurar Workflows N8N

### 4.1 Workflow: Magic Link (WhatsApp)

**Nome:** `Choppinho - Magic Link WhatsApp`

**Trigger:** Webhook
- Method: POST
- Path: `/webhook/magic-link`

**Nodes:**

1. **Webhook** (recebe dados)
   ```json
   {
     "phone_number": "+5521...",
     "token": "a7k9m2",
     "pin_code": "123456",
     "magic_link": "https://choppinhofit.com.br/auth?c=a7k9m2"
   }
   ```

2. **Function** (formatar mensagem)
   ```javascript
   const phone = $json.phone_number.replace('+', '');
   const pin = $json.pin_code;
   const link = $json.magic_link;
   
   return {
     json: {
       phone,
       message: `🍺 *Choppinho Fit*\n\nSeu código de acesso: *${pin}*\n\nOu clique no link:\n${link}\n\n_Válido por 5 minutos_`
     }
   };
   ```

3. **HTTP Request** (enviar WhatsApp)
   - URL: Sua API de WhatsApp (Evolution API, etc)
   - Method: POST
   - Body:
     ```json
     {
       "number": "{{ $json.phone }}",
       "text": "{{ $json.message }}"
     }
     ```

**Ativar workflow** e copiar URL do webhook.

---

### 4.2 Workflow: Strava Sync

**Nome:** `Choppinho - Strava Sync`

**Trigger:** Webhook
- Method: POST
- Path: `/webhook/strava-sync`

**Nodes:**

1. **Webhook** (recebe dados)
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

2. **IF** (verificar se token expirou)
   ```javascript
   const expiresAt = new Date($json.token_expires_at);
   const now = new Date();
   return expiresAt < now;
   ```

3. **HTTP Request** (refresh token - SE expirado)
   - URL: `https://www.strava.com/oauth/token`
   - Method: POST
   - Body:
     ```json
     {
       "client_id": "SUA_CLIENT_ID",
       "client_secret": "SEU_CLIENT_SECRET",
       "grant_type": "refresh_token",
       "refresh_token": "{{ $json.strava_refresh_token }}"
     }
     ```

4. **Supabase** (atualizar tokens - SE refreshed)
   - Operation: Update
   - Table: `strava_connections`
   - Filter: `user_id = {{ $json.user_id }}`
   - Data:
     ```json
     {
       "access_token": "{{ $json.access_token }}",
       "refresh_token": "{{ $json.refresh_token }}",
       "token_expires_at": "..."
     }
     ```

5. **HTTP Request** (buscar atividades Strava)
   - URL: `https://www.strava.com/api/v3/athlete/activities`
   - Method: GET
   - Headers: `Authorization: Bearer {{ $json.strava_access_token }}`
   - Query: `after={{ timestamp($json.sync_since) }}&per_page=200`

6. **Loop** (para cada atividade)

7. **Function** (transformar dados)
   ```javascript
   return {
     user_id: $('Webhook').item.json.user_id,
     strava_activity_id: $json.id,
     activity_type: $json.type,
     name: $json.name,
     start_date: $json.start_date,
     distance_meters: $json.distance,
     moving_time_seconds: $json.moving_time,
     elapsed_time_seconds: $json.elapsed_time,
     // ... outros campos
   };
   ```

8. **Supabase** (inserir atividade)
   - Operation: Insert
   - Table: `activities`
   - Conflict: `ON CONFLICT (user_id, strava_activity_id) DO UPDATE`

9. **Supabase** (atualizar last_sync)
   - Operation: Update
   - Table: `strava_connections`
   - Filter: `user_id = {{ $('Webhook').item.json.user_id }}`
   - Data: `{ "last_sync": "{{ $now }}" }`

**Ativar workflow** e copiar URL.

---

## ✅ Passo 5: Testar em Produção

### 5.1 Teste de Login

1. Acesse: `https://choppinhofit.com.br/login`
2. Digite telefone: `+5521982238663`
3. Verificar:
   - [ ] WhatsApp recebido com PIN e link
   - [ ] Link curto funciona: `/auth?c=xxxxx`
   - [ ] PIN funciona na tela de código
   - [ ] Redirect para `/dashboard`

### 5.2 Teste de Dashboard

1. Verificar carregamento de dados
2. Gráficos renderizam corretamente
3. Cards de atividades aparecem

### 5.3 Teste de Provas

1. Acessar `/dashboard/races`
2. Adicionar prova de teste:
   - Tipo: Corrida
   - Nome: "Teste Maratona"
   - Data: futuro
   - Distância: 42.2
3. Verificar:
   - [ ] Prova salva no banco
   - [ ] Countdown aparece
   - [ ] Edição funciona
   - [ ] Exclusão funciona

### 5.4 Teste de Settings

1. Acessar `/dashboard/settings`
2. Adicionar apelidos
3. Salvar alterações
4. Recarregar página
5. Verificar:
   - [ ] Apelidos persistidos
   - [ ] Toast de sucesso

### 5.5 Teste Mobile

1. Abrir DevTools (F12)
2. Toggle device toolbar
3. Testar em iPhone SE (375px)
4. Verificar:
   - [ ] Botões não se sobrepõem
   - [ ] Textos legíveis
   - [ ] Touch targets adequados

---

## 🔍 Passo 6: Monitoramento

### 6.1 Logs do Cloudflare

```bash
wrangler pages deployment tail
```

### 6.2 Logs do Supabase

Dashboard → Logs → Filter by table/operation

### 6.3 Metrics

- Cloudflare Analytics
- Supabase Dashboard → Reports

---

## 🐛 Troubleshooting

### Deploy falhou

**Erro:** "Build failed"
- Verificar logs no Cloudflare
- Testar build local: `npm run build`
- Verificar node_modules não commitados

### Magic link não funciona

- Verificar variável `N8N_WEBHOOK_MAGIC_LINK`
- Testar webhook N8N manualmente
- Ver logs no N8N

### Strava sync não funciona

- Verificar variável `N8N_WEBHOOK_STRAVA_SYNC`
- Verificar tokens não expiraram
- Ver logs do workflow N8N

### Dados não carregam

- Verificar variáveis SUPABASE_URL e SUPABASE_ANON_KEY
- Testar query direto no Supabase
- Ver logs do Cloudflare Function

---

## 📊 Checklist Final

### Infraestrutura
- [ ] GitHub: código commitado e pushed
- [ ] Supabase: todas migrations rodadas
- [ ] Cloudflare: deploy com sucesso
- [ ] Cloudflare: variáveis de ambiente configuradas
- [ ] N8N: workflow magic link ativo
- [ ] N8N: workflow strava sync ativo

### Funcionalidades
- [ ] Login com PIN funciona
- [ ] Login com magic link funciona
- [ ] Dashboard carrega dados
- [ ] Gráficos renderizam
- [ ] Adicionar prova funciona
- [ ] Editar/excluir prova funciona
- [ ] Settings salva dados
- [ ] Apelidos persistem
- [ ] Mobile responsivo

### Performance
- [ ] Página carrega em < 3s
- [ ] Sem erros no console
- [ ] Build size aceitável (< 1MB JS)

---

## 🎉 Conclusão

Parabéns! A **Choppinho Fit v1.0.0** está no ar! 🍺

**URL de produção:**
```
https://choppinhofit.com.br
```

**Próximos passos:**
- Ver [docs/BACKLOG.md](docs/BACKLOG.md) para próximas features
- Configurar monitoramento (Sentry, Analytics)
- Coletar feedback dos usuários

---

**Suporte:**
- Documentação: [docs/](docs/)
- Issues: GitHub Issues
- Contato: [email do time]
