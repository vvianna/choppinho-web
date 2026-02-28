# 📋 Provas Inscritas (Race Registrations)

**Status da Feature:** ✅ **IMPLEMENTADA na v1.0.0**

## 🎯 Objetivo
Permitir que o usuário cadastre provas/corridas em que está inscrito, defina metas e acompanhe resultados.

## 📊 Dados sugeridos

### Tabela: `race_registrations`
```sql
CREATE TABLE choppinho.race_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES choppinho.users(id) ON DELETE CASCADE,

  -- Dados da prova
  race_name VARCHAR(255) NOT NULL,
  race_date DATE NOT NULL,
  distance_km DECIMAL(6,2) NOT NULL,
  location VARCHAR(255),
  race_type VARCHAR(50), -- 'street' | 'trail' | 'track' | 'virtual'

  -- Meta do usuário
  target_time VARCHAR(20), -- "01:45:00" (HH:MM:SS)
  target_pace VARCHAR(10), -- "05:30" (min/km)

  -- Status
  status VARCHAR(20) DEFAULT 'upcoming', -- 'upcoming' | 'completed' | 'cancelled'
  bib_number VARCHAR(20),

  -- Resultado (preencher depois da prova)
  finish_time VARCHAR(20),
  official_pace VARCHAR(10),
  position_overall INTEGER,
  position_category INTEGER,

  -- Notas
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_race_registrations_user_date
ON choppinho.race_registrations(user_id, race_date);
```

## ✅ Features Implementadas (v1.0.0)

1. **Lista de Provas** ✅
   - Próximas provas (ordenadas por data)
   - Provas passadas
   - Contador: "Faltam X dias"

2. **Adicionar Prova** ✅
   - Formulário completo: nome, data, distância, local
   - Definir meta de tempo/pace
   - Tipo de prova: Corrida / Triatlon / Ironman
   - Número do peito (opcional)
   - Notas pessoais

3. **Detalhes da Prova** ✅
   - Ver informações completas
   - Editar prova
   - Deletar prova
   - Registrar resultado final (tempo, colocação)

4. **Endpoints API** ✅
   - `GET /api/races` - Listar provas
   - `POST /api/races` - Adicionar nova
   - `PUT /api/races/:id` - Atualizar
   - `DELETE /api/races/:id` - Deletar

**Arquivos Implementados:**
- [Races.tsx](../choppinho-fit/src/pages/dashboard/Races.tsx)
- [CREATE-RACE-REGISTRATIONS.sql](migrations/CREATE-RACE-REGISTRATIONS.sql)
- `/functions/api/races/*`

---

## 🚧 Melhorias Futuras (Backlog)

### v1.1.0 - Card "Próxima Prova" no Dashboard
- [ ] Adicionar widget no dashboard principal
- [ ] Countdown destacado
- [ ] Link direto para `/dashboard/races`

**Referência:** [v1.1.0.md](versoes/v1.1.0.md)

---

### v1.2.0 - Features Avançadas

#### Upload de Comprovante de Inscrição
- [ ] Upload de foto/PDF
- [ ] Storage no Supabase
- [ ] Preview na tela de detalhes

#### Integração com Treinos
- [ ] Sugerir plano de treino baseado na data da prova
- [ ] Mostrar progresso em direção à meta
- [ ] Comparar pace atual vs objetivo
- [ ] Alertas: "Faltam X semanas, você está no caminho!"

**Referência:** [v1.2.0.md](versoes/v1.2.0.md)

## 🎨 UI Sugerida

```
┌─────────────────────────────────────┐
│  📅 Próximas Provas                 │
├─────────────────────────────────────┤
│  🏃 Meia Maratona do Rio            │
│  📍 Rio de Janeiro                  │
│  📏 21.1 km                         │
│  🗓️  15 Mar 2026 (18 dias)         │
│  🎯 Meta: 01:45:00 (5:00 /km)      │
│  [Ver detalhes]                     │
├─────────────────────────────────────┤
│  [+ Adicionar Prova]                │
└─────────────────────────────────────┘
```

---

## 📚 Links Relacionados

- **Roadmap completo:** [ROADMAP.md](ROADMAP.md)
- **v1.0.0 (implementada):** [versoes/v1.0.0.md](versoes/v1.0.0.md)
- **v1.1.0 (próxima):** [versoes/v1.1.0.md](versoes/v1.1.0.md)
- **v1.2.0 (melhorias):** [versoes/v1.2.0.md](versoes/v1.2.0.md)

---

**Última atualização:** 27/02/2026
**Feature implementada em:** v1.0.0 (Fevereiro 2026)
