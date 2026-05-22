-- Gym admin access control.
-- Links Supabase users to gyms they manage.
-- Gym admins can update their gym settings and approve Women's space verification requests.
CREATE TABLE IF NOT EXISTS public.gym_admins (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id  UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, gym_id)
);

ALTER TABLE public.gym_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gym_admins_own_select"
  ON public.gym_admins FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "gyms_admin_select"
  ON public.gyms FOR SELECT
  USING (
    id IN (SELECT gym_id FROM public.gym_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "gyms_admin_update"
  ON public.gyms FOR UPDATE
  USING (
    id IN (SELECT gym_id FROM public.gym_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    id IN (SELECT gym_id FROM public.gym_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "profiles_admin_select_pending"
  ON public.profiles FOR SELECT
  USING (
    verification_requested_at IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.gym_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "profiles_admin_update_verified"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.gym_admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.gym_admins WHERE user_id = auth.uid())
  );
