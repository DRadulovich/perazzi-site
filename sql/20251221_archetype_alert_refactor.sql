-- Refactor archetype margin alert: persist payload and return JSON
-- Safe to run repeatedly (CREATE IF NOT EXISTS / CREATE OR REPLACE).

-- 1. Log table for pull-based consumers ------------------------------------
CREATE TABLE IF NOT EXISTS archetype_margin_alert_log (
  id           bigserial PRIMARY KEY,
  created_at   timestamptz DEFAULT now(),
  curr_margin  numeric,
  ref_margin   numeric,
  message      text
);

-- 2. Replace alert function --------------------------------------------------
CREATE OR REPLACE FUNCTION fn_check_archetype_margin()
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  curr numeric;
  ref  numeric;
  payload jsonb;
BEGIN
  -- current 7-day rolling average
  SELECT avg(avg_margin) INTO curr
  FROM vw_archetype_daily
  WHERE day >= current_date - INTERVAL '7 days';

  -- reference window: 30-23 days ago (7-day slice)
  SELECT avg(avg_margin) INTO ref
  FROM vw_archetype_daily
  WHERE day BETWEEN current_date - INTERVAL '30 days' AND current_date - INTERVAL '23 days';

  IF ref > 0 AND curr < ref * 0.8 THEN
    payload := jsonb_build_object(
      'triggered', true,
      'curr', curr,
      'ref',  ref,
      'message', 'Avg margin dropped >20%'
    );

    -- Notify listeners
    PERFORM pg_notify('archetype_alert', payload::text);

    -- Persist for later inspection
    INSERT INTO archetype_margin_alert_log(curr_margin, ref_margin, message)
    VALUES (curr, ref, payload->>'message');

    RETURN payload;
  END IF;

  -- No alert triggered
  RETURN jsonb_build_object('triggered', false);
END $$;

-- 3. (Optional) Reschedule if using pg_cron ---------------------------------
-- Uncomment if you want to recreate the job.
-- SELECT cron.unschedule('archetype_margin_alert');
-- SELECT cron.schedule('archetype_margin_alert', '0 8 * * *', $$
--   SELECT fn_check_archetype_margin();
-- $$);
