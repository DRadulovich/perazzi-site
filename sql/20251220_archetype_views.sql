-- Archetype analytics views (Pass 6)
-- Creates daily distribution view and weekly trigger-term view.
-- Safe to run repeatedly (CREATE OR REPLACE).

-- 1. Daily archetype distribution + average margin
CREATE OR REPLACE VIEW vw_archetype_daily AS
SELECT
  date_trunc('day', created_at) AS day,
  coalesce(metadata->>'archetype', 'null') AS archetype,
  count(*)                       AS cnt,
  avg((metadata->>'archetypeConfidenceMargin')::float) AS avg_margin
FROM perazzi_conversation_logs
WHERE endpoint = 'assistant'
GROUP BY 1, 2;

-- 2. Weekly trigger-term frequency
CREATE OR REPLACE VIEW vw_trigger_terms_weekly AS
SELECT
  date_trunc('week', created_at) AS week,
  jsonb_array_elements_text(metadata->'signalsUsed') AS token,
  count(*) AS hits
FROM perazzi_conversation_logs
WHERE endpoint = 'assistant'
  AND metadata ? 'signalsUsed'
GROUP BY 1, 2
ORDER BY week DESC, hits DESC;
