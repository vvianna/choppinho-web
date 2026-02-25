# 🚀 FASE 2: Setup do Projeto - Instruções

## ✅ Branch criada: `feature/members-area`

Você já está na branch correta! ✅

---

## 📦 Passo 1: Instalar Dependências

**Execute no seu terminal local:**

```bash
cd choppinho-fit
npm install @supabase/supabase-js recharts
```

**Dependências que serão instaladas:**
- `@supabase/supabase-js` - Cliente oficial do Supabase para TypeScript
- `recharts` - Biblioteca de gráficos para React (stats do dashboard)

---

## 📁 Passo 2: Aguardar criação da estrutura

Vou criar todos os arquivos necessários:

### Estrutura que será criada:

```
choppinho-fit/
├── src/
│   ├── hooks/                    [NOVO]
│   │   ├── useAuth.tsx          → Contexto de autenticação
│   │   ├── useUser.ts           → Hook para dados do usuário
│   │   └── useActivities.ts     → Hook para atividades do Strava
│   │
│   ├── components/              [NOVO]
│   │   ├── ProtectedRoute.tsx   → Guard para rotas protegidas
│   │   └── dashboard/           [NOVO]
│   │       ├── StatsCard.tsx    → Cards de estatísticas
│   │       ├── RunningChart.tsx → Gráfico de evolução
│   │       └── ActivityList.tsx → Lista de corridas
│   │
│   ├── pages/
│   │   ├── Landing.tsx          [JÁ EXISTE - NÃO MEXO]
│   │   ├── Login.tsx            [NOVO - FASE 3]
│   │   ├── AuthVerify.tsx       [NOVO - FASE 3]
│   │   └── dashboard/           [NOVO - FASE 4]
│   │       ├── Index.tsx
│   │       ├── Strava.tsx
│   │       ├── WhatsApp.tsx
│   │       └── Plano.tsx
│   │
│   ├── lib/
│   │   ├── utils.ts             [JÁ EXISTE]
│   │   ├── supabase.ts          [NOVO] ← Cliente Supabase
│   │   ├── api.ts               [NOVO] ← Helpers para APIs
│   │   └── types.ts             [NOVO] ← TypeScript types
│   │
│   └── App.tsx                  [ATUALIZAR - FASE 3]
```

---

## ⏳ Próximos passos

Aguarde enquanto crio os arquivos base da Fase 2...
