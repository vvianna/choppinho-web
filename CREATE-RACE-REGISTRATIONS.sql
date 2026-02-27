-- FASE 7: Tabela de Provas Inscritas
-- Criado em: 2026-02-26

CREATE TABLE IF NOT EXISTS choppinho.race_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES choppinho.users(id) ON DELETE CASCADE,
  
  -- Campos OBRIGATÓRIOS
  race_name VARCHAR(255) NOT NULL,
  race_date DATE NOT NULL,
  distance DECIMAL(6,2) NOT NULL, -- Ex: 5.00, 10.00, 21.10, 42.20, 140.60
  
  -- Tipo de prova (padrão: corrida)
  race_type VARCHAR(50) NOT NULL DEFAULT 'running',
  -- Valores: 'running', 'triathlon', 'ironman'
  
  -- Campos OPCIONAIS
  location VARCHAR(255), -- Cidade/Local
  registration_number VARCHAR(50), -- Número de peito
  goal_time INTERVAL, -- Tempo objetivo (ex: '01:45:00')
  notes TEXT, -- Observações gerais
  
  -- Status da prova
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming',
  -- Valores: 'upcoming', 'completed', 'cancelled'
  
  -- Resultados (preenchido após a prova)
  result_time INTERVAL, -- Tempo final
  result_position INTEGER, -- Colocação geral
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_race_registrations_user_id 
ON choppinho.race_registrations(user_id);

CREATE INDEX IF NOT EXISTS idx_race_registrations_race_date 
ON choppinho.race_registrations(race_date DESC);

CREATE INDEX IF NOT EXISTS idx_race_registrations_status 
ON choppinho.race_registrations(status);

-- Constraint: distance deve ser positiva
ALTER TABLE choppinho.race_registrations
ADD CONSTRAINT check_distance_positive CHECK (distance > 0);

-- Constraint: status válido
ALTER TABLE choppinho.race_registrations
ADD CONSTRAINT check_status_valid 
CHECK (status IN ('upcoming', 'completed', 'cancelled'));

-- Constraint: race_type válido
ALTER TABLE choppinho.race_registrations
ADD CONSTRAINT check_race_type_valid 
CHECK (race_type IN ('running', 'triathlon', 'ironman'));

-- Comentários
COMMENT ON TABLE choppinho.race_registrations IS 
'Provas/corridas que o usuário se inscreveu (foco: corrida, mas suporta triatlon e ironman)';

COMMENT ON COLUMN choppinho.race_registrations.race_type IS 
'Tipo de prova: running (padrão), triathlon, ironman';

COMMENT ON COLUMN choppinho.race_registrations.distance IS 
'Distância em KM. Ex: 5, 10, 21.1, 42.2, 140.6';

COMMENT ON COLUMN choppinho.race_registrations.goal_time IS 
'Tempo objetivo do atleta para completar a prova';

COMMENT ON COLUMN choppinho.race_registrations.result_time IS 
'Tempo final após completar a prova';

COMMENT ON COLUMN choppinho.race_registrations.status IS 
'upcoming = futura, completed = concluída, cancelled = cancelada';
