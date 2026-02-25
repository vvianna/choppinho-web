# 🧪 Como Testar a Área de Membros Localmente

## 📋 Pré-requisitos

Antes de testar, certifique-se de que você instalou as dependências:

```bash
cd choppinho-fit
npm install @supabase/supabase-js recharts
```

---

## 🚀 Passo 1: Rodar o servidor local

```bash
cd choppinho-fit
npm run dev
```

O site deve abrir automaticamente em: **http://localhost:8080**

---

## 🎯 Passo 2: Testar o fluxo completo

### **1. Landing Page (já existente)**
- Acesse: `http://localhost:8080/`
- ✅ Deve carregar normalmente
- ✅ Agora tem 2 botões no hero:
  - **"Começar no WhatsApp"** (verde) → abre WhatsApp (fluxo atual)
  - **"Área de Membros"** (amarelo) → redireciona para `/login` (novo!)

---

### **2. Tela de Login (NOVA)**
- Acesse: `http://localhost:8080/login`
- ✅ Deve mostrar formulário de login
- ✅ Digite qualquer telefone (ex: `+55 21 96707-6547`)
- ✅ Clique em **"Enviar Link"**
- ✅ Deve simular envio e mostrar mensagem: *"Link enviado!"*
- ✅ Aparece botão amarelo: **"🎭 Simular Magic Link (Demo)"**
- ✅ Clique nesse botão

---

### **3. Tela de Verificação (NOVA)**
- ✅ Deve mostrar animação de loading
- ✅ Depois mostra: *"Acesso confirmado! ✅"*
- ✅ Redireciona automaticamente para `/dashboard`

---

### **4. Dashboard (NOVA)**
- Acesse: `http://localhost:8080/dashboard`
- ✅ Deve mostrar:
  - **Header** com logo e botão "Sair"
  - **Alerta amarelo** dizendo "MODO DEMO"
  - **4 cards de estatísticas:**
    - Distância Total: 32.5 km
    - Corridas: 4
    - Pace Médio: 5:45/km
    - Tempo Total: 3h 17min
  - **Gráfico placeholder** (será implementado com Recharts depois)
  - **Lista de últimas corridas** (4 atividades fake)

---

### **5. Proteção de Rotas (NOVA)**
- Abra o navegador **em modo anônimo** (Ctrl+Shift+N)
- Tente acessar: `http://localhost:8080/dashboard`
- ✅ Deve redirecionar automaticamente para `/login`
- ✅ Isso comprova que a proteção de rotas funciona!

---

### **6. Logout**
- No Dashboard, clique em **"Sair"** (canto superior direito)
- ✅ Deve redirecionar para `/login`
- ✅ Tente acessar `/dashboard` novamente → deve bloquear e redirecionar

---

## 🎨 O que você vai ver (UI Mock):

### **Login Page:**
```
┌─────────────────────────────────────┐
│   🍺 ChoppinhoFit                   │
│   Entre para acessar seu dashboard  │
│                                      │
│   ┌────────────────────────────┐   │
│   │ 📱 Número de WhatsApp      │   │
│   │ [+55 21 96707-6547]        │   │
│   │                             │   │
│   │ [Enviar Link]              │   │
│   └────────────────────────────┘   │
│                                      │
│   ← Voltar para home                │
└─────────────────────────────────────┘
```

### **Dashboard:**
```
┌───────────────────────────────────────────────┐
│ 🍺 ChoppinhoFit    +55 21 96707-6547   [Sair]│
├───────────────────────────────────────────────┤
│                                                │
│ 🎭 MODO DEMO: Dados fake para demonstração   │
│                                                │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │32.5km│ │  4   │ │ 5:45 │ │3h17m │         │
│ │Dist. │ │Corri.│ │ Pace │ │Tempo │         │
│ └──────┘ └──────┘ └──────┘ └──────┘         │
│                                                │
│ 📊 Evolução Semanal                           │
│ ┌────────────────────────────────────┐       │
│ │  [Gráfico será implementado]       │       │
│ └────────────────────────────────────┘       │
│                                                │
│ 🏃 Últimas Corridas                           │
│ • Corrida Matinal 🌅 - 10.2km - 5:44/km      │
│ • Longão de Domingo - 15.0km - 5:52/km       │
│ • Treino Intervalado - 5.0km - 5:27/km       │
│ • Recovery Run - 2.3km - 6:18/km             │
└───────────────────────────────────────────────┘
```

---

## ⚠️ Importante: Dados Mock

**Tudo que você vê agora são dados FAKE (mock) para testar a interface.**

### **O que funciona (mock):**
- ✅ Navegação entre páginas
- ✅ Login simulado (não envia WhatsApp de verdade)
- ✅ Proteção de rotas (localStorage)
- ✅ Logout
- ✅ Interface completa do dashboard

### **O que NÃO funciona ainda (será implementado depois):**
- ❌ Magic link real via WhatsApp
- ❌ Integração com N8N
- ❌ Buscar dados reais do Supabase
- ❌ Conectar/desconectar Strava
- ❌ Editar preferências de notificação
- ❌ Gráficos com Recharts

---

## 🐛 Troubleshooting

### **Erro: "Cannot find module '@supabase/supabase-js'"**
```bash
cd choppinho-fit
npm install @supabase/supabase-js recharts
```

### **Erro de compilação TypeScript**
```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### **Landing page não mostra botão "Área de Membros"**
- Certifique-se de estar na branch `feature/members-area`
- Verifique se o arquivo `Landing.tsx` foi atualizado

### **Dashboard redireciona para /login sempre**
- Abra o DevTools (F12)
- Vá em **Application** → **Local Storage**
- Verifique se tem `choppinho_session_token`
- Se não tiver, faça login novamente

---

## 📊 Checklist de Testes

- [ ] Landing page carrega normalmente
- [ ] Botão "Área de Membros" aparece e funciona
- [ ] `/login` mostra formulário
- [ ] Mock de login funciona (clica e entra)
- [ ] Dashboard mostra dados fake
- [ ] Cards de estatísticas aparecem
- [ ] Lista de atividades aparece
- [ ] Botão "Sair" funciona
- [ ] Proteção de rotas funciona (redireciona se não autenticado)
- [ ] Logout limpa sessão

---

## ✅ Próximos Passos

**Depois de testar a UI e confirmar que está tudo OK:**

1. Me avise que está funcionando
2. Vou implementar a **versão real** da Fase 3:
   - Cloudflare Functions (magic link real)
   - Integração com N8N (envio de WhatsApp)
   - Buscar dados reais do Supabase
   - Conectar/desconectar Strava

---

## 🎯 Status Atual

- ✅ **UI/UX:** 100% funcional (mock)
- ✅ **Navegação:** 100% funcional
- ✅ **Design:** Usando tema do Choppinho (verde/amarelo)
- ⏳ **Backend:** Aguardando Fase 3 (implementação real)

---

**Bora testar! 🚀🍺**
