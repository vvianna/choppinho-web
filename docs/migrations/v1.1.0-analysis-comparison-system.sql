-- ============================================================================
-- Migration: v1.1.0 - Sistema de Análise com IA e Comparação de Treinos
-- Date: 2026-03-04
-- Description: Adiciona estrutura para análises inteligentes e comparação de treinos
-- ============================================================================

-- ============================================================================
-- PARTE 1: SISTEMA DE ANÁLISE COM IA
-- ============================================================================

-- Adicionar campos para análises na tabela de atividades
ALTER TABLE choppinho.activities ADD COLUMN IF NOT EXISTS raw_data JSONB;
ALTER TABLE choppinho.activities ADD COLUMN IF NOT EXISTS analysis_summary TEXT;
ALTER TABLE choppinho.activities ADD COLUMN IF NOT EXISTS analysis_detailed TEXT;
ALTER TABLE choppinho.activities ADD COLUMN IF NOT EXISTS analysis_generated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE choppinho.activities ADD COLUMN IF NOT EXISTS summary_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE choppinho.activities ADD COLUMN IF NOT EXISTS detailed_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE choppinho.activities ADD COLUMN IF NOT EXISTS analysis_insights JSONB;

-- Criar índices para busca eficiente de análises
CREATE INDEX IF NOT EXISTS idx_activities_summary_sent ON choppinho.activities(summary_sent) WHERE summary_sent = FALSE;
CREATE INDEX IF NOT EXISTS idx_activities_detailed_sent ON choppinho.activities(detailed_sent) WHERE detailed_sent = FALSE;
CREATE INDEX IF NOT EXISTS idx_activities_analysis_generated ON choppinho.activities(analysis_generated_at);

-- Comentários para documentação
COMMENT ON COLUMN choppinho.activities.raw_data IS 'Dados completos da atividade vindos do Strava (JSON original)';
COMMENT ON COLUMN choppinho.activities.analysis_summary IS 'Resumo da análise em 2-3 linhas para envio rápido via WhatsApp';
COMMENT ON COLUMN choppinho.activities.analysis_detailed IS 'Análise completa e detalhada do treino com recomendações';
COMMENT ON COLUMN choppinho.activities.analysis_generated_at IS 'Timestamp de quando a análise foi gerada pela IA';
COMMENT ON COLUMN choppinho.activities.summary_sent IS 'Flag indicando se o resumo já foi enviado via WhatsApp';
COMMENT ON COLUMN choppinho.activities.detailed_sent IS 'Flag indicando se a análise detalhada já foi enviada';
COMMENT ON COLUMN choppinho.activities.analysis_insights IS 'Insights estruturados em JSON para processamento e visualização';

-- ============================================================================
-- PARTE 2: SISTEMA DE COMPARAÇÃO DE TREINOS
-- ============================================================================

-- Criar tabela para armazenar comparações entre atividades
CREATE TABLE IF NOT EXISTS choppinho.activity_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES choppinho.users(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES choppinho.activities(id) ON DELETE CASCADE,
    compared_with_id UUID NOT NULL REFERENCES choppinho.activities(id) ON DELETE CASCADE,
    comparison_type VARCHAR(50) NOT NULL, -- 'similar_distance', 'similar_route', 'pb_attempt', 'weekly_best', 'monthly_best'
    similarity_score DECIMAL(3,2) CHECK (similarity_score >= 0 AND similarity_score <= 1), -- 0.00 a 1.00
    metrics_comparison JSONB NOT NULL,
    insights TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT different_activities CHECK (activity_id != compared_with_id),
    CONSTRAINT unique_comparison UNIQUE (activity_id, compared_with_id, comparison_type)
);

-- Criar índices para buscas eficientes
CREATE INDEX IF NOT EXISTS idx_comparisons_user ON choppinho.activity_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_activity ON choppinho.activity_comparisons(activity_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_compared_with ON choppinho.activity_comparisons(compared_with_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_type ON choppinho.activity_comparisons(comparison_type);
CREATE INDEX IF NOT EXISTS idx_comparisons_generated ON choppinho.activity_comparisons(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_comparisons_similarity ON choppinho.activity_comparisons(similarity_score DESC);

-- Comentários para documentação
COMMENT ON TABLE choppinho.activity_comparisons IS 'Armazena comparações entre treinos para análise de evolução';
COMMENT ON COLUMN choppinho.activity_comparisons.comparison_type IS 'Tipo de comparação: similar_distance, similar_route, pb_attempt, weekly_best, monthly_best';
COMMENT ON COLUMN choppinho.activity_comparisons.similarity_score IS 'Score de similaridade entre 0 e 1, onde 1 é idêntico';
COMMENT ON COLUMN choppinho.activity_comparisons.metrics_comparison IS 'JSON com métricas comparativas detalhadas';

-- ============================================================================
-- PARTE 3: VIEW MATERIALIZADA PARA ACESSO EXTERNO
-- ============================================================================

-- Criar view materializada para performance em consultas externas
CREATE MATERIALIZED VIEW IF NOT EXISTS choppinho.activity_comparisons_view AS
SELECT
    ac.id,
    ac.user_id,
    ac.activity_id,
    ac.compared_with_id,
    ac.comparison_type,
    ac.similarity_score,
    ac.metrics_comparison,
    ac.insights,
    ac.generated_at,

    -- Dados da atividade principal
    a1.start_date as activity_date,
    a1.distance_meters as activity_distance,
    a1.moving_time_seconds as activity_time,
    a1.average_speed as activity_speed,
    a1.average_heartrate as activity_hr,

    -- Dados da atividade comparada
    a2.start_date as compared_date,
    a2.distance_meters as compared_distance,
    a2.moving_time_seconds as compared_time,
    a2.average_speed as compared_speed,
    a2.average_heartrate as compared_hr,

    -- Cálculos pré-computados (com casts explícitos para numeric)
    ROUND((a2.distance_meters::numeric - a1.distance_meters::numeric) / NULLIF(a1.distance_meters::numeric, 0) * 100, 2) as distance_change_pct,
    ROUND((a2.average_speed::numeric - a1.average_speed::numeric) / NULLIF(a1.average_speed::numeric, 0) * 100, 2) as speed_change_pct,
    ROUND((a1.moving_time_seconds::numeric - a2.moving_time_seconds::numeric) / NULLIF(a1.moving_time_seconds::numeric, 0) * 100, 2) as time_improvement_pct,

    -- User info
    COALESCE(u.first_name, u.wa_name) as user_name,
    u.phone_number as user_phone

FROM choppinho.activity_comparisons ac
JOIN choppinho.activities a1 ON ac.activity_id = a1.id
JOIN choppinho.activities a2 ON ac.compared_with_id = a2.id
JOIN choppinho.users u ON ac.user_id = u.id
WITH DATA;

-- Criar índices na view materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_comparisons_view_id ON choppinho.activity_comparisons_view(id);
CREATE INDEX IF NOT EXISTS idx_comparisons_view_user ON choppinho.activity_comparisons_view(user_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_view_activity ON choppinho.activity_comparisons_view(activity_id);

-- ============================================================================
-- PARTE 4: FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para calcular similaridade entre duas atividades
CREATE OR REPLACE FUNCTION choppinho.calculate_activity_similarity(
    activity1_id UUID,
    activity2_id UUID
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    a1 RECORD;
    a2 RECORD;
    distance_similarity DECIMAL(3,2);
    duration_similarity DECIMAL(3,2);
    speed_similarity DECIMAL(3,2);
    total_similarity DECIMAL(3,2);
BEGIN
    -- Buscar dados das atividades
    SELECT * INTO a1 FROM choppinho.activities WHERE id = activity1_id;
    SELECT * INTO a2 FROM choppinho.activities WHERE id = activity2_id;

    -- Calcular similaridade de distância (peso 40%)
    distance_similarity := 1 - ABS(a1.distance_meters::numeric - a2.distance_meters::numeric) / GREATEST(a1.distance_meters::numeric, a2.distance_meters::numeric);

    -- Calcular similaridade de duração (peso 30%)
    duration_similarity := 1 - ABS(a1.moving_time_seconds::numeric - a2.moving_time_seconds::numeric) / GREATEST(a1.moving_time_seconds::numeric, a2.moving_time_seconds::numeric);

    -- Calcular similaridade de velocidade (peso 30%)
    speed_similarity := 1 - ABS(a1.average_speed::numeric - a2.average_speed::numeric) / GREATEST(a1.average_speed::numeric, a2.average_speed::numeric);

    -- Calcular similaridade total ponderada
    total_similarity := (distance_similarity * 0.4 + duration_similarity * 0.3 + speed_similarity * 0.3);

    RETURN total_similarity;
END;
$$ LANGUAGE plpgsql;

-- Função para encontrar atividades similares automaticamente
CREATE OR REPLACE FUNCTION choppinho.find_similar_activities(
    target_activity_id UUID,
    max_results INTEGER DEFAULT 5
) RETURNS TABLE(
    activity_id UUID,
    similarity_score DECIMAL(3,2),
    distance_diff_meters INTEGER,
    pace_diff_seconds INTEGER
) AS $$
DECLARE
    target RECORD;
BEGIN
    -- Buscar dados da atividade alvo
    SELECT * INTO target FROM choppinho.activities WHERE id = target_activity_id;

    RETURN QUERY
    SELECT
        a.id,
        choppinho.calculate_activity_similarity(target_activity_id, a.id) as similarity_score,
        ABS(a.distance_meters::numeric - target.distance_meters::numeric)::INTEGER as distance_diff_meters,
        ABS(ROUND(a.moving_time_seconds::numeric / NULLIF(a.distance_meters::numeric, 0) * 1000) -
            ROUND(target.moving_time_seconds::numeric / NULLIF(target.distance_meters::numeric, 0) * 1000))::INTEGER as pace_diff_seconds
    FROM choppinho.activities a
    WHERE
        a.user_id = target.user_id
        AND a.id != target_activity_id
        AND a.activity_type = target.activity_type
        AND ABS(a.distance_meters::numeric - target.distance_meters::numeric) <= target.distance_meters::numeric * 0.2 -- Máximo 20% de diferença
    ORDER BY similarity_score DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar comparação automática após novo treino
CREATE OR REPLACE FUNCTION choppinho.generate_automatic_comparisons(
    new_activity_id UUID
) RETURNS INTEGER AS $$
DECLARE
    comparison_count INTEGER := 0;
    metrics_json JSONB;
    rec RECORD;
    v_user_id UUID;
BEGIN
    -- Buscar o user_id da nova atividade
    SELECT user_id INTO v_user_id FROM choppinho.activities WHERE id = new_activity_id;

    IF v_user_id IS NULL THEN
        RETURN 0;
    END IF;

    -- Buscar atividades similares e processar
    FOR rec IN
        SELECT
            activity_id,
            similarity_score,
            distance_diff_meters,
            pace_diff_seconds
        FROM choppinho.find_similar_activities(new_activity_id, 3)
    LOOP
        -- Construir JSON de métricas
        metrics_json := jsonb_build_object(
            'similarity_score', rec.similarity_score,
            'distance_diff_meters', rec.distance_diff_meters,
            'pace_diff_seconds', rec.pace_diff_seconds
        );

        -- Inserir comparação
        INSERT INTO choppinho.activity_comparisons (
            user_id,
            activity_id,
            compared_with_id,
            comparison_type,
            similarity_score,
            metrics_comparison
        )
        VALUES (
            v_user_id,
            new_activity_id,
            rec.activity_id,
            'similar_distance',
            rec.similarity_score,
            metrics_json
        )
        ON CONFLICT (activity_id, compared_with_id, comparison_type)
        DO UPDATE SET
            similarity_score = EXCLUDED.similarity_score,
            metrics_comparison = EXCLUDED.metrics_comparison,
            generated_at = NOW();

        comparison_count := comparison_count + 1;
    END LOOP;

    RETURN comparison_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTE 5: TRIGGERS
-- ============================================================================

-- Trigger para gerar comparações automaticamente após inserção de atividade
CREATE OR REPLACE FUNCTION choppinho.trigger_generate_comparisons()
RETURNS TRIGGER AS $$
BEGIN
    -- Gerar comparações em background (não bloquear insert)
    PERFORM choppinho.generate_automatic_comparisons(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger apenas se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'after_activity_insert_comparisons'
    ) THEN
        CREATE TRIGGER after_activity_insert_comparisons
        AFTER INSERT ON choppinho.activities
        FOR EACH ROW
        EXECUTE FUNCTION choppinho.trigger_generate_comparisons();
    END IF;
END
$$;

-- ============================================================================
-- PARTE 6: FUNÇÃO PARA REFRESH DA VIEW MATERIALIZADA
-- ============================================================================

CREATE OR REPLACE FUNCTION choppinho.refresh_comparisons_view()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY choppinho.activity_comparisons_view;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTE 7: PERMISSÕES
-- ============================================================================

-- Garantir que o usuário da aplicação tenha as permissões necessárias
GRANT SELECT, INSERT, UPDATE ON choppinho.activities TO authenticated;
GRANT SELECT, INSERT ON choppinho.activity_comparisons TO authenticated;
GRANT SELECT ON choppinho.activity_comparisons_view TO authenticated;
GRANT EXECUTE ON FUNCTION choppinho.calculate_activity_similarity TO authenticated;
GRANT EXECUTE ON FUNCTION choppinho.find_similar_activities TO authenticated;
GRANT EXECUTE ON FUNCTION choppinho.generate_automatic_comparisons TO authenticated;

-- ============================================================================
-- ROLLBACK SCRIPT (em caso de necessidade)
-- ============================================================================

/*
-- Para reverter esta migration, execute:

-- Remover trigger
DROP TRIGGER IF EXISTS after_activity_insert_comparisons ON choppinho.activities;

-- Remover funções
DROP FUNCTION IF EXISTS choppinho.trigger_generate_comparisons();
DROP FUNCTION IF EXISTS choppinho.generate_automatic_comparisons(UUID);
DROP FUNCTION IF EXISTS choppinho.find_similar_activities(UUID, INTEGER);
DROP FUNCTION IF EXISTS choppinho.calculate_activity_similarity(UUID, UUID);
DROP FUNCTION IF EXISTS choppinho.refresh_comparisons_view();

-- Remover view materializada
DROP MATERIALIZED VIEW IF EXISTS choppinho.activity_comparisons_view;

-- Remover tabela de comparações
DROP TABLE IF EXISTS choppinho.activity_comparisons;

-- Remover colunas de análise
ALTER TABLE choppinho.activities
DROP COLUMN IF EXISTS raw_data,
DROP COLUMN IF EXISTS analysis_summary,
DROP COLUMN IF EXISTS analysis_detailed,
DROP COLUMN IF EXISTS analysis_generated_at,
DROP COLUMN IF EXISTS summary_sent,
DROP COLUMN IF EXISTS detailed_sent,
DROP COLUMN IF EXISTS analysis_insights;
*/