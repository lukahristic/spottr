# Spottr — Decision Log

**Purpose:** Long-term memory and architectural reasoning log for Spottr.  
**Maintained by:** Claude Code. Updated automatically as the project evolves.  
**Format:** Reverse-chronological. Most recent decisions at the top.  
**Read alongside:** `ROADMAP.md`, `spottr-current-state.md`, `CLAUDE.md`.

> This is not a changelog. Changelogs record what. This records *why* — so decisions don't get re-litigated, context doesn't get lost, and the reasoning is auditable.

---

## How to read this document

Each entry answers:
- **What changed** — the concrete change
- **Why** — the reasoning that justified it
- **Impacted areas** — files, systems, UX flows affected
- **Risks / tradeoffs** — what we accepted or deferred
- **Follow-up actions** — what still needs to happen
- **Status** — current state of the decision

---

---

# Real Profile Photos (Camera-Only Selfie)

## Date

2026-05-27

## Decision

Added real photo support to profiles via a camera-only selfie flow. No gallery picker. Users tap a CTA in edit-profile or profile tab, get a full-screen `expo-camera` UI (front/back flip, capture, retake), and the photo uploads to a `profile-photos` Supabase Storage bucket.

The implementation was initially deferred due to EAS build limits (believed to require `expo-image-picker`, a new native dep). The block was resolved when it was confirmed that `expo-camera` was already installed — reframed the flow as selfie-only, avoiding a rebuild entirely.

`Avatar.tsx` extended with a three-tier fallback: real photo → DiceBear generated → initials. All five avatar surfaces updated (edit-profile, profile tab, live tab, member detail, messages inbox). Privacy policy on the marketing website updated with photo collection and retention sections.

## Why

Generated cartoon avatars undermine trust at the moment that matters most — when a user is deciding whether to send an intro to a stranger. Real faces are the single highest-leverage trust signal the app can add before beta. The deferred route (expo-image-picker + gallery access) was blocked by build constraints; the camera-only path solved the problem and aligned better with the product's "presence" model. Gallery photos are historical; selfies are now.

## Impacted Areas

- `supabase/migrations/*` — `photo_url`, `photo_uploaded_at` columns on `profiles`; `profile-photos` bucket with RLS (owner can INSERT/UPDATE/DELETE own path, public reads via URL)
- `lib/photo.ts` — fetch→blob→upload→profile update helper with cache-busting `?v=<timestamp>`
- `app/take-photo.tsx` — full-screen camera UI (new screen)
- `components/Avatar.tsx` — `photoUrl` prop + three-tier fallback
- `app/(tabs)/profile.tsx` — photo-first CTA, nudge banner when photo missing
- `app/edit-profile.tsx` — photo CTA above avatar picker
- `app/(tabs)/live.tsx` — photo rendered in member cards
- `app/member/[checkinId].tsx` — photo rendered in member detail
- `app/(tabs)/messages.tsx` — photo rendered in inbox
- `website/app/privacy/page.tsx` — photo collection + retention disclosure added

## Risks / Tradeoffs

- **No moderation of photo content at upload time.** No automated detection. Relies on report-and-act moderation. At beta scale (30 users), manual review is feasible. At 500+ users, this is a gap. Flagged in verification-scaling-plan.md.
- **Selfie-only is a UX constraint.** Users can't upload a favourite photo. This is intentional brand alignment (presence = now), but will generate feedback in beta. Accept it.
- **RLS policy on public reads.** Photos are readable by anyone with the URL. Same-gym scoping is enforced at the query layer (live tab, member cards), not the storage layer. If someone guesses a photo URL, they can see it. This is a known tradeoff consistent with how most consumer apps work.

## Follow-up Actions

- [ ] Monitor beta feedback on selfie-only constraint — reconsider gallery access post-freeze if >30% of users ask for it
- [ ] Add photo content moderation to the verification-scaling-plan.md Tier 2 section
- [ ] Consider adding a photo nudge in the push notification copy once per user (one-time, not recurring)

## Status

Completed (2026-05-27)

---

---

# Waitlist Gym Name Field

## Date

2026-05-27

## Decision

Added an optional `gym_name` text field to the waitlist signup form on the marketing site (Hero and FooterCTA sections). Column added to the Supabase `waitlist` table. Field is not required — no friction added. Visible prompt: "Which gym do you train at?"

## Why

A waitlist without geographic context is a list. A waitlist with gym data is a business case. When 20 people from the same gym sign up, there's a concrete, credible number to show a gym owner: "14 of your members want this app." Without this field, the waitlist proves general demand but can't drive specific gym partnership conversations.

## Impacted Areas

- `website/components/sections/Hero.tsx` — optional gym_name input added
- `website/components/sections/FooterCTA.tsx` — same
- Supabase `waitlist` table — `gym_name` column added via migration

## Risks / Tradeoffs

- **Data quality will be low.** Free-text gym name means "Anytime Fitness," "anytime fitness bgc," and "AF BGC" are all different rows. Requires manual normalization before the data is actionable. That's fine at 100 signups. Set a reminder to normalize at 200+.
- **No mandatory field = no reliable signal.** Some percentage of signups won't fill it in. This is accepted in exchange for lower friction.

## Follow-up Actions

- [ ] Normalize gym_name entries manually at 200+ waitlist signups
- [ ] Build a simple admin view showing gym_name frequency when signups reach 100

## Status

Completed (2026-05-27)

---

---

# Feature Freeze Instituted

## Date

2026-05-27

## Decision

A formal feature freeze was written into `CLAUDE.md` as an enforceable project rule. No new product features until beta closes (≥30 active users at the seed gym for ≥2 consecutive weeks, or an explicit founder decision in `PROJECT_STATE.md`).

Allowed under the freeze: bug fixes, copy changes, visual polish on existing flows, explicit roadmap items 1.x–2.x, marketing site changes, analytics/telemetry, removals and simplifications.

Prohibited: new features, new screens, new database tables (except roadmap-required), new libraries, premium/monetization scaffolding, refactors not fixing a known bug.

## Why

The codebase audit revealed a fully engineered product — two-tier admin system, partner portal, women's verification flow, peak-hours analytics, real-time messaging, push notification infrastructure, RLS across 10+ tables — with zero validated users. This is a builder-comfort pattern: engineering became the safe place to spend energy instead of standing in a gym talking to strangers. The freeze is a forcing function. Every hour spent building after the product is functionally complete is an hour not spent validating whether anyone wants it.

The discipline is the point. The freeze isn't about specific features — it's about reorienting energy from building to validating.

## Impacted Areas

- `CLAUDE.md` — freeze rules written as enforceable constraint for Claude Code
- All engineering work from 2026-05-27 forward — filtered through freeze rules before starting
- `docs/internal/ROADMAP.md` — created simultaneously; freeze is the operational context for the roadmap

## Risks / Tradeoffs

- **Founder will feel constrained.** The freeze surfaces the instinct to keep building. That's intentional. The constraint is the intervention.
- **Legitimate urgent fixes may be slowed by ambiguity.** The "if in doubt, no" default addresses this. If it's clearly a bug fix, it's allowed. If there's any doubt, surface it first.

## Follow-up Actions

- [ ] Seed gym identified and committed to (roadmap 1.8 — founder action)
- [ ] 90 days post-beta-open: audit whether zero new feature PRs held true
- [ ] Review freeze criteria when approaching 30 active users at seed gym

## Status

In Progress (freeze active as of 2026-05-27)

---

---

# Push Notifications for Check-In Activity

## Date

2026-05-27

## Decision

Shipped end-to-end push notification infrastructure for gym check-in activity. When a check-in is created, an edge function (`notify-checkin`) queries which users have that gym in `user_gyms`, haven't checked in there in the past 4 hours, have notifications enabled, and haven't been notified from this gym in the last 90 minutes. Sends a notification: "Activity at [Gym Name]" + "Someone just checked in. Open Spottr to see who's around."

Client-side: notification preference toggle added to `app/edit-profile.tsx` under a new "Notifications" section. Migration applied: `receive_checkin_notifications` column on `profiles` (default true), `checkin_notifications` throttle table.

No quiet hours in v1 — deferred until per-gym timezone data exists.

## Why

Without ambient pull, the app only opens when users are already at the gym thinking about it — a tiny, unpredictable window. The notification changes the trigger: users open the app when there's actually something to see, not when they happen to remember it exists. This is the core retention loop. Every product this relies on passive re-engagement from users fails at this stage.

## Impacted Areas

- `supabase/migrations/*` — `receive_checkin_notifications` on `profiles`, `checkin_notifications` throttle table, trigger function + trigger binding
- `supabase/functions/notify-checkin/index.ts` — edge function (ACTIVE, version 1, `verify_jwt: false`)
- `app/edit-profile.tsx` — "Notifications" preference section
- Existing push token infrastructure (already in place)

## Risks / Tradeoffs

- **No quiet hours.** Notifications may fire at 2am. Acceptable for a 30-person beta; must be addressed before broader launch. Requires per-gym timezone data, which doesn't exist yet.
- **`verify_jwt: false` on edge function.** The function is called by a database trigger, not a user session — JWT verification would always fail in that context. Accepted tradeoff with the understanding that the function only reads from the DB (no user data mutations from the trigger path).
- **90-minute throttle is a guess.** May be too aggressive (user comes back after 2 hours, second wave of check-ins gets no notification) or too lenient (10-person gym generates rapid-fire notifications). Monitor in beta.

## Follow-up Actions

- [ ] Add quiet hours once per-gym timezone data exists
- [ ] Monitor open rate — target 25%+. Below 15% = notification is annoying, revise copy
- [ ] Reconsider throttle window after 2 weeks of beta data
- [ ] Upgrade notification copy to use names/counts when RLS permits: "3 people just checked in at Anytime BGC." (current: generic "someone")

## Status

Completed (2026-05-27)

---

---

# Operations Playbooks Created

## Date

2026-05-27

## Decision

Three internal operations documents created:

1. **`docs/internal/safety-response-templates.md`** — workflow for the `safety@spottr.app` inbox. Routing table, first-10-minutes checklist, account-action verification rules, response templates for: active safety, account deletion, GDPR data export, age disputes, compromised accounts. Tone rules and escalation triggers included.

2. **`docs/internal/verification-scaling-plan.md`** — three-tier path from manual approval (current state, fine under 500 requests) to photo+selfie+human review (Tier 2, ~10 requests/day trigger) to third-party identity verification via Veriff or Stripe Identity (Tier 3, 5,000+ users). Cost models, threshold triggers, appeal process design.

3. **`docs/internal/moderation-playbook.md` extended** with §9 (HQ vs Partner admin authority), §10 (implementation spec for `moderation_actions` table, to build post-freeze), §11 (common-scenarios field guide for 10 patterns with default actions).

## Why

The safety page and privacy policy make specific promises (48-hour response, data deletion, verification). Those promises must be operationally backed, not just documented in public-facing pages. Without response templates and workflows, the first real safety incident or deletion request will be handled inconsistently or not at all. These documents convert brand promises into executable procedures.

## Impacted Areas

- `docs/internal/safety-response-templates.md` (new)
- `docs/internal/verification-scaling-plan.md` (new)
- `docs/internal/moderation-playbook.md` (extended)

## Risks / Tradeoffs

- **Documents only work if they're used.** The value of an operations playbook is zero if no one has read it before the first incident. The founder should read all three before beta opens, not after.

## Follow-up Actions

- [ ] Founder reads all three docs before beta opens
- [ ] `safety@spottr.app` email alias set up and routed to a monitored inbox (roadmap 2.2 — operations, not code)
- [ ] Test-email the alias and verify <4 hour acknowledgement before beta
- [ ] Revisit moderation_actions table implementation when freeze lifts

## Status

Completed — docs (2026-05-27). Operations setup (safety email, monitoring) — In Progress.

---

---

# Personas Avatar Tier Removed

## Date

2026-05-27

## Decision

The "Personas" premium avatar tier was removed from the avatar picker in `app/edit-profile.tsx`. Premium gating logic, lock panel UI, and orphan styles removed. `AvatarStyle = 'personas'` kept in the TypeScript type for backwards compatibility — users who previously selected Personas continue to render, but cannot re-select it.

## Why

The Personas tier existed as a premium avatar option that was never gated, never monetized, and never differentiated. It added UI complexity (a premium lock panel) to a flow that should be simple. Removing it simplifies the profile editing experience and signals that Spottr isn't building monetization scaffolding — the product is focused on the core loop. The backwards-compat type preservation prevents any existing users' avatars from breaking.

## Impacted Areas

- `app/edit-profile.tsx` — premium tier UI removed

## Risks / Tradeoffs

- **Existing Personas users.** Handled via backwards-compat type preservation. Low risk.
- **Removes a monetization hook.** Intentional — no monetization scaffolding during freeze.

## Follow-up Actions

- [ ] When freeze lifts and monetization is in scope, decide whether to revisit a premium avatar tier or drop it permanently

## Status

Completed (2026-05-27)

---

---

# Roadmap 1.x Polish Sprint

## Date

2026-05-27

## Decision

Four roadmap items shipped in a single sprint:

**1.2 — Empty state as invite mechanic:** When zero other members are checked in, `app/(tabs)/live.tsx` now shows "You're the only one here right now." with an "Invite to [Gym Name]" button that opens the native share sheet with `spottr://gym/[slug]`. Backed by `lib/sharing.ts`.

**1.5 — Early-days onboarding screen:** New screen `app/(onboarding)/early-days.tsx` inserted between How-it-works and Ready. Title: "You're early — that's good." Sets expectation that first check-ins may be quiet; the move is to invite one person from the gym. Non-skippable.

**1.6 — Remove "connections started" from member cards:** Stat removed from `app/member/[checkinId].tsx` entirely. State, query, and privacy field cleaned up. Underlying DB column kept for own-profile display.

**1.7 — Open to chat reset caption:** Under the "Open to chat" toggle on both the check-in screen (`app/(tabs)/index.tsx`) and the in-session edit modal (`app/(tabs)/live.tsx`): permanent caption text "Resets every visit. Always your choice."

## Why

**1.2:** First impression drop-off. A user who opens Spottr and sees an empty list with no next action decides the app is dead and never returns. Turning the empty state into an invite converts the worst-case scenario (no one here) into a growth action.

**1.5:** Empty lists read as "broken app" to users who don't know they're early adopters. Setting the expectation upfront ("Spottr is new at your gym; the first few times may be quiet") reframes the experience. Exit interviews at failed consumer apps consistently show "I thought it was broken" as a top reason for non-return.

**1.6:** A high "connections started" number on another user's profile reads as "this person messages a lot of people" — exactly the mental model Spottr is designed to avoid. The whole "we're not a dating app" positioning is undermined the moment a user sees "connections started: 47" on someone's card.

**1.7:** Users who don't know openness resets experience it as the app randomly resetting their preference. Even a brief explanation removes this confusion and surfaces the intentional consent design.

## Impacted Areas

- `app/(tabs)/live.tsx` — empty state invite mechanic (1.2); in-session edit modal caption (1.7)
- `lib/sharing.ts` — new sharing helper (1.2)
- `app/(onboarding)/early-days.tsx` — new screen (1.5)
- `app/(onboarding)/_layout.tsx` — route order updated (1.5)
- `app/member/[checkinId].tsx` — connections stat removed (1.6)
- `app/(tabs)/index.tsx` — open to chat caption (1.7)

## Risks / Tradeoffs

- **Non-skippable onboarding screen** (1.5) adds a tap to onboarding. The tradeoff: one extra tap beats 50% non-return in week 2 because users thought the app was broken. Acceptable.
- **Connections stat deletion** (1.6) removes visibility that some users may have found useful. Kept on own-profile only — users can still see their own count.

## Follow-up Actions

- [ ] Monitor invite button tap rate on empty state (target 30%+)
- [ ] Monitor if any beta user reports missing the connections stat from other profiles

## Status

Completed (2026-05-27)

---

---

# Age Gate Raised to 18+

## Date

2026-05-27

## Decision

Minimum age raised from 13+ to 18+. Applied to:
- Terms of Service (legal language updated)
- Signup flow (date of birth required, age gate enforced in the app)
- `profiles` table (`date_of_birth` column added)

## Why

Spottr is a real-world social product where people meet in person inside gyms. Minors are a fundamentally different risk class for in-person meet scenarios — different legal obligations (COPPA, GDPR-K), different parental consent requirements, and different moderation surface area. The 13+ age was a developer-default, not a considered product decision. For a product whose core interaction is "meet someone at a gym," 18+ is the appropriate bar without ambiguity.

## Impacted Areas

- `app/(auth)/sign-up.tsx` — date of birth input, age gate enforcement
- `supabase/migrations/*` — `date_of_birth` column on `profiles`
- `website/app/terms/page.tsx` — ToS language updated
- Marketing site footer/links

## Risks / Tradeoffs

- **Reduces total addressable market.** Anyone under 18 is excluded. This is a deliberate and accepted constraint.
- **Date of birth is self-reported.** Spottr cannot verify age at signup. Age gate enforces the contractual obligation but not physical truth. Acceptable at MVP scale.

## Follow-up Actions

- [ ] Revisit age verification rigor if the product scales to jurisdictions with stricter requirements (EU Digital Services Act, UK Children's Code)

## Status

Completed (2026-05-27)

---

---

# Safety Infrastructure Hardening

## Date

2026-05-27

## Decision

Three safety-related changes shipped together:

1. **Safety contact split:** `safety@spottr.app` created as a dedicated alias, separate from `hello@spottr.app`. Surfaced in app profile settings (About section) and on the marketing safety page.

2. **Privacy policy updated:** Added retention periods, confirmed GPS data is not stored (point-in-time check only), disclosed push token handling, clarified data categories.

3. **Community Guidelines page added** (`/community`) linked from both mobile app footer and marketing site footer.

## Why

The privacy policy and safety page are brand trust signals, not just legal boilerplate. Sophisticated early users (and the press, if Spottr gets any) read these pages. Vague policies read as red flags. Specific disclosures — "GPS is used once to verify you're within 500m of a gym, then discarded; it is never stored" — are more reassuring than "we take your privacy seriously." Most early-stage apps don't get this level of specificity. It's an asymmetric trust advantage.

Separating safety contact from general contact ensures triage doesn't get lost in noise.

## Impacted Areas

- `website/app/safety/page.tsx` — safety email surfaced
- `website/app/privacy/page.tsx` — retention periods, GPS disclosure, push token
- `website/app/community/page.tsx` — new page
- `app/(tabs)/profile.tsx` — About section with `safety@spottr.app` link
- Email routing (operations, not code)

## Risks / Tradeoffs

- **`safety@spottr.app` is only as good as its monitoring.** If the alias exists but isn't checked daily, the 48-hour promise is broken. This is an operational risk, not a code risk.

## Follow-up Actions

- [ ] Set up `safety@spottr.app` alias and route to a push-notified inbox
- [ ] Test it before beta: send a test email, verify receipt within 4 hours

## Status

Completed — code side (2026-05-27). Operations (inbox monitoring setup) — In Progress.

---

---

# Legal Acceptance Gate on Signup

## Date

2026-05-27

## Decision

Added explicit legal acceptance to the signup flow: users must check a box confirming they have read and accept the Terms of Service and Privacy Policy. Acceptance is recorded with a timestamp in `profiles.legal_accepted_at`. The app enforces this — users cannot complete signup without accepting.

Also: partner dashboard gated on Gym Partner Terms acceptance. Partners see an acceptance screen before accessing their dashboard; acceptance recorded in `gym_admins.terms_accepted_at`.

## Why

Clickwrap agreements (checkboxes with links) are legally enforceable in most jurisdictions when properly implemented. A product that claims safety commitments and makes privacy promises needs the corresponding legal acceptance trail. This also forces users to acknowledge the Terms once, removing the "I didn't know" defense for Terms violations.

Partner terms acceptance specifically: gym partners have additional obligations (maintaining the gym's code of conduct, responding to partner-level reports). They need to explicitly accept these, not just the user terms.

## Impacted Areas

- `app/(auth)/sign-up.tsx` — legal acceptance checkbox
- `supabase/migrations/*` — `legal_accepted_at`, `terms_accepted_at` on `profiles` and `gym_admins`
- `admin/app/partner/*` — partner terms gate

## Risks / Tradeoffs

- Timestamp is stored but not cryptographically signed. Sufficient for most legal purposes at this scale.

## Follow-up Actions

- [ ] Ensure any future Terms update triggers re-acceptance for existing users (implementation TBD post-freeze)

## Status

Completed (2026-05-27)

---

---

# Marketing Website Built and Deployed

## Date

2026-05-27 (circa; exact date uncertain from git)

## Decision

Built a marketing website (`website/`) as a separate Next.js 16 project within the monorepo. Deployed to Vercel. Initial routes: `/`, `/gyms`, `/safety`, `/privacy`, `/terms`. Later additions: `/community`.

Waitlist wired to Supabase `waitlist` table (anon insert, RLS restricted — no reads from the client side). Footer, header, and internal links consistent across all pages.

Tech choices: Next.js 16 + Tailwind v4 + Framer Motion + GSAP. Palette: cream / gold / ink. Typography: Fraunces serif + Inter sans-serif.

## Why

A marketing site is the minimum viable distribution surface. Users who hear about Spottr via word-of-mouth or social need somewhere to land that explains the product and captures their intent. The site also establishes the brand visually — the cream/gold/ink palette is a deliberate contrast to the fitness-app visual clichés (dark/neon, aggressive). The product is about feeling at ease, and the site should feel like that.

Fraunces + Inter: Fraunces is expressive and warm for headlines; Inter is neutral and readable for body. The combination avoids both corporate coldness and artsy impracticality.

GSAP + Framer Motion is heavier than most landing pages need, but the animations are tasteful (scroll reveals, gentle motion) — they contribute to the "intentional, premium" feel without being distracting.

## Impacted Areas

- `website/` — entire Next.js project
- Vercel project (auto-deploy on main branch push)
- Supabase `waitlist` table

## Risks / Tradeoffs

- **Animation library weight.** GSAP + Framer Motion is meaningful JS payload. Acceptable for a marketing site where performance is secondary to impression; would not be acceptable in the mobile app.
- **Next.js 16 + Tailwind v4.** Both are recent enough that some documentation gaps exist. Accepted in exchange for the more modern tooling.

## Follow-up Actions

- [ ] Founder story page (`/about`) — not yet written (roadmap 2.4, required before public launch)
- [ ] Real gym photos for the marketing site (roadmap 2.6)
- [ ] App Store / Play Store screenshots locked (roadmap 2.5)

## Status

Core site Completed. Content gaps (founder story, real photos) — In Progress.

---

---

# Two-Tier Admin Architecture (HQ + Partner)

## Date

Pre-2026-05-27 (established during early build phase)

## Decision

Split the admin surface into two distinct portals:
- **HQ portal** (`admin/app/hq/`) — platform administrators. Full read/write across all gyms, users, reports, verifications. Bootstrap via a seed admin account.
- **Partner portal** (`admin/app/partner/`) — gym owners/managers. Read/write scoped to their gym only, enforced at the RLS layer.

HQ can create gyms and invite partners by email. Partners receive a Supabase invite link, click it, and land on their dashboard directly (no mobile signup required).

## Why

Platform-level moderation and gym-level management are different authority domains. A gym owner should not see reports or users from other gyms; a platform admin needs cross-gym visibility. Mixing these into a single admin creates either under-scoped platform admins (can't see everything) or over-scoped gym partners (can see too much). RLS enforcement means the separation is structural, not just a UI convention — it can't be accidentally bypassed.

## Impacted Areas

- `admin/app/hq/` — HQ portal routes
- `admin/app/partner/` — partner portal routes
- Supabase RLS policies — `gym_admins` table, `reports`, `profiles`, etc.
- `supabase/migrations/*` — `gym_admins` table with role column

## Risks / Tradeoffs

- **Complexity for a 0-user product.** Two admin portals is over-engineered for the current stage. Acknowledged. The architecture is sound and won't need to change; the cost is build time already spent.
- **HQ bootstrap requires a seed admin account.** Manual step; documented in the admin setup flow.

## Follow-up Actions

- [ ] Partner portal peak-hours chart removed (roadmap 7.2 — cuts list)
- [ ] QR poster generator removed from partner portal (roadmap 7.3)
- [ ] Moderation actions (currently read-only) built out post-freeze when report volume exists (roadmap 5.3)

## Status

Completed (architecture). Simplification items — Planned (post-freeze approval).

---

---

# GPS-Based Check-In (Not QR)

## Date

Pre-2026-05-27 (established during GPS feature build)

## Decision

Check-in uses GPS proximity verification: the user must be within ~500m of the gym's coordinates. Location is used once, point-in-time, then discarded — not stored, not tracked continuously.

QR codes are retained but only for adding a gym to a user's personal gym list (`user_gyms`), not for check-in itself.

## Why

QR check-in requires finding the physical QR code (which assumes the gym has one, that it's accessible, and that the user knows where to look). GPS check-in works anywhere the user is physically present, without friction. The distinction also matters for the product's "presence" model: a GPS check-in means the person is actually there, not that they scanned a sticker near the entrance on their way out.

Separating "add gym" (QR) from "check in" (GPS) also mirrors real-world gym membership: you register at a gym once, then check in each visit. These are different actions with different meanings.

## Impacted Areas

- `app/(tabs)/index.tsx` — check-in flow (GPS)
- `app/gym/[slug].tsx` — QR scan destination (adds to user_gyms, redirects to tabs)
- `lib/location.ts` — GPS proximity check logic
- Supabase `user_gyms` table (membership) vs `checkins` table (active presence)

## Risks / Tradeoffs

- **Location permission required.** Users who deny location permission cannot check in. The app has a first-time permission primer and a "location denied" state. Acceptable UX cost — the product only works if users are physically present.
- **GPS spoofing.** A motivated user can fake GPS coordinates. Not a primary threat model at beta scale. Can be addressed with server-side validation or behavioral signals if abuse emerges.
- **500m radius may be too large or too small.** In dense urban areas, 500m can include multiple gyms. Configurable per gym if needed. Monitor in beta.

## Follow-up Actions

- [ ] Resolve dual check-in method ambiguity (roadmap 7.4 — GPS-only vs gym-code fallback, founder decision)
- [ ] Consider server-side GPS validation if spoofing emerges

## Status

Completed. Roadmap 7.4 (dual-method cleanup) — Pending founder decision.

---

---

# Women's Verification Feature

## Date

Pre-2026-05-27

## Decision

Added a real, manually-approved women's verification flow. Users can apply for verified status. HQ reviews applications (photo + self-reported info). Approved users get a verified indicator on their profile and access to women's-only spaces within gyms (if the gym has created one).

Verification is manual — no automation. Current capacity: ~500 requests before the queue becomes unmanageable.

## Why

Women's safety is not a marketing line. A gym environment has specific safety dynamics (unwanted attention, harassment by male strangers) that disproportionately affect women. A verified women's space — where every member has been human-reviewed — is a meaningfully safer environment than a general space. The manual verification is the trust signal, not the algorithm.

The decision to build this as a real feature (vs. a placeholder or badge-only system) reflects the product principle: Safety over growth.

## Impacted Areas

- `app/(tabs)/profile.tsx` — verification status display
- `app/(auth)/women-verification.tsx` — application flow
- `admin/app/hq/verifications/` — HQ review queue
- Supabase `verifications` table + RLS

## Risks / Tradeoffs

- **Manual verification doesn't scale past ~500 users.** Documented scaling path: Tier 2 (photo + selfie comparison, semi-automated) at ~10 requests/day; Tier 3 (Veriff/Stripe Identity) at 5,000+ users. See `docs/internal/verification-scaling-plan.md`.
- **Photo + self-report is easily defeated.** Accepted. The verification is a social contract enforced by the community and moderation, not a biometric proof.
- **"Women's space" definition.** Currently binary (verified / not). Non-binary and trans-inclusive policy needs explicit documentation before broader launch.

## Follow-up Actions

- [ ] Document trans-inclusive and non-binary policy in `docs/internal/verification-scaling-plan.md`
- [ ] Build Tier 2 triggers before verification queue hits 10 requests/day

## Status

Completed (MVP implementation). Scaling plan documented. Policy documentation — Planned.

---

---

# DiceBear Avatars as Default Profile Representation

## Date

Pre-2026-05-27

## Decision

Replaced initials-based avatar fallback with DiceBear Thumbs avatars (generated via URL API using `avatar_seed`). Each user gets a deterministic cartoon avatar based on their seed string. Avatars are consistent across sessions and devices.

## Why

Initials avatars are generic and carry no identity signal. DiceBear Thumbs are playful, warm, and consistent with the product's tone — they make empty profiles feel less sterile than a grey circle with "WV." The URL API approach means no build dependency, no storage cost, and no image processing on the client.

The three-tier fallback (real photo → DiceBear generated → initials) was added later when real photos were introduced.

## Impacted Areas

- `components/Avatar.tsx`
- Profile screens wherever avatars are rendered

## Risks / Tradeoffs

- **DiceBear API dependency.** If the DiceBear CDN is unavailable, avatars fall back to initials. Acceptable for an MVP.
- **Real photos always take priority.** Once a user adds a real photo, the generated avatar is hidden. The generated avatar is a fallback, not a permanent identity.

## Follow-up Actions

- [ ] Consider caching generated avatars locally if CDN reliability becomes an issue

## Status

Completed. Superseded in priority by real photos (roadmap 1.3, shipped 2026-05-27).

---

---

# One Intro Message Rule (Consent-Enforced)

## Date

Pre-2026-05-27 (product decision; enforced at build time)

## Decision

A user can send exactly one intro message to another user. Only after the recipient replies does the conversation unlock into a full thread. This rule is enforced in the UI, not just the policy.

## Why

Persistent contact before consent is the definition of harassment. A rule that exists only in the Terms of Service is a rule that motivated bad actors ignore. Building the constraint into the product — you literally cannot send a second message until they reply — removes the failure mode. This is the most important single safety decision in Spottr's architecture.

The constraint also changes the social dynamic: an intro message carries weight because it's singular. It forces senders to be thoughtful rather than broadcast-messaging everyone on the live list.

## Impacted Areas

- `app/(tabs)/messages.tsx` — thread creation and message sending logic
- Supabase `threads` table — intro_sent, reply_received state columns
- RLS policies on `messages` table

## Risks / Tradeoffs

- **Users may find the rule restrictive.** Some beta users will want to send a follow-up if they don't hear back. This is intentional friction. "I didn't hear back, so I tried again" is exactly the pattern the rule is designed to prevent.
- **False positives.** A user might accidentally send an incomplete intro and be locked out. Accept — this creates a natural forcing function to write a good first message.

## Follow-up Actions

- [ ] Consider adding a "message pending" state indicator so senders know their intro was received (without read receipts by default)

## Status

Completed (enforced in product).

---

---

# Open to Chat Resets Every Check-In

## Date

Pre-2026-05-27 (product decision)

## Decision

The "Open to chat" toggle resets to OFF every time a user checks in. The previous session's preference is not carried over. Users must actively signal openness each visit.

## Why

Consent must be fresh per visit, not a stale default. A toggle that persists means users may be signalling openness without realizing it — they set it once during onboarding enthusiasm and forget it exists. If openness is persistent, it's no longer a meaningful signal; it becomes a profile flag, not a live intent. The daily reset is the product's most direct implementation of the consent-first principle.

The caption "Resets every visit. Always your choice." (added roadmap 1.7) makes the intent explicit so users don't experience the reset as a bug.

## Impacted Areas

- `app/(tabs)/index.tsx` — check-in flow
- Supabase `checkins` table — `open_to_chat` column defaults to false

## Risks / Tradeoffs

- **Friction for power users.** Users who are always open to chat will have to tap the toggle every visit. This is intentional — the friction is the point. An "always on" option would undermine the consent model.

## Follow-up Actions

None — this is a foundational product decision, not a feature to iterate on.

## Status

Completed. Caption clarification (roadmap 1.7) completed 2026-05-27.

---

---

# Voice Calibration: Warm but Not Soft

## Date

2026-05-27

## Decision

Added `spottr-voice.md` as a calibration layer on top of `spottr-copy.md`. The existing copy guide defined warmth correctly but let it drift too far toward soft, precious, or therapeutic territory. The calibration adds "quiet confidence" as the corrective — specific beats poetic, apologetic copy gets rewritten, anything that reads like a meditation app gets cut.

Key changes:
- "Intro sent. They'll see it." → "Intro sent." (cut the over-explanation)
- "Hmm, that didn't work." → "That didn't work." (drop the "hmm" — it's a tic)
- "Quiet right now. That happens." → "Quiet right now. Invite someone." (turn passive into actionable)
- "A familiar face can change a workout." → Cut. Too poetic. Doesn't say anything.

## Why

Warmth without confidence reads as fragility. Users need to trust that Spottr knows what it's doing. The copy guide's examples were directionally right but some had drifted into performed thoughtfulness — the kind of language that signals "brand trying to seem human" rather than "brand that is human." The five tone checks in `spottr-voice.md` (Specific or vague? Apologetic? Could this appear in a meditation app? Does it patronize? Does it sound like a real person?) are the recurring diagnostic.

## Impacted Areas

- `.claude/skills/spottr-voice.md` — new calibration skill
- All copy work from 2026-05-27 forward — filtered through both copy.md and voice.md
- `spottr-current-state.md` — brand personality section updated

## Risks / Tradeoffs

- **Two copy guides can create contradictions.** Addressed by the explicit rule: if they contradict, voice.md takes precedence (it's the more recent calibration).

## Follow-up Actions

- [ ] Run a copy audit on existing onboarding screens against the five tone checks before beta opens

## Status

Completed (2026-05-27)

---

---

# Conventional Commit Format Adopted

## Date

Pre-2026-05-27

## Decision

All git commits use conventional commit format: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:` prefixes required. No plain-English commits.

## Why

Conventional commits make the git log machine-readable (changelog generation, semantic versioning) and human-scannable (intent is immediately clear from the prefix). Plain commits like "Add unblock feature" require reading the diff to understand intent; `feat: add block and unblock feature` communicates intent in the prefix.

## Impacted Areas

- All commits in this repository from adoption forward
- `memory/feedback-commit-format.md` — recorded as enforced feedback

## Risks / Tradeoffs

None significant.

## Follow-up Actions

None.

## Status

Completed (ongoing standard).

---

---

# Data Retention Policy and RLS Architecture

## Date

Pre-2026-05-27

## Decision

Implemented data retention enforcement via `pg_cron` + a daily edge function. Retention windows:
- Check-ins: deleted after 90 days of inactivity
- Messages: retained per privacy policy terms
- Profiles: retained until user-initiated deletion

Account deletion flow added in-app: users can delete their account from the settings screen. The deletion removes all PII from `profiles`, `checkins`, `messages`, `threads`, `blocks`, `reports` (or anonymizes them per the privacy policy).

RLS policies enforce gym-scoped visibility: users only see profiles, check-ins, and member cards for users at their same gym. No cross-gym data leakage is possible at the query layer.

## Why

The privacy policy makes specific retention promises. Those promises must be mechanically enforced — a promise backed only by a manual process is not a real promise. `pg_cron` enforcement means retention windows are guaranteed to execute even if the team forgets about them.

Account deletion being in-app (not via email request) respects the spirit of GDPR and similar regulations — users shouldn't have to contact someone to exercise their right to delete. One tap, verified, done.

## Impacted Areas

- `supabase/functions/retention-cleanup/` — edge function
- `supabase/migrations/*` — `pg_cron` schedule setup
- `app/edit-profile.tsx` — in-app account deletion CTA
- RLS policies across all tables

## Risks / Tradeoffs

- **Deletion edge cases.** Anonymization vs. hard-delete for messages in active threads. If User A deletes their account, User B still has a thread UI. The current behavior is anonymization of the sender's identity, not hard-delete of message rows. This should be verified end-to-end before beta (roadmap 2.1).

## Follow-up Actions

- [ ] **Roadmap 2.1 — End-to-end account deletion test.** Create account, generate check-ins, send messages, request deletion, verify all rows removed or anonymized. Take screenshots as proof.
- [ ] Document the deletion SQL or RPC in the safety playbook

## Status

Completed (implementation). End-to-end test (roadmap 2.1) — Not started.

---

*Last updated: 2026-05-28. Maintained by Claude Code. Add new entries at the top.*
