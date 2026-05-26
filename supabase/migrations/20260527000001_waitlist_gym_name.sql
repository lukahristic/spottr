-- Waitlist signups get an optional "which gym?" field.
--
-- Why: turns the waitlist from a generic list into a geographic demand
-- signal. When 20 people from the same gym sign up, that's a sales
-- conversation with that gym's owner. The field is optional so users
-- without a gym in mind aren't blocked from signing up.
--
-- Roadmap item 2.3.

alter table public.waitlist
  add column if not exists gym_name text;

comment on column public.waitlist.gym_name is
  'Optional self-reported gym name from the marketing site waitlist form. Used to identify high-demand gyms for partnership outreach.';
