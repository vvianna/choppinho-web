# 📋 BACKLOG: Provas Inscritas (Race Registrations)

## 💡 Ideia
Seção para o usuário registrar provas/corridas que está inscrito.

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

## 🎯 Features

1. **Lista de Provas**
   - Próximas provas (ordenadas por data)
   - Provas passadas
   - Contador: "Faltam X dias"

2. **Adicionar Prova**
   - Formulário com nome, data, distância, local
   - Definir meta de tempo/pace
   - Upload de comprovante de inscrição (opcional)

3. **Detalhes da Prova**
   - Ver informações completas
   - Editar meta
   - Adicionar notas/estratégia
   - Marcar como concluída
   - Registrar resultado

4. **Cards no Dashboard**
   - "Próxima Prova" (countdown)
   - "Última Prova Completada"

5. **Integração com Treinos**
   - Sugerir plano de treino baseado na data da prova
   - Mostrar se está no caminho para atingir a meta

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

## 🔗 Endpoints necessários

- `GET /api/races` - Listar provas do usuário
- `POST /api/races` - Adicionar nova prova
- `GET /api/races/:id` - Detalhes da prova
- `PUT /api/races/:id` - Atualizar prova
- `DELETE /api/races/:id` - Deletar prova
- `POST /api/races/:id/complete` - Marcar como concluída + resultado

---

**Status:** 💡 Ideia registrada para implementação futura
