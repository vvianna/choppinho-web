# 🍺 Choppinho Fit - Roadmap de Implementação

Este documento organiza as funcionalidades e requisitos técnicos para o sistema do **Choppinho Fit**.

---

## 1. Sistema de Classificação de Chopes 🍺
Régua fixa para avaliação das cervejas (inicialmente não colaborativa).

| Chopes | Nota | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| 0 | 🍺x0 | Intragável | N/A |
| 1 | 🍺x1 | Fraca | Itaipava |
| 2 | 🍺x2 | Ok, mas sem brilho | N/A |
| 3 | 🍺x3 | Boa padrão | N/A |
| 4 | 🍺x4 | Muito boa | N/A |
| 5 | 🍺x5 | Elite absoluta 👑 | Chopp Brahma |

---

## 2. Base Calórica e Conversão 🏃‍♂️➡️🍺
Lógica para recompensar o treino com "liberdade" para beber.

- **Padrão Calórico:** 1 tulipa (300ml) ≈ **130 kcal**.
- **Fórmula de Cálculo:** 
  `Gasto Calórico Semanal / 130 = Qtd. Chopes Liberados`
- **Regras de Negócio:**
  - 🔒 **Teto Máximo:** 5 chopes por semana (ajustável).
  - 🧮 **Arredondamento:** Sempre para baixo.
  - 🎯 **Bônus:** Extra para quem atingir metas de quilometragem (KM) mínima.
  - 💻 **Frontend:** Exibir estas regras de conversão e limites na interface do usuário.

---

## 3. Automação: O Job do "Sextoei" ⏰
Job automático para processar os resultados da semana.

- **Frequência:** Toda sexta-feira, às **12:00**.
- **Período de Coleta:** Segunda-feira 00:00 até Sexta-feira 11:59.
- **Ações do Job:**
  1. Busca treinos no período.
  2. Soma calorias queimadas por atleta.
  3. Aplica regra de conversão e teto.
  4. Gera ranking semanal.
  5. Envia mensagem formatada no grupo do WhatsApp.
- **Regra de Corte:** Treinos após sexta 12:00 entram na **próxima semana**.

---

---

## 4. Comunicação e Personalidade 🎭
O sistema deve variar o tom de voz dependendo do dia da semana e das preferências individuais de cada atleta.

### 4.1. Variação por Dia (Global)
| Dia | Personagem | Tom de Voz |
| :--- | :--- | :--- |
| **Segunda** | 🟢 Professor Rígido | Sério, foco total em disciplina e foco. |
| **Quarta** | 🟡 Técnico Observador | Analítico, provocativo, cobrando resultados. |
| **Sexta** | 🔴 Irônico Raiz | Sarcástico, estilo "quem treinou treinou". |

### 4.2. Personalização por Usuário (Modo de Humor)
O humor deve ser configurável por usuário para permitir diferentes níveis de interação:
- **Padrão:** Segue a régua semanal de forma equilibrada.
- **Ofensivo (Ex: "Fabrício Mode"):** Sarcasmo pesado, cobranças agressivas e "bullying" motivacional.
- **Light/Zen:** Foco em saúde e incentivo positivo, sem ironias ou sarcasmo.

---

## 5. Estrutura da Mensagem de Sexta (PRIORIDADE) 📱
A mensagem de sexta-feira é o "ponto alto" da semana. Ela deve ir além de um simples ranking.

### 5.1. Componentes da Mensagem:
1. **Saudação Temática:** Variando conforme o humor global da sexta.
2. **Review da Semana:** Resumo de TODOS os treinos realizados pelos participantes.
3. **Curiosidades e Brincadeiras:**
   - "Atleta que mais correu na chuva" 🌧️
   - "Maior evolução de ritmo" ⚡
   - "O que treinou só pra bater a meta do chope" 🍻
   - Piadas internas e "zoeira" saudável com o grupo.
4. **Ranking de Chopes:** Lista ordenada de quem liberou mais tulipas.
5. **Aviso de Corte:** Reforçar que treinos pós-12h ficam para a próxima rodada.

### 5.2. Exemplo de Bloco Lógico:
```text
🍺 Sextou no Choppinho - Edição Master!

🔥 RESUMO DA SEMANA:
João percorreu 45km no total.
Victor fez o treino mais rápido da história (ou estava fugindo de alguém?).
Rafael finalmente saiu do sofá na quinta à noite.

🎯 CURIOSIDADES:
- João: Ganhou o troféu "Madrugador" (treino às 05:00).
- Rafael: Ganhou o troféu "No Limite" (bateu a meta faltando 5 min pro corte).

🍺 CHOPES LIBERADOS:
1º João – 5 chopes (E-L-I-T-E)
2º Victor – 4 chopes
3º Rafael – 2 chopes

⚠️ Atenção: O barril fechou! Treinos agora só contam para a próxima sexta.
```

---

## 6. Checklist de Implementação Técnica ✅
- [ ] Implementar tabela fixa de notas no banco/código.
- [ ] Definir valor calórico padrão (130 kcal) como constante.
- [ ] Desenvolver função de cálculo semanal (Calorias -> Chopes).
- [ ] Configurar Job CRON/Serverless para sexta-feira 12h.
- [ ] Criar templates de mensagem dinâmicos (Handlebars/Template Strings).
- [ ] Implementar sistema de "Modos de Personalidade" (Switch por dia).

---

## 7. Evoluções Futuras (Backlog) 🚀
- [ ] Penalidade para semana zerada (ex: saldo negativo).
- [ ] Troféus especiais: "Rei do Barril" 👑.
- [ ] Medalhas virtuais: "Treinou pra beber" 🥇.
- [ ] Histórico mensal e média anual por atleta.
- [ ] Sistema de débito calórico acumulativo.
