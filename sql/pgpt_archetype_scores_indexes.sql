-- Optional indices for archetype distribution filtering.
-- NOTE: CREATE INDEX CONCURRENTLY cannot run inside a transaction.

-- Helpful for JSON containment queries on metadata (future use)
CREATE INDEX CONCURRENTLY IF NOT EXISTS perazzi_conversation_logs_metadata_gin
  ON perazzi_conversation_logs USING GIN (metadata jsonb_path_ops);

-- Useful for filtering by confidence thresholds
CREATE INDEX CONCURRENTLY IF NOT EXISTS perazzi_conversation_logs_archetype_confidence_idx
  ON perazzi_conversation_logs (((metadata->>'archetypeConfidence')::float));

-- Useful for filtering numeric thresholds per archetype (fixed set of 5 keys)
CREATE INDEX CONCURRENTLY IF NOT EXISTS perazzi_logs_arch_loyalist_idx
  ON perazzi_conversation_logs (((metadata->'archetypeScores'->>'Loyalist')::float));

CREATE INDEX CONCURRENTLY IF NOT EXISTS perazzi_logs_arch_prestige_idx
  ON perazzi_conversation_logs (((metadata->'archetypeScores'->>'Prestige')::float));

CREATE INDEX CONCURRENTLY IF NOT EXISTS perazzi_logs_arch_analyst_idx
  ON perazzi_conversation_logs (((metadata->'archetypeScores'->>'Analyst')::float));

CREATE INDEX CONCURRENTLY IF NOT EXISTS perazzi_logs_arch_achiever_idx
  ON perazzi_conversation_logs (((metadata->'archetypeScores'->>'Achiever')::float));

CREATE INDEX CONCURRENTLY IF NOT EXISTS perazzi_logs_arch_legacy_idx
  ON perazzi_conversation_logs (((metadata->'archetypeScores'->>'Legacy')::float));
