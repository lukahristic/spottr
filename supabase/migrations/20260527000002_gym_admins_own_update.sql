-- Allow gym admins to update their own row in gym_admins.
--
-- Required for the partner terms acceptance flow: the
-- acceptPartnerTerms server action stamps partner_terms_accepted_at
-- and partner_terms_accepted_version on the calling user's row.
-- Without this policy that UPDATE silently matched 0 rows (RLS
-- blocks unknown updates without raising an error), causing an
-- infinite redirect loop between /accept-terms and /partner.

CREATE POLICY "gym_admins_own_update"
  ON public.gym_admins FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
