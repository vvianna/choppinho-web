# Choppinho Fit — Plano: Área de Membros

## Contexto do Projeto

**Choppinho Fit** é uma aplicação de fitness que integra dados de corrida do Strava com comunicação via WhatsApp. O site já existe em React/Vite/TypeScript/Tailwind/shadcn-ui e está hospedado no **Cloudflare Pages** com repositório no GitHub (`choppinho-web`).

### Stack atual
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn-ui
- **Hospedagem:** Cloudflare Pages
- **Banco de dados:** Supabase (PostgreSQL)
- **Automações/Workflows:** N8N
- **WhatsApp:** Evolution API
- **Strava API:** Client ID 151164, OAuth2 já implementado no N8N

---

## Objetivo

Adicionar uma **área de membros** ao site existente com as seguintes funcionalidades:

1. Dashboard com stats de corrida
2. Gerenciar assinatura/plano
3. Configurar preferências do WhatsApp
4. Conectar/desconectar Strava

---

## Autenticação: Magic Link via WhatsApp

O usuário **não cria senha**. O login funciona assim:

```
1. Usuário acessa /login e digita número de telefone
2. Frontend chama POST /api/auth/request
3. Cloudflare Worker gera token único (UUID) com expiração de 15 min
4. Token salvo na tabela `auth_tokens` no Supabase
5. Worker chama N8N webhook → N8N usa Evolution API para enviar link via WhatsApp
6. Usuário clica no link: /auth/verify?token=<uuid>
7. Worker valida token → cria sessão JWT via Supabase Auth
8. Usuário autenticado e redirecionado para /dashboard
```

---

## Backend: Cloudflare Pages Functions

Criar pasta `/functions/api/` na raiz do projeto. O Cloudflare transforma cada arquivo em uma rota automaticamente.

### Estrutura de arquivos a criar

```
/functions
  /api
    auth/
      request.ts       → POST /api/auth/request   (solicita magic link)
      verify.ts        → GET  /api/auth/verify     (valida token e cria sessão)
      logout.ts        → POST /api/auth/logout
    user/
      profile.ts       → GET/PUT /api/user/profile
      preferences.ts   → GET/PUT /api/user/preferences (prefs WhatsApp)
    strava/
      status.ts        → GET /api/strava/status
      disconnect.ts    → POST /api/strava/disconnect
      callback.ts      → GET /api/strava/callback (OAuth2 redirect)
    subscription/
      status.ts        → GET /api/subscription/status
      portal.ts        → POST /api/subscription/portal (portal Stripe/Abacatepay)
```

### Variáveis de ambiente necessárias (Cloudflare)

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
N8N_WEBHOOK_MAGIC_LINK=      # URL do webhook N8N que dispara envio via WhatsApp
STRAVA_CLIENT_ID=151164
STRAVA_CLIENT_SECRET=
JWT_SECRET=
```

---

## Banco de Dados: Supabase

### Nova tabela: `auth_tokens`

```sql
CREATE TABLE auth_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL,
  token       UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  used        BOOLEAN DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '15 minutes',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca rápida por token
CREATE INDEX idx_auth_tokens_token ON auth_tokens(token);

-- Limpeza automática de tokens expirados (opcional, via pg_cron)
```

### Ajustes na tabela `users` (já existente)

Verificar se os campos abaixo já existem, adicionar se necessário:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS web_session_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "weekly_summary": true,
  "summary_day": "monday",
  "summary_time": "08:00",
  "pr_alerts": true,
  "motivational_messages": true
}'::jsonb;
```

---

## Rotas do Frontend (React Router v6)

```
/login                → Tela de login (input de telefone)
/auth/verify          → Processa token da URL e redireciona
/dashboard            → Home protegida (stats de corrida)
/dashboard/strava     → Conectar/desconectar Strava
/dashboard/whatsapp   → Preferências de notificação
/dashboard/plano      → Gerenciar assinatura
```

### Proteção de rotas

Criar um componente `ProtectedRoute` que verifica sessão Supabase antes de renderizar. Redireciona para `/login` se não autenticado.

```tsx
// src/components/ProtectedRoute.tsx
// Verifica supabase.auth.getSession()
// Se não autenticado → navigate('/login')
```

---

## Estrutura de Pastas (Frontend)

```
src/
  pages/
    Login.tsx
    AuthVerify.tsx
    dashboard/
      Index.tsx           (stats de corrida)
      Strava.tsx
      WhatsApp.tsx
      Plano.tsx
  components/
    ProtectedRoute.tsx
    dashboard/
      StatsCard.tsx
      RunningChart.tsx
      ActivityList.tsx
      PlanBadge.tsx
  hooks/
    useAuth.ts            (contexto de autenticação)
    useUser.ts
    useStravaActivities.ts
  lib/
    supabase.ts           (cliente Supabase)
    api.ts                (helpers para chamar /api/*)
```

---

## Dashboard: Stats de Corrida

Dados consumidos da tabela de atividades cacheadas no Supabase (já existente no schema do projeto).

### KPIs a exibir
- Km rodados na semana / mês
- Pace médio
- Número de atividades
- Evolução semanal (gráfico de barras — usar Recharts, já disponível)
- Próximo resumo agendado

---

## Tela de Preferências do WhatsApp

Campos configuráveis:
- Dia da semana para resumo semanal
- Horário do envio
- Ativar/desativar alertas de PR (Personal Record)
- Ativar/desativar mensagens motivacionais
- Pausar notificações (com data de retorno)

Ao salvar → PUT /api/user/preferences → atualiza Supabase → N8N usa esses dados nos workflows de envio.

---

## Tela Strava

- Status da conexão (conectado/desconectado)
- Data da última sincronização
- Botão "Desconectar" → POST /api/strava/disconnect (revoga token no Supabase)
- Botão "Reconectar" → inicia OAuth2 flow via GET /api/strava/callback

---

## Tela de Plano

- Plano atual (Free / Pro R$9,90 / Teams R$29,90)
- Data de renovação
- Botão upgrade/downgrade
- Botão cancelar assinatura
- Histórico de pagamentos (opcional fase 2)

Gateway a definir: **Stripe** (cartão internacional) ou **Abacatepay** (PIX nativo BR).

---

## Ordem de Implementação Sugerida

1. **Banco:** Criar tabela `auth_tokens`, ajustar `users`
2. **Backend:** Cloudflare Functions — `/api/auth/request` e `/api/auth/verify`
3. **Frontend:** Tela de Login + `AuthVerify` + `ProtectedRoute`
4. **Testar fluxo completo** de magic link (N8N precisa de webhook configurado)
5. **Dashboard:** Tela de stats consumindo Supabase
6. **Preferências WhatsApp:** Tela + endpoint
7. **Strava:** Tela de status + disconnect/reconnect
8. **Plano:** Integração com gateway de pagamento

---

## Observações

- O N8N já tem o workflow Strava OAuth2 implementado — reutilizar a lógica
- O schema do Supabase já tem tabelas de usuários e atividades — não recriar, apenas estender
- Manter o branding verde/amarelo e mascote Choppinho em toda a área de membros
- shadcn-ui já está no projeto — usar os componentes existentes (Card, Button, Input, etc.)
