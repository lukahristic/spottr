-- Switch retention cron to a custom shared secret
--
-- The previous attempt read SUPABASE_SERVICE_ROLE_KEY in the
-- function and pulled the same value from vault.decrypted_secrets
-- in the cron body. That returned 401 because Supabase injects a
-- different value into the function's env var than the JWT shown in
-- the dashboard (a side effect of the recent dual-key rollout).
--
-- This migration switches the auth to a custom shared secret that
-- the team controls end to end:
--   - Vault stores the value under "retention_cron_secret"
--   - Function reads the value from RETENTION_CRON_SECRET env var
--   - Cron pulls from vault and passes as a Bearer token
--
-- Operator setup steps documented in the project plan.

-- Reschedule cron with the new vault key name.
SELECT cron.unschedule('spottr-retention-cleanup-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'spottr-retention-cleanup-daily'
);

SELECT cron.schedule(
  'spottr-retention-cleanup-daily',
  '30 3 * * *',  -- 03:30 UTC daily
  $job$
  SELECT net.http_post(
    url     := 'https://hamymmbirdyubsbdcbzw.functions.supabase.co/retention-cleanup',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'retention_cron_secret'
      )
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $job$
);
