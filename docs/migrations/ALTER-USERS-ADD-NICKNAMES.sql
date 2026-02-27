-- ALTER-USERS-ADD-NICKNAMES.sql
-- Adiciona coluna 'nicknames' para armazenar lista de apelidos do usuário

-- Adicionar coluna nicknames como JSONB (array de strings)
ALTER TABLE choppinho.users
ADD COLUMN IF NOT EXISTS nicknames JSONB DEFAULT '[]'::JSONB;

-- Index GIN para busca eficiente (caso necessário no futuro)
CREATE INDEX IF NOT EXISTS idx_users_nicknames
ON choppinho.users USING GIN (nicknames);

-- Comentário explicativo
COMMENT ON COLUMN choppinho.users.nicknames IS
'Lista de apelidos para personalização de mensagens do bot (ex: ["Monstro", "Fera", "Campeão"]). Máximo 10 apelidos.';

-- Verificar estrutura atualizada
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'choppinho'
  AND table_name = 'users'
  AND column_name = 'nicknames';

-- Exemplo de uso: adicionar apelidos
-- UPDATE choppinho.users
-- SET nicknames = '["Monstro", "Fera", "Campeão"]'::JSONB
-- WHERE phone_number = '+5521982238663';

-- Exemplo de consulta: buscar usuário com apelidos
-- SELECT id, phone_number, first_name, nicknames
-- FROM choppinho.users
-- WHERE phone_number = '+5521982238663';
