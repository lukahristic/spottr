-- Gym Partner Terms acceptance tracking
--
-- Records which version of the Gym Partner Terms each gym_admin
-- has accepted, and when. The partner layout redirects to the
-- acceptance interstitial whenever partner_terms_accepted_at is NULL
-- for the current admin.
--
-- Version string is free-form (e.g. "2026-05-26") so the value
-- accepted by each admin is auditable even after the public terms
-- change.

ALTER TABLE public.gym_admins
  ADD COLUMN IF NOT EXISTS partner_terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS partner_terms_accepted_version TEXT;
