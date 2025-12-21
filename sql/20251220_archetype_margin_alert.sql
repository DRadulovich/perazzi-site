-- Archetype margin drop alert
-- Requires pg_cron extension or Supabase scheduled task.
-- This script creates a stored function and schedules it daily at 08:00 UTC.

-- 1. Notify function -------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_check_archetype_margin()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  curr numeric;
  ref  numeric;
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
    PERFORM pg_notify(
      'archetype_alert',
      json_build_object(
        'curr', curr,
        'ref',  ref,
        'message', 'Avg margin dropped >20%'
      )::text
    );
  END IF;
END $$;

-- 2. Schedule via pg_cron (runs daily at 08:00 UTC) ------------------------
-- Uncomment if pg_cron is available; otherwise schedule in Supabase UI.
--
-- SELECT cron.schedule('archetype_margin_alert', '0 8 * * *', $$
--   SELECT fn_check_archetype_margin();
-- $$);
