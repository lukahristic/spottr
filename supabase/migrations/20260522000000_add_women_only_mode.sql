-- Women-Only Mode
-- Adds verification tracking to profiles and a per-check-in Women's space toggle.
-- women_verified: flipped to true by admin (or future gym staff dashboard) after identity check
-- verification_requested_at: set by user when they tap "Request Women's space access"
-- women_only_mode: per-check-in toggle, only available to verified users
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS women_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_requested_at TIMESTAMPTZ DEFAULT null;

ALTER TABLE public.checkins
  ADD COLUMN IF NOT EXISTS women_only_mode BOOLEAN NOT NULL DEFAULT false;
