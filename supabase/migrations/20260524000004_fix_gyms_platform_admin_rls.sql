-- Fix gyms RLS for platform admins
-- 1. Replace gyms_admin_select to also allow platform admins to see all gyms
-- 2. Add INSERT policy so platform admins can create gyms

DROP POLICY IF EXISTS "gyms_admin_select" ON public.gyms;

CREATE POLICY "gyms_select"
  ON public.gyms FOR SELECT
  USING (
    public.is_platform_admin()
    OR id IN (SELECT gym_id FROM public.gym_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "gyms_platform_insert"
  ON public.gyms FOR INSERT
  WITH CHECK (public.is_platform_admin());
