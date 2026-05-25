-- 18+ age gate and legal acceptance tracking
--
-- Adds date_of_birth so we can enforce a hard 18+ floor at signup,
-- and three timestamp columns to record which legal documents the
-- user accepted (and when).
--
-- date_of_birth is nullable to allow pre-migration profiles to
-- continue functioning; a re-acceptance prompt at next login will
-- backfill it. The CHECK constraint only fires when the value is
-- non-null, so existing rows aren't invalidated.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS community_guidelines_accepted_at TIMESTAMPTZ;

-- Hard 18+ floor. NULL is allowed so pre-migration rows survive,
-- but any non-null DOB must be at least 18 years in the past.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_must_be_adult;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_must_be_adult
  CHECK (date_of_birth IS NULL OR date_of_birth <= (CURRENT_DATE - INTERVAL '18 years'));
