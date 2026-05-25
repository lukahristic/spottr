-- Retention cleanup: orphan-thread helper + daily pg_cron schedule
--
-- The retention-cleanup edge function deletes old checkins, old
-- reports, and orphan threads. The orphan-thread part needs a
-- correlated anti-join (find threads whose user_1 or user_2 has no
-- matching profiles row), which is awkward through PostgREST — so
-- we expose a small RPC.
--
-- pg_cron then triggers the edge function once a day at 03:30 UTC
-- (off-peak across our APAC user base).

-- ─── Helper RPC: delete_orphan_threads ──────────────────────────
-- Returns the number of rows deleted so the edge function can log it.

CREATE OR REPLACE FUNCTION public.delete_orphan_threads()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.threads t
    WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = t.user_1)
       OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = t.user_2)
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  RETURN deleted_count;
END;
$$;

-- Only the service role should call this. (RLS doesn't apply to
-- SECURITY DEFINER functions; we just want to keep the surface
-- area small.)
REVOKE ALL ON FUNCTION public.delete_orphan_threads() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_orphan_threads() TO service_role;

-- ─── Daily cron schedule ────────────────────────────────────────
-- Requires pg_cron and pg_net (both available on Supabase by
-- default; the project just needs them enabled in the dashboard
-- under Database → Extensions if they aren't already).

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net  WITH SCHEMA extensions;

-- The function URL and service role key are stored in Postgres
-- settings to avoid hard-coding secrets in the migration. Set them
-- before scheduling:
--   ALTER DATABASE postgres SET app.settings.functions_url
--     = 'https://<project>.functions.supabase.co';
--   ALTER DATABASE postgres SET app.settings.service_role_key
--     = '<service role key>';
-- (Replace <project> and the key with your actual values.)

-- Remove any prior schedule with the same name so re-running the
-- migration is idempotent.
SELECT cron.unschedule('spottr-retention-cleanup-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'spottr-retention-cleanup-daily'
);

SELECT cron.schedule(
  'spottr-retention-cleanup-daily',
  '30 3 * * *',  -- 03:30 UTC daily
  $job$
  SELECT net.http_post(
    url     := current_setting('app.settings.functions_url') || '/retention-cleanup',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $job$
);
