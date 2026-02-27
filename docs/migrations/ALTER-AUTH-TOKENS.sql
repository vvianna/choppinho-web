-- ALTER-AUTH-TOKENS.sql
-- Altera a coluna 'token' de UUID para VARCHAR(10) para suportar short tokens

-- 1. Dropar o default (gen_random_uuid)
ALTER TABLE choppinho.auth_tokens
ALTER COLUMN token DROP DEFAULT;

-- 2. Alterar tipo da coluna de UUID para VARCHAR(10)
ALTER TABLE choppinho.auth_tokens
ALTER COLUMN token TYPE VARCHAR(10) USING token::TEXT;

-- 3. Verificar estrutura atualizada
\d choppinho.auth_tokens;

-- 4. Verificar dados existentes (se houver)
SELECT id, phone_number, token, pin_code, used, expires_at
FROM choppinho.auth_tokens
ORDER BY created_at DESC
LIMIT 5;
