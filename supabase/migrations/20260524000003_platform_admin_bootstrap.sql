-- Platform admin bootstrap
-- 1. Make gym_id nullable (platform admins have no gym)
-- 2. Replace composite unique constraint with partial unique indexes
-- 3. Fix analytics RPCs that incorrectly reject NULL gym_id for platform admins
-- 4. Insert founder as platform admin

-- 1. Drop NOT NULL on gym_id
ALTER TABLE public.gym_admins ALTER COLUMN gym_id DROP NOT NULL;

-- 2. Replace composite unique constraint with partial unique indexes
ALTER TABLE public.gym_admins DROP CONSTRAINT IF EXISTS gym_admins_user_gym_uniq;

CREATE UNIQUE INDEX IF NOT EXISTS gym_admins_user_gym_idx
  ON public.gym_admins (user_id, gym_id) WHERE gym_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS gym_admins_platform_idx
  ON public.gym_admins (user_id) WHERE gym_id IS NULL;

-- 3a. Fix get_admin_overview — platform admins have NULL gym_id by design
CREATE OR REPLACE FUNCTION public.get_admin_overview(p_gym_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_users            BIGINT,
  verified_users         BIGINT,
  active_users_today     BIGINT,
  checkins_today         BIGINT,
  unique_checkins_today  BIGINT,
  intros_sent            BIGINT,
  conversations_unlocked BIGINT,
  reply_rate_pct         NUMERIC,
  reports_filed          BIGINT,
  blocks_created         BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_is_platform     BOOLEAN;
  v_admin_gym_id    UUID;
  v_effective_gym   UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT ga.is_platform_admin, ga.gym_id
    INTO v_is_platform, v_admin_gym_id
  FROM public.gym_admins ga
  WHERE ga.user_id = auth.uid()
  LIMIT 1;

  IF NOT v_is_platform AND v_admin_gym_id IS NULL THEN
    RAISE EXCEPTION 'not an admin';
  END IF;

  v_effective_gym := CASE WHEN v_is_platform THEN p_gym_id ELSE v_admin_gym_id END;

  RETURN QUERY
  WITH
    scoped_user_ids AS (
      SELECT DISTINCT c.user_id
      FROM public.checkins c
      WHERE v_effective_gym IS NULL OR c.gym_id = v_effective_gym
    ),
    scoped_users AS (
      SELECT p.id, p.women_verified
      FROM public.profiles p
      WHERE v_effective_gym IS NULL
         OR p.id IN (SELECT user_id FROM scoped_user_ids)
    ),
    scoped_checkins AS (
      SELECT *
      FROM public.checkins c
      WHERE v_effective_gym IS NULL OR c.gym_id = v_effective_gym
    ),
    scoped_threads AS (
      SELECT t.*
      FROM public.threads t
      LEFT JOIN public.checkins c ON c.id = t.origin_checkin_id
      WHERE v_effective_gym IS NULL OR c.gym_id = v_effective_gym
    ),
    scoped_reports AS (
      SELECT r.*
      FROM public.reports r
      LEFT JOIN public.checkins c ON c.id = r.checkin_id
      WHERE v_effective_gym IS NULL OR c.gym_id = v_effective_gym
    ),
    scoped_blocks AS (
      SELECT b.*
      FROM public.blocks b
      WHERE v_effective_gym IS NULL
         OR b.blocker_id IN (SELECT user_id FROM scoped_user_ids)
    ),
    intros_count AS (
      SELECT COUNT(*)::BIGINT AS n FROM scoped_threads
    ),
    unlocked_count AS (
      SELECT COUNT(*)::BIGINT AS n FROM scoped_threads WHERE unlocked_at IS NOT NULL
    )
  SELECT
    (SELECT COUNT(*)::BIGINT FROM scoped_users),
    (SELECT COUNT(*) FILTER (WHERE women_verified)::BIGINT FROM scoped_users),
    (SELECT COUNT(DISTINCT user_id)::BIGINT FROM scoped_checkins WHERE is_active = true),
    (SELECT COUNT(*)::BIGINT FROM scoped_checkins WHERE checked_in_at::date = now()::date),
    (SELECT COUNT(DISTINCT user_id)::BIGINT FROM scoped_checkins WHERE checked_in_at::date = now()::date),
    (SELECT n FROM intros_count),
    (SELECT n FROM unlocked_count),
    CASE WHEN (SELECT n FROM intros_count) > 0
         THEN ROUND((SELECT n FROM unlocked_count)::numeric * 100.0 / (SELECT n FROM intros_count)::numeric, 1)
         ELSE 0
    END,
    (SELECT COUNT(*)::BIGINT FROM scoped_reports),
    (SELECT COUNT(*)::BIGINT FROM scoped_blocks);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_overview(UUID) TO authenticated;

-- 3b. Fix get_admin_gym_activity
CREATE OR REPLACE FUNCTION public.get_admin_gym_activity()
RETURNS TABLE (
  gym_id                 UUID,
  gym_name               TEXT,
  checkins_today         BIGINT,
  total_checkins         BIGINT,
  unique_members         BIGINT,
  intros_sent            BIGINT,
  conversations_unlocked BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_is_platform   BOOLEAN;
  v_admin_gym_id  UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT ga.is_platform_admin, ga.gym_id
    INTO v_is_platform, v_admin_gym_id
  FROM public.gym_admins ga
  WHERE ga.user_id = auth.uid()
  LIMIT 1;

  IF NOT v_is_platform AND v_admin_gym_id IS NULL THEN
    RAISE EXCEPTION 'not an admin';
  END IF;

  RETURN QUERY
  SELECT
    g.id,
    g.name,
    (SELECT COUNT(*)::BIGINT FROM public.checkins c
       WHERE c.gym_id = g.id AND c.checked_in_at::date = now()::date),
    (SELECT COUNT(*)::BIGINT FROM public.checkins c WHERE c.gym_id = g.id),
    (SELECT COUNT(DISTINCT c.user_id)::BIGINT FROM public.checkins c WHERE c.gym_id = g.id),
    (SELECT COUNT(*)::BIGINT FROM public.threads t
       JOIN public.checkins c ON c.id = t.origin_checkin_id
       WHERE c.gym_id = g.id),
    (SELECT COUNT(*)::BIGINT FROM public.threads t
       JOIN public.checkins c ON c.id = t.origin_checkin_id
       WHERE c.gym_id = g.id AND t.unlocked_at IS NOT NULL)
  FROM public.gyms g
  WHERE v_is_platform OR g.id = v_admin_gym_id
  ORDER BY 3 DESC, g.name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_gym_activity() TO authenticated;

-- 3c. Fix get_admin_trends
CREATE OR REPLACE FUNCTION public.get_admin_trends(
  p_days   INT  DEFAULT 30,
  p_gym_id UUID DEFAULT NULL
)
RETURNS TABLE (
  day          DATE,
  checkins     BIGINT,
  intros       BIGINT,
  unlocked     BIGINT,
  active_users BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_is_platform   BOOLEAN;
  v_admin_gym_id  UUID;
  v_effective_gym UUID;
  v_days          INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT ga.is_platform_admin, ga.gym_id
    INTO v_is_platform, v_admin_gym_id
  FROM public.gym_admins ga
  WHERE ga.user_id = auth.uid()
  LIMIT 1;

  IF NOT v_is_platform AND v_admin_gym_id IS NULL THEN
    RAISE EXCEPTION 'not an admin';
  END IF;

  v_effective_gym := CASE WHEN v_is_platform THEN p_gym_id ELSE v_admin_gym_id END;
  v_days := GREATEST(LEAST(p_days, 90), 1);

  RETURN QUERY
  WITH days AS (
    SELECT generate_series(
      (now()::date - (v_days - 1)),
      now()::date,
      '1 day'::interval
    )::date AS d
  )
  SELECT
    days.d,
    (SELECT COUNT(*)::BIGINT FROM public.checkins c
       WHERE c.checked_in_at::date = days.d
         AND (v_effective_gym IS NULL OR c.gym_id = v_effective_gym)),
    (SELECT COUNT(*)::BIGINT FROM public.threads t
       LEFT JOIN public.checkins c ON c.id = t.origin_checkin_id
       WHERE t.created_at::date = days.d
         AND (v_effective_gym IS NULL OR c.gym_id = v_effective_gym)),
    (SELECT COUNT(*)::BIGINT FROM public.threads t
       LEFT JOIN public.checkins c ON c.id = t.origin_checkin_id
       WHERE t.unlocked_at::date = days.d
         AND (v_effective_gym IS NULL OR c.gym_id = v_effective_gym)),
    (SELECT COUNT(DISTINCT c.user_id)::BIGINT FROM public.checkins c
       WHERE c.checked_in_at::date = days.d
         AND (v_effective_gym IS NULL OR c.gym_id = v_effective_gym))
  FROM days
  ORDER BY days.d;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_trends(INT, UUID) TO authenticated;

-- 4. Insert founder as platform admin
INSERT INTO public.gym_admins (user_id, is_platform_admin, role)
SELECT id, true, 'owner'
FROM auth.users
WHERE email = 'wency19valentin@gmail.com'
ON CONFLICT DO NOTHING;
