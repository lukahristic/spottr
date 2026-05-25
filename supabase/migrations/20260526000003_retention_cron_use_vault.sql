-- Switch retention cron from app.settings.* to Supabase Vault
--
-- Supabase no longer lets users ALTER DATABASE ... SET app.settings.*
-- (the SQL editor returns permission denied even for the postgres
-- role). The modern pattern is:
--
--   - hard-code the functions URL into the cron body (it's public)
--   - store the service role key in Supabase Vault
--   - read the key via vault.decrypted_secrets at cron-fire time
--
-- One-time setup required after this migration: create the vault
-- secret named "service_role_key" via either the dashboard
-- (Project Settings → Vault) or this SQL editor snippet:
--
--   SELECT vault.create_secret(
--     '<your service role key>',
--     'service_role_key',
--     'Used by spottr-retention-cleanup-daily cron'
--   );

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
        WHERE name = 'service_role_key'
      )
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $job$
);
