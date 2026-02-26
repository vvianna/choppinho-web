-- SEED-FAKE-DATA.sql
-- Script para inserir dados fake de corridas para testes
-- Usuário: (21) 98223 8663 = +5521982238663

-- Primeiro, vamos garantir que o usuário existe
-- Se não existir, criamos um usuário básico
INSERT INTO choppinho.users (phone_number, full_name, created_at)
VALUES ('+5521982238663', 'Victor Teste', NOW())
ON CONFLICT (phone_number) DO NOTHING;

-- Pegar o user_id do usuário
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar o user_id
  SELECT id INTO v_user_id
  FROM choppinho.users
  WHERE phone_number = '+5521982238663';

  -- Inserir atividades fake dos últimos 30 dias
  -- Vamos criar um padrão realista de corridas

  -- Semana 1 (há 4 semanas) - 3 corridas
  INSERT INTO choppinho.activities (user_id, activity_date, distance_km, duration_minutes, avg_pace_min_per_km, calories, activity_type, created_at)
  VALUES
    (v_user_id, CURRENT_DATE - INTERVAL '28 days', 5.2, 32, '6:09', 320, 'run', NOW() - INTERVAL '28 days'),
    (v_user_id, CURRENT_DATE - INTERVAL '26 days', 8.5, 55, '6:28', 510, 'run', NOW() - INTERVAL '26 days'),
    (v_user_id, CURRENT_DATE - INTERVAL '24 days', 6.0, 38, '6:20', 370, 'run', NOW() - INTERVAL '24 days');

  -- Semana 2 (há 3 semanas) - 4 corridas
  INSERT INTO choppinho.activities (user_id, activity_date, distance_km, duration_minutes, avg_pace_min_per_km, calories, activity_type, created_at)
  VALUES
    (v_user_id, CURRENT_DATE - INTERVAL '21 days', 5.8, 36, '6:12', 350, 'run', NOW() - INTERVAL '21 days'),
    (v_user_id, CURRENT_DATE - INTERVAL '19 days', 10.0, 64, '6:24', 600, 'run', NOW() - INTERVAL '19 days'),
    (v_user_id, CURRENT_DATE - INTERVAL '18 days', 7.2, 45, '6:15', 430, 'run', NOW() - INTERVAL '18 days'),
    (v_user_id, CURRENT_DATE - INTERVAL '16 days', 5.0, 31, '6:12', 300, 'run', NOW() - INTERVAL '16 days');

  -- Semana 3 (há 2 semanas) - 5 corridas (boa semana!)
  INSERT INTO choppinho.activities (user_id, activity_date, distance_km, duration_minutes, avg_pace_min_per_km, calories, activity_type, created_at)
  VALUES
    (v_user_id, CURRENT_DATE - INTERVAL '14 days', 6.5, 40, '6:09', 390, 'run', NOW() - INTERVAL '14 days'),
    (v_user_id, CURRENT_DATE - INTERVAL '12 days', 8.0, 50, '6:15', 480, 'run', NOW() - INTERVAL '12 days'),
    (v_user_id, CURRENT_DATE - INTERVAL '11 days', 12.0, 76, '6:20', 720, 'run', NOW() - INTERVAL '11 days'),
    (v_user_id, CURRENT_DATE - INTERVAL '10 days', 5.5, 34, '6:11', 330, 'run', NOW() - INTERVAL '10 days'),
    (v_user_id, CURRENT_DATE - INTERVAL '8 days', 7.8, 48, '6:09', 470, 'run', NOW() - INTERVAL '8 days');

  -- Semana 4 (semana atual) - 3 corridas até agora
  INSERT INTO choppinho.activities (user_id, activity_date, distance_km, duration_minutes, avg_pace_min_per_km, calories, activity_type, created_at)
  VALUES
    (v_user_id, CURRENT_DATE - INTERVAL '6 days', 9.2, 58, '6:18', 550, 'run', NOW() - INTERVAL '6 days'),
    (v_user_id, CURRENT_DATE - INTERVAL '4 days', 6.8, 42, '6:10', 410, 'run', NOW() - INTERVAL '4 days'),
    (v_user_id, CURRENT_DATE - INTERVAL '2 days', 10.5, 66, '6:17', 630, 'run', NOW() - INTERVAL '2 days');

  -- Adicionar algumas corridas em dias específicos da semana para testar distribuição
  -- Segunda-feira
  INSERT INTO choppinho.activities (user_id, activity_date, distance_km, duration_minutes, avg_pace_min_per_km, calories, activity_type, created_at)
  VALUES
    (v_user_id, CURRENT_DATE - INTERVAL '7 days' + INTERVAL '0 days', 7.0, 44, '6:17', 420, 'run', NOW() - INTERVAL '7 days');

  -- Quarta-feira
  INSERT INTO choppinho.activities (user_id, activity_date, distance_km, duration_minutes, avg_pace_min_per_km, calories, activity_type, created_at)
  VALUES
    (v_user_id, CURRENT_DATE - INTERVAL '5 days', 8.2, 52, '6:20', 490, 'run', NOW() - INTERVAL '5 days');

  -- Sexta-feira (para pegar choppinho!)
  INSERT INTO choppinho.activities (user_id, activity_date, distance_km, duration_minutes, avg_pace_min_per_km, calories, activity_type, created_at)
  VALUES
    (v_user_id, CURRENT_DATE - INTERVAL '3 days', 5.5, 34, '6:11', 330, 'run', NOW() - INTERVAL '3 days');

  -- Domingo
  INSERT INTO choppinho.activities (user_id, activity_date, distance_km, duration_minutes, avg_pace_min_per_km, calories, activity_type, created_at)
  VALUES
    (v_user_id, CURRENT_DATE - INTERVAL '1 day', 15.0, 96, '6:24', 900, 'run', NOW() - INTERVAL '1 day');

  RAISE NOTICE 'Dados fake inseridos com sucesso para o usuário %', v_user_id;
END $$;

-- Verificar o que foi inserido
SELECT
  u.phone_number,
  u.full_name,
  COUNT(a.id) as total_corridas,
  ROUND(SUM(a.distance_km)::numeric, 2) as total_km,
  ROUND(AVG(a.distance_km)::numeric, 2) as media_km_por_corrida
FROM choppinho.users u
LEFT JOIN choppinho.activities a ON a.user_id = u.id
WHERE u.phone_number = '+5521982238663'
GROUP BY u.id, u.phone_number, u.full_name;

-- Verificar distribuição por semana (para weekly_evolution)
SELECT
  DATE_TRUNC('week', activity_date) as week_start,
  COUNT(*) as corridas,
  ROUND(SUM(distance_km)::numeric, 2) as total_km
FROM choppinho.activities
WHERE user_id = (SELECT id FROM choppinho.users WHERE phone_number = '+5521982238663')
  AND activity_date >= CURRENT_DATE - INTERVAL '4 weeks'
GROUP BY DATE_TRUNC('week', activity_date)
ORDER BY week_start;

-- Verificar distribuição por dia da semana
SELECT
  TO_CHAR(activity_date, 'Day') as dia_semana,
  EXTRACT(DOW FROM activity_date) as dow,
  COUNT(*) as quantidade_corridas,
  ROUND(SUM(distance_km)::numeric, 2) as total_km
FROM choppinho.activities
WHERE user_id = (SELECT id FROM choppinho.users WHERE phone_number = '+5521982238663')
GROUP BY TO_CHAR(activity_date, 'Day'), EXTRACT(DOW FROM activity_date)
ORDER BY dow;
