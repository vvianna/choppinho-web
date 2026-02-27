# FASE 7 - Provas Inscritas ✅

## 📋 Resumo

Sistema completo de gerenciamento de provas/corridas inscritas, com suporte para corrida, triatlon e ironman. Permite adicionar, editar, visualizar e remover provas com informações detalhadas.

---

## 🎯 Funcionalidades Implementadas

### 1. **Tipos de Prova Suportados**
- 🏃 **Corrida** (padrão) - 5K, 10K, Meia Maratona, Maratona, etc
- 🏊 **Triatlon** - Sprint, Olímpico, etc  
- 💪 **Ironman** - 70.3, Full, etc

### 2. **Campos Obrigatórios**
- Tipo de Prova (padrão: corrida)
- Nome da Prova
- Data da Prova
- Distância (km)

### 3. **Campos Opcionais**
- Local (cidade/estado)
- Número de Peito
- Tempo Objetivo (HH:MM:SS)
- Observações/Notas

### 4. **Status da Prova**
- **Upcoming** (próxima) - padrão
- **Completed** (concluída)
- **Cancelled** (cancelada)

### 5. **Resultados** (após completar)
- Tempo Final
- Colocação Geral

---

## 🗄️ Database

### Tabela: `race_registrations`

```sql
CREATE TABLE choppinho.race_registrations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- OBRIGATÓRIOS
  race_name VARCHAR(255) NOT NULL,
  race_date DATE NOT NULL,
  distance DECIMAL(6,2) NOT NULL,
  race_type VARCHAR(50) DEFAULT 'running',
  
  -- OPCIONAIS
  location VARCHAR(255),
  registration_number VARCHAR(50),
  goal_time INTERVAL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'upcoming',
  result_time INTERVAL,
  result_position INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Constraints:**
- `race_type IN ('running', 'triathlon', 'ironman')`
- `status IN ('upcoming', 'completed', 'cancelled')`
- `distance > 0`

**Índices:**
- `user_id` (FK)
- `race_date DESC`
- `status`

---

## 🔌 Backend (Cloudflare Functions)

### **GET /api/races**
Lista todas as provas do usuário, ordenadas por data (mais próximas primeiro).

**Response:**
```json
{
  "success": true,
  "data": {
    "races": [
      {
        "id": "uuid",
        "race_name": "Maratona do Rio 2026",
        "race_date": "2026-06-07",
        "distance": 42.2,
        "race_type": "running",
        "location": "Rio de Janeiro, RJ",
        "registration_number": "1234",
        "goal_time": "03:30:00",
        "notes": "Treinar subidas",
        "status": "upcoming",
        "created_at": "...",
        "updated_at": "..."
      }
    ]
  }
}
```

---

### **POST /api/races**
Cria nova prova.

**Request:**
```json
{
  "race_type": "running",
  "race_name": "Maratona do Rio 2026",
  "race_date": "2026-06-07",
  "distance": 42.2,
  "location": "Rio de Janeiro, RJ",
  "registration_number": "1234",
  "goal_time": "03:30:00",
  "notes": "Treinar subidas"
}
```

**Validações:**
- race_name não pode ser vazio
- race_date é obrigatória
- distance deve ser > 0
- race_type deve ser 'running', 'triathlon' ou 'ironman'

---

### **PUT /api/races**
Atualiza prova existente.

**Request:**
```json
{
  "id": "uuid",
  "race_name": "Novo Nome",
  "goal_time": "03:00:00",
  "status": "completed",
  "result_time": "03:25:30",
  "result_position": 150
}
```

**Lógica:**
- Apenas campos enviados são atualizados
- Verifica ownership (user_id)
- Atualiza `updated_at` automaticamente

---

### **DELETE /api/races?id=uuid**
Remove prova do usuário.

**Response:**
```json
{
  "success": true,
  "message": "Prova removida com sucesso"
}
```

---

## 🎨 Frontend

### **Página: `/dashboard/races`**

#### **Features:**

1. **Lista de Provas**
   - Cards visuais com informações principais
   - Badges coloridos por tipo:
     - 🏃 Corrida = laranja
     - 🏊 Triatlon = azul
     - 💪 Ironman = vermelho
   - Badge de status (próxima/concluída/cancelada)
   - Countdown até a data ("Faltam 15 dias")
   - Ícones para cada informação (calendário, troféu, mapa, etc)

2. **Modal de Adicionar/Editar**
   - **Seção 1: Dados Obrigatórios**
     - Tipo de Prova (dropdown - PRIMEIRO campo)
     - Nome da Prova
     - Data + Distância (lado a lado)
   
   - **Seção 2: Dados Opcionais** (separada visualmente)
     - Local
     - Nº de Peito + Tempo Objetivo
     - Observações (textarea)

3. **Actions**
   - Botão "Adicionar Prova" (header)
   - Editar prova (ícone lápis)
   - Excluir prova (ícone lixeira + confirmação)

4. **Empty State**
   - Ícone de troféu
   - Mensagem amigável
   - CTA para adicionar primeira prova

5. **Toast Notifications**
   - Sucesso ao criar/editar
   - Erro em validações
   - Feedback ao excluir

---

## 🚀 Como Usar

### 1. **Rodar Migration SQL**

```bash
# Conectar ao Supabase e executar:
psql -h <host> -U postgres -d postgres -f CREATE-RACE-REGISTRATIONS.sql
```

### 2. **Acessar no App**

```
https://choppinhofit.com.br/dashboard/races
```

### 3. **Adicionar Primeira Prova**

1. Clicar em "Adicionar Prova"
2. Selecionar tipo: Corrida (padrão)
3. Preencher dados obrigatórios
4. (Opcional) Adicionar local, nº peito, meta
5. Salvar

### 4. **Ver Countdown**

- Provas "upcoming" mostram "Faltam X dias"
- Amanhã = "Amanhã"
- Hoje = "Hoje!"

### 5. **Marcar como Concluída**

1. Editar prova
2. Adicionar `result_time` e `result_position` (opcional)
3. Status será atualizado automaticamente

---

## 🎯 Próximos Passos (Futuro)

- [ ] Filtros: Próximas / Concluídas / Todas
- [ ] Ordenação: Data / Distância / Nome
- [ ] Card de "Próxima Prova" no Dashboard principal
- [ ] Notificações WhatsApp X dias antes da prova
- [ ] Upload de foto do kit/medalha
- [ ] Gráfico de evolução de tempos por distância
- [ ] Exportar relatório PDF com histórico de provas

---

## 📝 Checklist de Implementação

- [x] Database: Tabela `race_registrations`
- [x] Backend: CRUD completo (/api/races)
- [x] Frontend: Página /dashboard/races
- [x] Frontend: Modal de adicionar/editar
- [x] Frontend: Separação visual obrigatório/opcional
- [x] Frontend: Tipo de Prova como primeiro campo
- [x] Frontend: Badges coloridos por tipo
- [x] Frontend: Countdown até a data
- [x] Frontend: Toast notifications
- [x] Roteamento: /dashboard/races
- [x] Menu: Link "Provas" no header
- [x] Build testado com sucesso
- [x] Commit realizado

---

**Status:** ✅ FASE 7 - Completamente implementada e funcional!
