# 🍺 Choppinho Fit - Área de Membros

Sistema de acompanhamento de corridas e treinamentos integrado ao WhatsApp, com dashboard web para visualização de estatísticas e gerenciamento de metas.

## 🚀 Stack Tecnológica

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS
- **Backend:** Cloudflare Pages Functions (Serverless)
- **Database:** Supabase (PostgreSQL)
- **Autenticação:** Magic Link via WhatsApp + PIN Code
- **Integração:** N8N (Webhooks) + Strava API
- **Charts:** Recharts

## 📦 Estrutura do Projeto

```
choppinho-web/
├── choppinho-fit/           # Frontend React + Cloudflare Functions
│   ├── src/                 # Código fonte React
│   │   ├── pages/           # Páginas (Login, Dashboard, etc)
│   │   ├── components/      # Componentes reutilizáveis
│   │   └── lib/             # Types, API helpers, Supabase client
│   ├── functions/           # Cloudflare Pages Functions (Backend)
│   │   ├── api/             # Endpoints da API
│   │   └── shared/          # Código compartilhado
│   └── public/              # Assets estáticos
├── docs/                    # Documentação
│   ├── fases/               # Documentação das fases implementadas
│   ├── migrations/          # Scripts SQL de migração
│   └── BACKLOG.md           # Próximas features
└── README.md                # Este arquivo
```

## ✅ Features Implementadas

### FASE 1-2: Setup
- ✅ Banco de dados configurado (Supabase)
- ✅ Types TypeScript completos
- ✅ Supabase client e API helpers

### FASE 3: Autenticação
- ✅ Magic Link via WhatsApp (link curto: `/auth?c=xxx`)
- ✅ PIN Code (6 dígitos)
- ✅ Sessões persistentes (localStorage)

### FASE 4: Dashboard
- ✅ Gráficos de evolução semanal (Recharts)
- ✅ Estatísticas: KM totais, pace médio, tempo total
- ✅ Distribuição de treinos por dia da semana
- ✅ Lista de atividades recentes

### FASE 5: Configurações
- ✅ Perfil do usuário (nome, email, telefone)
- ✅ Apelidos personalizados (até 10, usados pelo bot)
- ✅ Modo de personalidade (default/offensive/light_zen)
- ✅ Toast notifications

### FASE 6: Strava Sync
- ✅ Conexão com Strava (OAuth - via N8N)
- ✅ Sincronização manual de atividades
- ✅ Status da conexão (atleta ID, última sync, total)
- ✅ Desconectar conta

### FASE 7: Provas Inscritas
- ✅ CRUD completo de provas
- ✅ Suporte: Corrida, Triatlon, Ironman
- ✅ Countdown até a data da prova
- ✅ Campos opcionais: local, nº peito, tempo objetivo, notas
- ✅ Resultado final (tempo e colocação)

### Responsividade
- ✅ Layout mobile-first
- ✅ Breakpoints Tailwind (sm, md, lg)
- ✅ Botões adaptados para touch

## 🛠️ Desenvolvimento Local

### Pré-requisitos
```bash
Node.js >= 18
npm >= 9
```

### Instalação
```bash
cd choppinho-fit
npm install
```

### Executar em modo dev
```bash
npm run dev
# Acesse: http://localhost:5173
```

### Build para produção
```bash
npm run build
# Saída em: dist/
```

## 🚀 Deploy em Produção

Siga o guia completo em: **[DEPLOY.md](DEPLOY.md)**

### Resumo rápido:
1. Push para GitHub
2. Deploy automático via Cloudflare Pages
3. Executar migrations SQL no Supabase
4. Configurar variáveis de ambiente
5. Ativar workflows N8N

## 📚 Documentação

- **[DEPLOY.md](DEPLOY.md)** - Guia completo de deploy
- **[docs/fases/](docs/fases/)** - Documentação de cada fase
- **[docs/migrations/](docs/migrations/)** - Scripts SQL
- **[docs/BACKLOG.md](docs/BACKLOG.md)** - Próximas features

## 🔐 Variáveis de Ambiente (Cloudflare)

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
N8N_WEBHOOK_MAGIC_LINK=https://n8n.example.com/webhook/magic-link
N8N_WEBHOOK_STRAVA_SYNC=https://n8n.example.com/webhook/strava-sync
```

## 🧪 Testes

```bash
# Testar login local (telefone de teste):
# +5521982238663
```

## 📈 Roadmap

Ver [docs/BACKLOG.md](docs/BACKLOG.md) para próximas features planejadas.

## 🤝 Contribuindo

Este é um projeto privado. Para contribuir, entre em contato com o time.

## 📝 Licença

Propriedade de Choppinho Fit. Todos os direitos reservados.

---

**Versão:** 1.0.0  
**Última atualização:** Fevereiro 2026
