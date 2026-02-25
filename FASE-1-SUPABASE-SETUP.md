# 🗄️ FASE 1: Setup do Banco de Dados Supabase

## Instruções

Execute os comandos SQL abaixo no **SQL Editor** do Supabase Dashboard:

1. Acesse: https://supabase.com/dashboard/project/hlvebuymxlxhsnbbvvkc/editor
2. Clique em **SQL Editor** no menu lateral
3. Clique em **New query**
4. Cole todo o conteúdo deste arquivo
5. Clique em **Run** (ou pressione Ctrl+Enter)

---

## 📊 Comandos SQL

### 1️⃣ Adicionar campos necessários na tabela `users`

```sql
-- Adicionar campos para autenticação web e assinatura
ALTER TABLE choppinho.users
  ADD COLUMN IF NOT EXISTS web_session_token TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Index para busca rápida por telefone (usado no magic link)
CREATE INDEX IF NOT EXISTS idx_users_phone_number
  ON choppinho.users(phone_number);

-- Index para busca por session token
CREATE INDEX IF NOT EXISTS idx_users_session_token
  ON choppinho.users(web_session_token) WHERE web_session_token IS NOT NULL;
```

---

### 2️⃣ Criar tabela `auth_tokens` para Magic Link

```sql
-- Tabela para armazenar tokens temporários do magic link
CREATE TABLE IF NOT EXISTS choppinho.auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '15 minutes',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token
  ON choppinho.auth_tokens(token) WHERE used = false;

CREATE INDEX IF NOT EXISTS idx_auth_tokens_phone
  ON choppinho.auth_tokens(phone_number, created_at DESC);

-- Comentários para documentação
COMMENT ON TABLE choppinho.auth_tokens IS 'Tokens temporários para autenticação via magic link (WhatsApp)';
COMMENT ON COLUMN choppinho.auth_tokens.token IS 'Token UUID enviado via WhatsApp, válido por 15 minutos';
COMMENT ON COLUMN choppinho.auth_tokens.used IS 'Marcado como true após uso bem-sucedido';
```

---

### 3️⃣ Ajustar tabela `notification_preferences`

```sql
-- Adicionar campos para personalização do resumo semanal
ALTER TABLE choppinho.notification_preferences
  ADD COLUMN IF NOT EXISTS weekly_summary_day TEXT DEFAULT 'monday',
  ADD COLUMN IF NOT EXISTS weekly_summary_time TIME DEFAULT '08:00:00',
  ADD COLUMN IF NOT EXISTS paused_until TIMESTAMPTZ DEFAULT NULL;

-- Comentários
COMMENT ON COLUMN choppinho.notification_preferences.weekly_summary_day IS 'Dia da semana para envio do resumo (monday, tuesday, etc.)';
COMMENT ON COLUMN choppinho.notification_preferences.weekly_summary_time IS 'Horário do dia para envio do resumo';
COMMENT ON COLUMN choppinho.notification_preferences.paused_until IS 'Data até quando as notificações estão pausadas (NULL = não pausado)';
```

---

### 4️⃣ Criar indexes para otimização de performance

```sql
-- Index composto para queries do dashboard (critical path)
-- Usado em: SELECT * FROM activities WHERE user_id = X ORDER BY start_date DESC LIMIT 50
CREATE INDEX IF NOT EXISTS idx_activities_user_date
  ON choppinho.activities(user_id, start_date DESC)
  WHERE activity_type = 'Run';

-- Index para buscar apenas conexões válidas do Strava
CREATE INDEX IF NOT EXISTS idx_strava_connections_valid
  ON choppinho.strava_connections(user_id, is_valid)
  WHERE is_valid = true;

-- Index para preferências (join comum)
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user
  ON choppinho.notification_preferences(user_id);

-- Index para usuários ativos
CREATE INDEX IF NOT EXISTS idx_users_active
  ON choppinho.users(id, is_active)
  WHERE is_active = true;
```

---

### 5️⃣ Criar função de limpeza de tokens expirados (opcional, mas recomendado)

```sql
-- Função para limpar tokens antigos
CREATE OR REPLACE FUNCTION choppinho.cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM choppinho.auth_tokens
  WHERE expires_at < NOW() - INTERVAL '1 day';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário
COMMENT ON FUNCTION choppinho.cleanup_expired_tokens() IS 'Remove tokens expirados há mais de 1 dia. Chamar via N8N scheduled workflow diariamente.';
```

---

### 6️⃣ Criar view para estatísticas rápidas (otimização Cloudflare Free Tier)

```sql
-- View materializada para estatísticas agregadas (opcional - economiza CPU)
-- Atualizar via N8N após sync do Strava
CREATE OR REPLACE VIEW choppinho.user_stats_weekly AS
SELECT
  user_id,
  DATE_TRUNC('week', start_date) as week_start,
  COUNT(*) as total_runs,
  ROUND(SUM(distance_meters)::numeric / 1000, 2) as total_km,
  ROUND(AVG(average_speed)::numeric, 2) as avg_speed,
  ROUND(AVG(average_heartrate)::numeric, 0) as avg_heartrate,
  SUM(moving_time_seconds) as total_moving_time_seconds,
  SUM(calories) as total_calories
FROM choppinho.activities
WHERE activity_type = 'Run'
  AND start_date > NOW() - INTERVAL '90 days'
GROUP BY user_id, DATE_TRUNC('week', start_date)
ORDER BY user_id, week_start DESC;

COMMENT ON VIEW choppinho.user_stats_weekly IS 'Estatísticas semanais agregadas - últimos 90 dias';
```

---

### 7️⃣ Verificar se tudo foi criado corretamente

```sql
-- Verificar novos campos na tabela users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'choppinho'
  AND table_name = 'users'
  AND column_name IN (
    'web_session_token',
    'last_login_at',
    'subscription_plan',
    'subscription_status'
  );

-- Verificar se tabela auth_tokens foi criada
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'choppinho'
    AND table_name = 'auth_tokens'
) as auth_tokens_exists;

-- Verificar indexes criados
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'choppinho'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Contar registros (deve retornar 0 para auth_tokens)
SELECT
  (SELECT COUNT(*) FROM choppinho.users) as total_users,
  (SELECT COUNT(*) FROM choppinho.auth_tokens) as total_auth_tokens,
  (SELECT COUNT(*) FROM choppinho.activities) as total_activities,
  (SELECT COUNT(*) FROM choppinho.strava_connections) as total_strava_connections;
```

---

## ✅ Validação

Após executar todos os comandos, você deve ver:

1. ✅ **4 novos campos** na tabela `users`
2. ✅ **Tabela `auth_tokens`** criada
3. ✅ **3 novos campos** na tabela `notification_preferences`
4. ✅ **Vários indexes** criados (idx_users_phone_number, idx_auth_tokens_token, etc.)
5. ✅ **Função `cleanup_expired_tokens()`** criada
6. ✅ **View `user_stats_weekly`** criada

---

## 🔐 Próximo Passo

Após executar este SQL, me passe as seguintes informações:

1. ✅ **SERVICE_ROLE_KEY** (Settings → API → service_role key - secret)
2. ✅ **STRAVA_CLIENT_SECRET** (se já tiver)
3. ✅ **N8N_WEBHOOK_URL** (para enviar magic link via WhatsApp)

Enquanto isso, vou executar a **FASE 2** (setup do frontend).

---

## 📝 Notas Técnicas

### Performance no Cloudflare Free Tier (10ms CPU limit):

- ✅ Indexes parciais (`WHERE` clauses) reduzem tamanho e aumentam velocidade
- ✅ Index composto `(user_id, start_date DESC)` otimiza query do dashboard
- ✅ View `user_stats_weekly` pré-agrega dados (economiza CPU na Function)
- ✅ Função de limpeza roda via N8N (não consome Cloudflare Functions)

### Segurança:

- ✅ Tokens expiram em 15 minutos
- ✅ Tokens são UUID v4 (impossível adivinhar)
- ✅ Tokens marcados como `used` após uso
- ✅ Session tokens são UUID também (não JWT exposto)
- ✅ SERVICE_ROLE_KEY usado apenas nas Functions (não no frontend)

---

**Status:** ⏳ Aguardando você executar este SQL no Supabase

**Próximo:** 🚀 Fase 2 (eu faço) - Setup do projeto frontend
