-- GPS-based gym check-in verification.
-- latitude/longitude: gym coordinates set by admin. NULL = skip location check (beta fallback).
-- checkin_radius_m: how close the user must be to check in (default 100m).
-- gym_code: optional manual fallback code for when GPS fails.
ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION DEFAULT null,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT null,
  ADD COLUMN IF NOT EXISTS checkin_radius_m INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS gym_code TEXT DEFAULT null;
