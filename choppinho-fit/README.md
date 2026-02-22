# 🍺🏃 Choppinho Fit

Site institucional do **Choppinho Fit** — seu companheiro de corrida que conecta Strava ao WhatsApp.

![Choppinho Mascot](public/choppinho-mascot.png)

## Tech Stack

- **Vite** — Build tool
- **React 18** — UI library
- **TypeScript** — Type safety
- **Tailwind CSS** — Styling
- **shadcn/ui** — Component library
- **Lucide React** — Icons

## Paleta de Cores

| Cor | Hex | Uso |
|-----|-----|-----|
| 🟢 Primary Green | `#2B6E2F` | Marca principal (boné, shorts) |
| 🟡 Accent Gold | `#F5B731` | Destaques (camiseta, CTA) |
| 🟤 Bark Brown | `#3A2A14` | Texto principal |
| ⬜ Cream | `#FFF9ED` | Background |
| 🟢 Hop Green | `#4A8D4C` | Secundário |

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em desenvolvimento
npm run dev

# 3. Build para produção
npm run build
```

## Estrutura

```
choppinho-fit/
├── public/
│   ├── choppinho-mascot.png    # Mascote
│   └── app-screens.png         # Screenshots do app
├── src/
│   ├── components/             # Componentes reutilizáveis
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utilitários
│   ├── pages/
│   │   └── Landing.tsx         # Landing page principal
│   ├── App.tsx                 # Router setup
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles + Tailwind
├── tailwind.config.ts          # Cores e fontes customizadas
├── vite.config.ts
├── package.json
└── README.md
```

## Seções da Landing Page

1. **Navbar** — Logo + links + CTA
2. **Hero** — Headline + mascote + social proof
3. **Screenshots** — Telas do app
4. **Funcionalidades** — 6 features em grid
5. **Como funciona** — 3 passos (Strava → WhatsApp → Insights)
6. **WhatsApp Preview** — Mock de conversa com o bot
7. **Share to WhatsApp** — CTA de compartilhamento
8. **Planos** — Free / Pro / Teams
9. **FAQ** — Perguntas frequentes com accordion
10. **CTA Final** — Chamada para ação
11. **Footer** — Links + créditos

## Licença

Projeto privado — Choppinho Fit © 2026
