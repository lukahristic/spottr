-- user_gyms: tracks which gyms a user has added to their personal list
-- separate from checkins — adding a gym is a one-time registration, checking in is per-visit
CREATE TABLE IF NOT EXISTS public.user_gyms (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id              UUID        NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  added_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_checkin_at    TIMESTAMPTZ,
  last_checkin_at     TIMESTAMPTZ,
  visit_count         INT         NOT NULL DEFAULT 0,
  visible_on_profile  BOOLEAN     NOT NULL DEFAULT true,
  UNIQUE(user_id, gym_id)
);

ALTER TABLE public.user_gyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_gyms_select" ON public.user_gyms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_gyms_insert" ON public.user_gyms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_gyms_update" ON public.user_gyms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_gyms_delete" ON public.user_gyms
  FOR DELETE USING (auth.uid() = user_id);

-- Profile privacy settings
-- Controls what other users can see on a member's public card
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_gyms_visited        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_connections_started BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_current_gym         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_experience_level    BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_fitness_goal        BOOLEAN NOT NULL DEFAULT true;
