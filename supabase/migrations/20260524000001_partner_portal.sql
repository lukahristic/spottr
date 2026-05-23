-- Gym Partner Portal + HQ split
-- 1. Evolve gym_admins (surrogate PK, role, invited_by, created_at)
-- 2. Add partner-managed fields to gyms (address, logo_url, opening_hours)
-- 3. Tighten women's verification RLS to platform admins only
-- 4. Create gym-logos storage bucket + policies
-- 5. Add partner/HQ RPCs

-- 1. gym_admins evolution -----------------------------------------------------
ALTER TABLE public.gym_admins
  ADD COLUMN IF NOT EXISTS id          UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS role        TEXT NOT NULL DEFAULT 'owner'
             CHECK (role IN ('owner','manager')),
  ADD COLUMN IF NOT EXISTS invited_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'gym_admins_pkey' AND conrelid = 'public.gym_admins'::regclass
  ) THEN
    -- Only swap PK if it's still the original composite key
    IF (SELECT COUNT(*) FROM pg_attribute a
        JOIN pg_constraint c ON c.conrelid = a.attrelid AND a.attnum = ANY(c.conkey)
        WHERE c.conname = 'gym_admins_pkey'
          AND c.conrelid = 'public.gym_admins'::regclass) > 1 THEN
      ALTER TABLE public.gym_admins DROP CONSTRAINT gym_admins_pkey;
      ALTER TABLE public.gym_admins ADD  CONSTRAINT gym_admins_pkey PRIMARY KEY (id);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'gym_admins_user_gym_uniq' AND conrelid = 'public.gym_admins'::regclass
  ) THEN
    ALTER TABLE public.gym_admins
      ADD CONSTRAINT gym_admins_user_gym_uniq UNIQUE (user_id, gym_id);
  END IF;
END $$;

-- 2. gyms — partner-managed fields -------------------------------------------
ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS address       TEXT,
  ADD COLUMN IF NOT EXISTS logo_url      TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours JSONB;
-- gyms.is_active already exists; reused for partner enable/disable toggle.

-- 3. Tighten verification RLS — HQ-only ---------------------------------------
DROP POLICY IF EXISTS profiles_admin_select_pending ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_update_verified ON public.profiles;

CREATE POLICY profiles_platform_select_pending
  ON public.profiles FOR SELECT
  USING (verification_requested_at IS NOT NULL AND public.is_platform_admin());

CREATE POLICY profiles_platform_update_verified
  ON public.profiles FOR UPDATE
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- 4. Storage: gym-logos bucket + policies -------------------------------------
INSERT INTO storage.buckets (id, name, public)
  VALUES ('gym-logos', 'gym-logos', true)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "gym_logos_admin_write"  ON storage.objects;
DROP POLICY IF EXISTS "gym_logos_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "gym_logos_admin_delete" ON storage.objects;

CREATE POLICY "gym_logos_admin_write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gym-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT gym_id::text FROM public.gym_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "gym_logos_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'gym-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT gym_id::text FROM public.gym_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "gym_logos_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'gym-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT gym_id::text FROM public.gym_admins WHERE user_id = auth.uid()
    )
  );

-- 5. RPCs ---------------------------------------------------------------------

-- get_my_role: one round-trip lookup for the post-login router
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TABLE (
  gym_id            UUID,
  role              TEXT,
  is_platform_admin BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT ga.gym_id, ga.role, ga.is_platform_admin
  FROM public.gym_admins ga
  WHERE ga.user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- get_partner_overview: scoped to caller's gym, partner-friendly metric set
CREATE OR REPLACE FUNCTION public.get_partner_overview()
RETURNS TABLE (
  members_today              BIGINT,
  checkins_this_week         BIGINT,
  unique_members_all_time    BIGINT,
  intros_sent                BIGINT,
  conversations_unlocked     BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_gym_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT ga.gym_id INTO v_gym_id
  FROM public.gym_admins ga
  WHERE ga.user_id = auth.uid()
  LIMIT 1;

  IF v_gym_id IS NULL THEN
    RAISE EXCEPTION 'not a gym admin';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(DISTINCT c.user_id)::BIGINT
       FROM public.checkins c
       WHERE c.gym_id = v_gym_id
         AND c.checked_in_at::date = now()::date),
    (SELECT COUNT(*)::BIGINT
       FROM public.checkins c
       WHERE c.gym_id = v_gym_id
         AND c.checked_in_at >= (now() - interval '7 days')),
    (SELECT COUNT(DISTINCT c.user_id)::BIGINT
       FROM public.checkins c
       WHERE c.gym_id = v_gym_id),
    (SELECT COUNT(*)::BIGINT
       FROM public.threads t
       JOIN public.checkins c ON c.id = t.origin_checkin_id
       WHERE c.gym_id = v_gym_id),
    (SELECT COUNT(*)::BIGINT
       FROM public.threads t
       JOIN public.checkins c ON c.id = t.origin_checkin_id
       WHERE c.gym_id = v_gym_id AND t.unlocked_at IS NOT NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_partner_overview() TO authenticated;

-- get_partner_peak_hours: hour-of-day check-in distribution (caller's gym)
CREATE OR REPLACE FUNCTION public.get_partner_peak_hours(p_days INT DEFAULT 30)
RETURNS TABLE (
  hour     INT,
  checkins BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_gym_id UUID;
  v_days   INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT ga.gym_id INTO v_gym_id
  FROM public.gym_admins ga
  WHERE ga.user_id = auth.uid()
  LIMIT 1;

  IF v_gym_id IS NULL THEN
    RAISE EXCEPTION 'not a gym admin';
  END IF;

  v_days := GREATEST(LEAST(p_days, 90), 1);

  RETURN QUERY
  WITH hours AS (SELECT generate_series(0, 23) AS h)
  SELECT
    hours.h,
    COALESCE((
      SELECT COUNT(*)::BIGINT
      FROM public.checkins c
      WHERE c.gym_id = v_gym_id
        AND EXTRACT(HOUR FROM c.checked_in_at)::int = hours.h
        AND c.checked_in_at >= (now() - (v_days || ' days')::interval)
    ), 0)
  FROM hours
  ORDER BY hours.h;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_partner_peak_hours(INT) TO authenticated;

-- list_gym_admins: HQ-only partner directory
CREATE OR REPLACE FUNCTION public.list_gym_admins(p_gym_id UUID DEFAULT NULL)
RETURNS TABLE (
  admin_id    UUID,
  user_id     UUID,
  email       TEXT,
  gym_id      UUID,
  gym_name    TEXT,
  role        TEXT,
  created_at  TIMESTAMPTZ,
  invited_by  UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'platform admin required';
  END IF;

  RETURN QUERY
  SELECT
    ga.id,
    ga.user_id,
    u.email::TEXT,
    ga.gym_id,
    g.name,
    ga.role,
    ga.created_at,
    ga.invited_by
  FROM public.gym_admins ga
  JOIN auth.users u ON u.id = ga.user_id
  JOIN public.gyms g ON g.id = ga.gym_id
  WHERE p_gym_id IS NULL OR ga.gym_id = p_gym_id
  ORDER BY g.name, ga.created_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_gym_admins(UUID) TO authenticated;

-- add_gym_admin: HQ-only; assign a user to a gym with a role
CREATE OR REPLACE FUNCTION public.add_gym_admin(
  p_user_id UUID,
  p_gym_id  UUID,
  p_role    TEXT DEFAULT 'owner'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new_id UUID;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'platform admin required';
  END IF;

  IF p_role NOT IN ('owner','manager') THEN
    RAISE EXCEPTION 'invalid role';
  END IF;

  INSERT INTO public.gym_admins (user_id, gym_id, role, invited_by)
  VALUES (p_user_id, p_gym_id, p_role, auth.uid())
  ON CONFLICT (user_id, gym_id) DO UPDATE
    SET role = EXCLUDED.role
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_gym_admin(UUID, UUID, TEXT) TO authenticated;

-- remove_gym_admin: HQ-only; delete a partner assignment by row id
CREATE OR REPLACE FUNCTION public.remove_gym_admin(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'platform admin required';
  END IF;

  DELETE FROM public.gym_admins WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_gym_admin(UUID) TO authenticated;
