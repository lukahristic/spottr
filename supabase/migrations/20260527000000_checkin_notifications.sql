-- ============================================================================
-- Check-in push notifications (roadmap item 1.4)
--
-- When someone checks in at a gym, we notify other members who have that gym
-- in their user_gyms list. This is the core retention mechanism: it pulls
-- users back into the app when there's actually something to see.
--
-- Throttle: at most one notification per (user, gym) pair per 90 minutes.
-- Exclusions: skip the checker themselves, skip anyone with notify_gym_activity
-- off, skip anyone currently checked in at the same gym (they're already there),
-- skip anyone without a push token.
--
-- Quiet hours: NOT implemented in v1. Would require per-gym timezone column.
-- Documented as a follow-up in docs/internal/ROADMAP.md. The 90-minute throttle
-- is the primary spam control.
-- ============================================================================

-- 1) User preference: opt-in to gym activity notifications.
--    Default TRUE so the feature works for existing users without action.
--    Users can disable in app/edit-profile.tsx.
alter table public.profiles
  add column if not exists notify_gym_activity boolean not null default true;

comment on column public.profiles.notify_gym_activity is
  'When true, user receives push notifications for check-ins at gyms in their user_gyms list. Throttled and de-duplicated server-side.';

-- 2) Throttle table: one row per (user, gym) recording the last time we
--    notified them. Updated on every send via UPSERT. Lets us answer
--    "did I notify this user about this gym in the past 90 min?" in O(1).
create table if not exists public.checkin_notifications (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  gym_id       uuid        not null references public.gyms(id) on delete cascade,
  last_sent_at timestamptz not null default now(),
  primary key (user_id, gym_id)
);

comment on table public.checkin_notifications is
  'Throttle log for check-in push notifications. One row per (user, gym). Updated on each send. The edge function checks last_sent_at < now() - 90 minutes before sending.';

-- RLS: nobody touches this table from the client. Only the service role
-- (edge function) writes/reads. Enable RLS with no policies = locked down.
alter table public.checkin_notifications enable row level security;

-- 3) Trigger function: fires on INSERT to checkins. POSTs the new row to
--    the notify-checkin edge function via pg_net. Same shape as the
--    existing notify_new_message_trigger (see 20260522000001).
create or replace function public.notify_checkin_trigger()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Only fire for active check-ins; the auto-checkout path also writes to
  -- this table and we don't want to notify on those.
  if NEW.is_active is not true then
    return NEW;
  end if;

  perform net.http_post(
    url := 'https://hamymmbirdyubsbdcbzw.supabase.co/functions/v1/notify-checkin',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhbXltbWJpcmR5dWJzYmRjYnp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5OTQ1OTgsImV4cCI6MjA5NDU3MDU5OH0.dZ0N4P79jCy12Plllnpsl6HUMUgxPPa0uxxPubslxgs'
    ),
    body := jsonb_build_object('record', row_to_json(NEW)::jsonb)
  );
  return NEW;
end;
$$;

-- 4) Bind the trigger to checkins. Fires after every INSERT.
--    (UPDATE is ignored — we only want to notify on new check-ins, not
--    when someone tweaks their vibe.)
drop trigger if exists on_checkin_insert_notify on public.checkins;

create trigger on_checkin_insert_notify
after insert on public.checkins
for each row execute function public.notify_checkin_trigger();
