# 🗺️ Roadmap - Choppinho Fit

Planejamento de versões e features futuras da plataforma.

---

## 📊 Status das Versões

| Versão | Status | Estimativa | Conclusão | Progresso |
|--------|--------|-----------|-----------|-----------|
| [v1.0.0](#v100---release-atual) | ✅ Concluída | - | Fevereiro 2026 | 100% |
| [v1.1.0](#v110---gaps-críticos) | 🚧 Planejada | 2-3 semanas | - | 0% |
| [v1.2.0](#v120---melhorias-ux) | 📋 Backlog | 3-4 semanas | - | 0% |
| [v2.0.0](#v200---monetização) | 💡 Ideia | 6-8 semanas | - | 0% |

---

## v1.0.0 - Release Atual

**Status:** ✅ **CONCLUÍDA** (Fevereiro 2026)

Sistema completo de acompanhamento de corridas com área de membros funcional.

### Features Implementadas:
- ✅ Autenticação via Magic Link (WhatsApp)
- ✅ Dashboard com estatísticas e gráficos
- ✅ Integração Strava (OAuth + sync manual)
- ✅ Configurações (perfil, apelidos, personalidade)
- ✅ Provas Inscritas (CRUD completo)
- ✅ Responsividade mobile

📄 [Ver documentação completa →](versoes/v1.0.0.md)

---

## v1.1.0 - GAPS Críticos

**Status:** 🚧 **PLANEJADA** (próxima versão)
**Estimativa:** 2-3 semanas
**Prioridade:** 🔴 ALTA

### Objetivo:
Alinhar features prometidas no site público com a área de membros implementada.

### Features Principais:

#### 🔥 1. Streak Tracker
- Campo `current_streak` e `longest_streak` no banco
- Card visual no dashboard (🔥 X semanas consecutivas)
- Lógica de cálculo automático
- Badge de conquista

#### 📅 2. Escolha do Dia da Semana
- UI em Settings para escolher dia do resumo semanal
- Dropdown: Segunda/Terça/.../Domingo
- Salvar em `notification_preferences.summary_day`
- Integração com N8N para respeitar preferência

#### 🏆 3. Card "Próxima Prova" no Dashboard
- Widget destacado na home
- Countdown até a data
- Link para /dashboard/races
- Mostrar: nome, data, distância, tempo objetivo

#### 📤 4. Compartilhar Resumo
- Botão "Compartilhar" no dashboard
- Gerar deep link WhatsApp formatado
- Texto: "Corri X km essa semana com pace Y/km 🏃"
- Opcional: gerar imagem do card de resumo

📄 [Ver detalhes técnicos →](versoes/v1.1.0.md)

---

## v1.2.0 - Melhorias UX

**Status:** 📋 **BACKLOG**
**Estimativa:** 3-4 semanas
**Prioridade:** 🟡 MÉDIA

### Objetivo:
Aprimorar experiência do usuário com insights inteligentes e melhor navegação.

### Features Principais:

#### 🤖 1. Insights Inteligentes
- Análise automática de evolução
- Mensagens tipo: "Seu pace melhorou 10% essa semana!"
- Comparação com médias anteriores
- Sugestões de melhoria

#### 🔍 2. Filtros de Período
- Dashboard: filtrar por semana/mês/ano
- Gráficos dinâmicos com período customizado
- Comparação entre períodos

#### 📄 3. Paginação de Atividades
- Lista de atividades com infinite scroll
- Atualmente mostra só últimas 10
- Filtros: tipo, distância, data

#### 📎 4. Upload de Comprovante (Provas)
- Anexar foto/PDF da inscrição
- Storage no Supabase
- Preview na tela de detalhes

#### 🎯 5. Integração Provas x Treinos
- Sugerir plano de treino baseado na data
- Comparar pace atual vs objetivo
- Alertas: "Faltam X semanas, você está no caminho!"

📄 [Ver detalhes técnicos →](versoes/v1.2.0.md)

---

## v2.0.0 - Monetização

**Status:** 💡 **IDEIA**
**Estimativa:** 6-8 semanas
**Prioridade:** 🔵 BAIXA (após validação do produto)

### Objetivo:
Implementar sistema de assinatura para sustentabilidade do projeto.

### Features Principais:

#### 💳 1. Sistema de Planos
- **Free:** Resumos semanais básicos
- **Pro (R$ 9,90/mês):** Insights IA, análises avançadas, uploads ilimitados
- **Teams (R$ 29,90/mês):** Grupos de corrida, ranking, desafios

#### 💰 2. Gateway de Pagamento
- Stripe (cartão internacional)
- Abacatepay (PIX nativo BR)
- Webhooks para renovação/cancelamento

#### 📊 3. Tela de Assinatura
- `/dashboard/plan`
- Status do plano atual
- Upgrade/downgrade
- Histórico de pagamentos
- Portal de gerenciamento

#### 🎁 4. Features Premium
- Análise preditiva de performance
- Comparação com outros corredores
- Planos de treino personalizados
- Coaching via WhatsApp (mensagens extras)

📄 [Ver detalhes técnicos →](versoes/v2.0.0.md)

---

## 📌 Legenda de Status

- ✅ **Concluída** - Implementada e em produção
- 🚧 **Planejada** - Próxima na fila, escopo definido
- 📋 **Backlog** - Planejada para o futuro, escopo em discussão
- 💡 **Ideia** - Conceito inicial, aguardando validação
- ❌ **Cancelada** - Removida do roadmap

---

## 🎯 Priorização

As versões são priorizadas com base em:

1. **Impacto no usuário** (resolve problema crítico?)
2. **Alinhamento com promessas** (gap entre site e produto?)
3. **Complexidade técnica** (quick wins vs. long term)
4. **Dependências** (precisa de outra feature antes?)

---

## 📝 Observações

- Este roadmap é **vivo** e pode ser ajustado conforme feedback dos usuários
- Cada versão tem documentação técnica detalhada na pasta `docs/versoes/`
- Issues e bugs não bloqueantes são tratados fora deste roadmap
- Sugestões de features: abrir issue no GitHub ou contatar o time

---

**Última atualização:** 27 de Fevereiro de 2026
**Versão atual em produção:** v1.0.0
