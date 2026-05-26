# Spottr Implementation Roadmap

**Status:** Operator-mode. This document converts the strategic review into concrete execution.
**Owner:** Wency (founder).
**Cadence:** Reviewed weekly. Items move through `not started` → `in flight` → `done` → `cut`.
**Last updated:** 2026-05-27

---

## Pre-amble — where we actually are

Honest situational read before anything else:

- **Product is over-built for stage.** The codebase audit shows a two-tier admin system, partner portal, women's verification flow, peak-hours analytics, real-time messaging, push notification infrastructure, RLS across 10 tables — all engineered cleanly. There are **zero validated users**. This is a classic builder-comfort pattern. Engineering became the safe place to spend energy instead of standing in a gym talking to strangers.
- **The cold start problem is the only problem worth solving right now.** Everything below is secondary to "get 30 people checked in at the same gym at the same time."
- **The marketing site exists.** It's live at the Vercel URL. The four content pages (`/`, `/gyms`, `/safety`, `/privacy`, `/terms`) are deployed. This is leverageable.
- **No business model is defined yet.** Free for users, free for gyms. This is fine for now but counts as deferred risk, not solved.
- **No PMF signal exists.** Don't act like you have one. The roadmap is structured around getting one, not assuming it.

The hardest discipline this roadmap demands: **stop building things until you have evidence anyone wants them.**

---

## SECTION 1 — Critical fixes before private beta

The bar: a stranger downloads Spottr at the seed gym and has a useful first experience. Without these, the beta is a vanity exercise.

### 1.1 — Issue a feature freeze (today)

| Field | Value |
|---|---|
| **Priority** | Critical |
| **Category** | Operations |
| **Goal** | Stop the founder's instinct to keep building. Direct all energy to validation. |
| **Implementation** | Write the freeze into `CLAUDE.md` as an explicit rule: "No new product features until beta closes. Bug fixes and copy changes only." Tape a printed copy somewhere physical. |
| **Files affected** | `CLAUDE.md` |
| **Dependencies** | None — do this first |
| **Risk if skipped** | The roadmap below is wishful. Founders who can't stop building usually fail at GTM. |
| **Success metric** | Zero new feature PRs for 60 days after beta opens. |

### 1.2 — Solve the empty-state-as-invite problem

| Field | Value |
|---|---|
| **Priority** | Critical |
| **Category** | Product / UX |
| **Goal** | Convert the biggest weakness (empty live list) into the biggest growth action (invite a gym friend). |
| **Implementation** | When `live.tsx` renders zero other checked-in members: replace the existing "quiet" empty state with a two-tier message. Top: "You're the only one here right now." Below: "Someone you know at this gym? Invite them." with a primary button that opens the native share sheet with `spottr://gym/[slug]` and a copy of the gym name. |
| **Files affected** | `app/(tabs)/live.tsx`, `lib/sharing.ts` (new), `spottr-copy.md` (new empty-state strings) |
| **Dependencies** | Deep-link `spottr://gym/[slug]` already works |
| **Risk if skipped** | First-impression drop-off. Users see an empty screen, decide the app is dead, never return. |
| **Success metric** | 30%+ of users who see the empty state tap the invite button at least once. |

### 1.3 — Real profile photos

| Field | Value |
|---|---|
| **Priority** | Critical |
| **Category** | Product / Trust |
| **Goal** | Replace generated cartoon avatars with real photos. Trust requires faces. |
| **Implementation** | Add `photo_url` to `profiles`. Upload via existing Supabase Storage (new `profile-photos` bucket, public read for authenticated users with same-gym scope via RLS). Keep `avatar_seed` and `avatar_style` as fallback. In the UI, photo always wins if present. Onboarding asks for photo; can be skipped, but skipping shows a clear "your face helps people feel comfortable saying hi" line. No filters, no AI heads. |
| **Files affected** | `supabase/migrations/*` (add column, bucket, policies), `app/(onboarding)/*`, `app/edit-profile.tsx`, `app/member/[checkinId].tsx`, `app/(tabs)/profile.tsx`, `app/(tabs)/live.tsx`, `components/Avatar.tsx` |
| **Dependencies** | Storage policies must scope to same-gym viewers only (privacy) |
| **Risk if skipped** | Users send intros to strangers represented by cartoons. Conversion to first-message will be 3–5x lower than with photos. |
| **Success metric** | 60%+ of beta users add a photo; intro-send rate is measurably higher among accounts with photos. |

### 1.4 — "People just checked in at your gym" push notification

| Field | Value |
|---|---|
| **Priority** | Critical |
| **Category** | Product / Retention |
| **Goal** | Pull users into the app when there's actually something to see. Without this, the app only opens when users are already at the gym thinking about it — a tiny window. |
| **Implementation** | Server-side: when a check-in is created, look up which users have that gym in their `user_gyms` list AND haven't checked in there in the past 4 hours AND have notification preferences enabled. Send a quiet notification: "3 people just checked in at Anytime BGC." Throttle: max one per user per gym per 90 minutes. Respect quiet hours (10pm–7am local). |
| **Files affected** | `supabase/functions/notify-checkin/index.ts` (new edge function), `supabase/migrations/*` (notification preference columns on profiles), `app/edit-profile.tsx` (preference toggle UI), existing push token infrastructure |
| **Dependencies** | Push token infrastructure exists; user notification prefs need a UI |
| **Risk if skipped** | The app has no organic retention. It only opens when users are already at the gym, which means daily active use is locked to gym visit frequency. |
| **Success metric** | 25%+ of users who receive the notification open the app within 30 minutes. |

### 1.5 — Onboarding explicitly addresses "early days at your gym"

| Field | Value |
|---|---|
| **Priority** | Critical |
| **Category** | Product / UX |
| **Goal** | Set the right expectations so the first empty list doesn't read as "broken app." |
| **Implementation** | Add a new onboarding screen between "How it works" and "Ready." Title: "You're early — that's good." Body: "Spottr is new at your gym. The first few times you check in, it might be quiet. That's how every gym starts. Invite one person you've seen there — that's the move." CTA: "Got it." Don't make it skippable. |
| **Files affected** | `app/(onboarding)/early-days.tsx` (new), `app/(onboarding)/_layout.tsx` (route order) |
| **Dependencies** | None |
| **Risk if skipped** | Users interpret empty screens as a broken product. Beta retention drops 50% by week 2. |
| **Success metric** | Qualitative — exit interviews with non-returners stop saying "I thought it was broken." |

### 1.6 — Remove "connections started" from member cards (visible to others)

| Field | Value |
|---|---|
| **Priority** | Critical |
| **Category** | Product / Trust |
| **Goal** | A high "connections started" number on another user's profile reads as "this person messages a lot of people" — the exact mental model you're trying to avoid. |
| **Implementation** | Keep the stat on your own profile (it's a personal accomplishment). Remove it from `app/member/[checkinId].tsx` entirely. Keep `show_gyms_visited` as a profile-level toggle but default to `false` (opt-in, not opt-out). |
| **Files affected** | `app/member/[checkinId].tsx`, `app/edit-profile.tsx`, `supabase/migrations/*` (default flip) |
| **Dependencies** | None |
| **Risk if skipped** | The whole "we're not a dating app" positioning is undermined the moment users see someone with "connections started: 47." |
| **Success metric** | No regression — no user reports this missing in beta. |

### 1.7 — Fix the "Open to chat resets" expectation at the toggle

| Field | Value |
|---|---|
| **Priority** | Critical |
| **Category** | Product / Copy |
| **Goal** | Users who don't know openness resets feel like the app is broken when it's off next time. |
| **Implementation** | Under the "Open to chat" toggle on the check-in screen, add small permanent caption text: "Resets every visit. Always your choice." Not a tooltip — visible always. |
| **Files affected** | `app/(tabs)/index.tsx` |
| **Dependencies** | None |
| **Risk if skipped** | Users assume the app reset their preference accidentally. Low-grade trust erosion. |
| **Success metric** | Beta users do not ask "why was Open to chat off again?" in any feedback channel. |

### 1.8 — Pick one gym. Confirm partnership. This week.

| Field | Value |
|---|---|
| **Priority** | Critical |
| **Category** | GTM |
| **Goal** | The roadmap below is fiction until there's a specific gym to launch at. |
| **Implementation** | Identify the gym where you have the highest personal connection (you go there, you know the owner/manager, or both). Have one in-person conversation with the owner this week. The ask is small: permission to place a card at the front desk and a poster in the locker room. Frame it as a 90-day pilot. |
| **Files affected** | None (this is a meeting, not code) |
| **Dependencies** | None |
| **Risk if skipped** | Everything below is hypothetical. |
| **Success metric** | A specific gym name written down with a yes from a specific person. |

---

## SECTION 2 — Launch blockers (private beta → soft public)

These don't block the closed beta at one gym but must be true before any broader audience sees the app.

### 2.1 — Account deletion flow tested end-to-end

| Field | Value |
|---|---|
| **Priority** | Blocker |
| **Category** | Trust & Safety / Legal |
| **Goal** | The privacy policy says users can delete everything. Verify this is actually true and works in one tap. |
| **Implementation** | Manual test: create an account, generate check-ins, send messages, request deletion. Confirm all rows in `profiles`, `checkins`, `messages`, `threads`, `blocks`, `reports` are either removed or properly anonymized. Document the deletion SQL or RPC. |
| **Files affected** | `supabase/functions/delete-account/index.ts` (verify exists), `app/edit-profile.tsx` (verify deletion CTA exists and works) |
| **Dependencies** | None |
| **Risk if skipped** | A privacy promise you can't actually keep is a lawsuit waiting to happen, especially in EU/UK. |
| **Success metric** | A real test deletion that you can prove removed everything. Take screenshots. |

### 2.2 — `safety@spottr.app` is a real, monitored inbox

| Field | Value |
|---|---|
| **Priority** | Blocker |
| **Category** | Trust & Safety / Operations |
| **Goal** | The safety page promises a 48-hour response. Make that true. |
| **Implementation** | Set up the alias. Route to a notification channel you check daily (phone-based push, not just email). Document a one-page response template for common scenarios (harassment, impersonation, age dispute, request to remove account). |
| **Files affected** | `docs/internal/safety-response-templates.md` (new) |
| **Dependencies** | Email infrastructure (likely just an alias in your existing provider) |
| **Risk if skipped** | A real safety incident with no response = brand damage that's nearly impossible to recover from. |
| **Success metric** | A test email to `safety@spottr.app` is acknowledged within 4 hours. |

### 2.3 — Marketing site: add "which gym do you go to?" to waitlist

| Field | Value |
|---|---|
| **Priority** | Blocker |
| **Category** | Marketing / GTM |
| **Goal** | Turn the waitlist from a generic list into a geographic demand signal. When 20 people from the same gym sign up, you have a business case for that gym's owner. |
| **Implementation** | Add an optional `gym_name` text field to the waitlist form on the homepage and footer CTA. Update the `waitlist` Supabase table to include this column. Don't make it required — friction. |
| **Files affected** | `website/components/sections/Hero.tsx`, `website/components/sections/FooterCTA.tsx`, Supabase `waitlist` table migration |
| **Dependencies** | Waitlist infrastructure (already deployed) |
| **Risk if skipped** | Your waitlist is just a list. You can't show a gym owner "14 of your members want this." |
| **Success metric** | After 100 signups, you can identify at least 3 gyms with 5+ waitlist signups. |

### 2.4 — Founder story is visible somewhere

| Field | Value |
|---|---|
| **Priority** | Blocker |
| **Category** | Marketing / Brand |
| **Goal** | Consumer social apps without a real founder story lose to apps that have one. |
| **Implementation** | Write a 200–400 word founder story. The specific gym moment that triggered this. Why women's safety was prioritized. What didn't work in earlier attempts. Post it on the marketing site (`/about` or in the safety page sidebar) and on personal social channels. Founder face visible. |
| **Files affected** | `website/app/about/page.tsx` (new) or in-place addition to home |
| **Dependencies** | The founder writing it |
| **Risk if skipped** | Trust will lag for early users. "Who built this?" is the first question. Right now there's no answer. |
| **Success metric** | The story is published. People can read it. |

### 2.5 — App Store / Play Store metadata locked in

| Field | Value |
|---|---|
| **Priority** | Blocker |
| **Category** | Operations |
| **Goal** | Don't be drafting screenshots and descriptions on launch eve. |
| **Implementation** | Lock the icon, name, subtitle, description, keywords, screenshots, and category. Submit to both stores in TestFlight / internal track during beta. Get review feedback before launch deadline. |
| **Files affected** | Store consoles (not code) |
| **Dependencies** | App is feature-frozen and stable |
| **Risk if skipped** | A 7-day app review delay derails launch. |
| **Success metric** | TestFlight build approved, Play internal track active. |

### 2.6 — Real gym photos on the marketing site

| Field | Value |
|---|---|
| **Priority** | Should improve |
| **Category** | Marketing / Brand |
| **Goal** | The current site is all product screenshots and abstract copy. One real gym photo makes the product feel real. |
| **Implementation** | Take or source 1–2 photos of an actual gym. Color-grade to match the cream palette. Place between sections — likely after Hero and before the LiveFeed section. Get model releases if people are visible. |
| **Files affected** | `website/public/photos/*`, `website/components/sections/*` |
| **Dependencies** | Photos exist |
| **Risk if skipped** | Site reads as conceptual, not real. |
| **Success metric** | Visitor recognizes the brand as a real gym product within 5 seconds. |

---

## SECTION 3 — Growth & density systems

The cold start problem. Solving it is engineering, marketing, and operations combined.

### 3.1 — Founding Member program

| Field | Value |
|---|---|
| **Priority** | Should improve |
| **Category** | Product / Marketing |
| **Goal** | Make being early at a gym feel like an identity, not a disadvantage. |
| **Implementation** | First 50 verified check-ins at a gym get a "Founding Member" badge on their profile (visible only to themselves and as a small accent on their member card). No leaderboard. No competition. Just a quiet "you were here first." Backed by a `founding_member_at_gym_id` column on `profiles` or a join table. |
| **Files affected** | New migration, `app/(tabs)/profile.tsx`, `app/member/[checkinId].tsx` |
| **Dependencies** | At least one gym launched |
| **Risk if skipped** | Early users have no identity advantage. Word-of-mouth suffers. |
| **Success metric** | Founding members refer at least one other user on average. |

### 3.2 — Gym-specific invite mechanism

| Field | Value |
|---|---|
| **Priority** | Should improve |
| **Category** | Product / Growth |
| **Goal** | Invite-a-friend that's gym-contextual, not generic. |
| **Implementation** | "Invite someone to [Gym Name]" button on the live tab. Generates a share message: "I'm on Spottr at [Gym Name]. There are 12 people here right now. [link]." The link is `spottr://gym/[slug]` so it auto-adds the gym for the recipient. |
| **Files affected** | `app/(tabs)/live.tsx`, `lib/sharing.ts` |
| **Dependencies** | Deep links work |
| **Risk if skipped** | Generic referrals will convert at <5%. Gym-specific referrals will convert at 15–25% because the value is concrete. |
| **Success metric** | 1 in 5 invited contacts joins. |

### 3.3 — Physical presence playbook

| Field | Value |
|---|---|
| **Priority** | Critical |
| **Category** | GTM / Operations |
| **Goal** | Get the founder physically at the seed gym during peak hours. Repeatedly. |
| **Implementation** | Document a routine: Mondays and Wednesdays, 6–8pm at the seed gym. Carry cards. Don't pitch. Have conversations. Demo when invited. Log every conversation in a simple spreadsheet (name, gym tenure, did-they-install, vibe). |
| **Files affected** | `docs/internal/seed-gym-log.md` (new) — log of conversations |
| **Dependencies** | A seed gym is identified (1.8) |
| **Risk if skipped** | The founder builds in isolation and the product never reaches density. |
| **Success metric** | 30 conversations logged in the first 30 days. 15 installs. 5 active users. |

### 3.4 — "Now" notifications (the ambient retention hook)

This is 1.4 elevated as a system. The push notification isn't a one-off feature — it's the core retention loop. Once it ships, monitor open rates, throttle aggressively, and treat any rate above 25% open as a strong signal. Below 15% means the notification is annoying, not useful.

### 3.5 — Conversion funnel instrumentation

| Field | Value |
|---|---|
| **Priority** | Should improve |
| **Category** | Operations |
| **Goal** | Know exactly where users drop off. Without funnel data, you're guessing. |
| **Implementation** | Track minimally: install → onboarding complete → first check-in → first message sent → first reply received → second check-in. Six events. No more. Use Supabase or PostHog (self-hosted free tier is fine). Don't add analytics SDKs that conflict with the "no tracking" promise in the privacy policy — keep tracking server-side, anonymized, opt-in. |
| **Files affected** | Edge function for event capture; client-side event triggers |
| **Dependencies** | Privacy policy may need updating to reflect any tracking added |
| **Risk if skipped** | You'll iterate on vibes when the real problem is install-to-onboarding drop-off. |
| **Success metric** | A weekly dashboard you can read in 30 seconds shows the six numbers. |

---

## SECTION 4 — Marketing execution plan

The marketing pillar isn't ads. It's content + a founder voice + gym-specific outreach.

### 4.1 — Founder origin story (long form + short form)

Long form: published on the website (`/about` or as a long post). Short form: a 60-second phone-camera video, no cuts, no script. Both must answer: what gym moment made this necessary, and why does women's safety matter to you specifically?

| Field | Value |
|---|---|
| **Priority** | Blocker |
| **Category** | Marketing / Brand |
| **Files affected** | `website/app/about/page.tsx`, social media accounts |
| **Success metric** | Both forms published. Personal social channels have a pinned version. |

### 4.2 — Safety transparency series (3 posts)

Three pieces of educational content explaining the safety architecture. Examples:
1. "Why 'Open to chat' resets every visit at Spottr — design notes"
2. "The one-intro rule — how Spottr enforces it and why"
3. "Verified women's spaces — what this means and what it doesn't"

These get shared by women's safety accounts, app design accounts, and consumer trust communities — the exact audiences whose endorsement compounds.

| Field | Value |
|---|---|
| **Priority** | Should improve |
| **Category** | Marketing |
| **Files affected** | Blog or social — both work |
| **Success metric** | At least one piece shared by an account with >10k followers in a relevant community. |

### 4.3 — "Gym moment" observational content (TikTok/Reels)

Short vignettes that name the feeling without naming the product. Examples:
- "POV: You've been nodding at the same person for six months."
- "The exact moment you almost said hi at the gym."

15–30 second videos. Vertical. Phone camera. Cheap to produce.

| Field | Value |
|---|---|
| **Priority** | Should improve |
| **Category** | Marketing / Content |
| **Goal** | Build the audience that already feels the problem. They convert at 10x the rate of cold traffic. |
| **Files affected** | Social channels |
| **Success metric** | One piece breaks 50k views in the first 30 days. |

### 4.4 — Vibe-as-content series

Each of the six vibes ("Locked in", "Finding my rhythm", etc.) becomes a standalone piece of brand content. Aesthetic posts, not ads. Anyone who recognizes themselves in one of these vibes is your target user.

### 4.5 — Hyper-targeted gym launch announcements

When a gym goes live, the announcement is gym-specific, not generic.
- Email to waitlist signups who listed that gym
- Personal message via WhatsApp / IG DM to anyone you know there
- A poster at the gym (only after density is achieved, not before)

### 4.6 — Waitlist email sequence (3 emails over 14 days)

| # | When | Subject | Body angle |
|---|---|---|---|
| 1 | Immediately on signup | "You're on the list." | Confirmation in the Spottr voice. Mention: "When we launch at [gym name], you'll be the first to know." |
| 2 | Day 7 | "How Spottr will work at your gym." | Brief explanation. No screenshots. Link to safety page. |
| 3 | Day 14 | A real founder note | One paragraph from the founder. "Where we are. What we're learning. Why this matters." |

| Field | Value |
|---|---|
| **Priority** | Should improve |
| **Category** | Marketing |
| **Files affected** | Email provider (Resend, Loops, etc. — pick one) |
| **Success metric** | 30%+ open rate on all three. |

---

## SECTION 5 — Trust & safety scaling

The features exist. The operations don't yet.

### 5.1 — Women's verification: define the scale path now

| Field | Value |
|---|---|
| **Priority** | Should improve |
| **Category** | Trust & Safety |
| **Goal** | Manual approval breaks at scale. Have a plan before it does. |
| **Implementation** | Document the three-tier approach: (a) manual review under 500 verified users — current state, fine, (b) photo + selfie comparison under 5,000 users, partially automated, (c) third-party identity verification (Veriff, Stripe Identity) above 5,000. Don't build (b) and (c) now — document them. Define the trigger thresholds. |
| **Files affected** | `docs/internal/verification-scaling-plan.md` (new) |
| **Dependencies** | None |
| **Risk if skipped** | Verification queue explodes at first traction moment. |
| **Success metric** | Plan written. Cost model attached. |

### 5.2 — Block effectiveness audit

| Field | Value |
|---|---|
| **Priority** | Should improve |
| **Category** | Trust & Safety |
| **Goal** | Verify blocks actually work in all surfaces. |
| **Implementation** | Test: User A blocks User B. Confirm B disappears from A's live feed. Confirm A disappears from B's live feed (bidirectional). Confirm B can't initiate a thread with A. Confirm existing threads are hidden or marked. Confirm B can't appear in A's member detail page even via deep link. |
| **Files affected** | All gym-scoped query logic — write tests |
| **Dependencies** | None |
| **Risk if skipped** | A blocked user contacting their blocker via a missed surface = the worst-case safety failure. |
| **Success metric** | All six surfaces verified blocked. |

### 5.3 — Moderation actions (currently read-only)

| Field | Value |
|---|---|
| **Priority** | Should improve (post-beta) |
| **Category** | Trust & Safety |
| **Goal** | The admin reports dashboard is read-only with the comment "design once we have volume." That moment is now if beta works. |
| **Implementation** | Design (not build yet): What actions can an HQ admin take on a report? Suspend account? Permanent ban? Issue a warning? Anonymize and review? Document the policy first. Then build the actions. |
| **Files affected** | `docs/internal/moderation-playbook.md` (exists — extend) |
| **Dependencies** | Some report volume |
| **Risk if skipped** | First real harassment case has no operational response. |
| **Success metric** | Policy documented. Actions designed. Implementation in flight. |

### 5.4 — Public response SLA

Already partially done — the safety page says 48 hours. Operationalize this with a real on-call rotation (even if it's just the founder for now) and a tracker.

---

## SECTION 6 — Product polish (post-beta evidence)

Everything in this section assumes the beta proves enough demand. Don't do any of it until that's true.

- **Vibe-based filtering in the live list.** Six vibes is the right number. Allow filtering once there are enough users that filtering is meaningful (~15+ checked in simultaneously).
- **Read receipts in threads.** Adds clarity without pressure. Optional, opt-in.
- **Notification preferences UI.** Granular controls for "now" notifications vs message notifications vs gym updates.
- **Gym hours surfacing.** If gym is closed (per `opening_hours`), surface that to users trying to check in. Reduce frustration.
- **Thread expiration policy.** Threads currently persist indefinitely. Consider archiving after 90 days of inactivity.

---

## SECTION 7 — Things to remove or simplify

Honest cuts. Each saves complexity without subtracting from the product story.

### 7.1 — The "Personas" premium avatar tier

It exists, isn't gated, isn't monetized, isn't differentiated. Remove the option entirely. Pick one avatar style as default. One.

### 7.2 — Peak hours chart in the partner portal

Cool feature. Not a decision driver for a gym owner who currently has zero data. Cut from the MVP partner experience. Bring back when there's a gym with three months of data and a partner who's asking for it.

### 7.3 — The QR poster generator

Same reason. A printable poster is downstream of conversion, not upstream. A gym owner won't print a poster until they believe in the product. Belief comes from users, not posters. Build this when the third gym partner asks for it.

### 7.4 — Gym code fallback for check-in

Either keep GPS-only and tell users they need location enabled, or keep gym codes — but not both. Two check-in methods creates UX ambiguity. Pick one. Probably GPS, with a clear permission flow.

### 7.5 — "Connections started" visible to others

Already in 1.6 as a critical fix. Listed again here for completeness — it's a deletion, not just a hide.

### 7.6 — Accomplishment tracking visibility (downgrade, not delete)

The counts are fine to track silently. Don't surface them to other users by default. Don't celebrate them with badges. Don't make them part of the social signal. They exist for the user's own reflection only.

---

## SECTION 8 — Weekly founder execution checklist

The operating rhythm. Print this. Stick it somewhere.

### Every Monday (planning, 30 minutes)

- [ ] Review last week's seed-gym log (conversations had, installs converted)
- [ ] Pull the six funnel numbers. Write them down. Compare to last week.
- [ ] One sentence: what's the single most important thing this week?
- [ ] Block calendar time for gym presence (Mon + Wed evenings minimum)

### Tuesday – Thursday (execution)

- [ ] **4–6 hours physically at the seed gym** during peak hours. Non-negotiable.
- [ ] **3 user conversations** — beta users, prospective users, or gym regulars. Logged.
- [ ] **1 piece of content shipped** — could be a 60-second video, a single post, a blog. Doesn't need to be polished.
- [ ] **1 gym partner outreach** — either follow-up with current seed gym owner or first contact with the next gym.

### Every Friday (review, 30 minutes)

- [ ] Read the funnel numbers again. Did anything move?
- [ ] Read your top 3 most negative pieces of user feedback. Don't defend. Just read.
- [ ] Update `docs/internal/PROJECT_STATE.md` (or have Claude do it) with: what shipped, what didn't, what's blocked.
- [ ] **One question:** am I building or talking to users? If building > 50% of the week, flag it.

### Weekend (rest, mostly)

Spottr isn't an emergency. Don't burn out. The product is about helping people feel less alone — model that yourself.

### Monthly (deeper review, 90 minutes)

- [ ] Re-read this roadmap. What's moved? What's stalled? What's irrelevant?
- [ ] Re-read the strategic review. Has the situation changed enough to revise it?
- [ ] One brutal question: if Spottr doesn't work, what's the most likely reason? Write it down.

---

## Anti-roadmap — things explicitly NOT in this plan

To prevent scope creep, here's what's deferred indefinitely:

- A second city / international expansion
- Workout tracking, nutrition, or trainer marketplace features
- A community feed or events layer
- Premium tier or paid features
- Corporate wellness partnerships
- B2B sales beyond direct gym partnerships
- An Android-first or Web-first rollout (iOS-first, single platform until traction)
- A separate brand for women's verified spaces

Anything from this list that surfaces as a "we should also..." should be rejected automatically unless the founder can articulate why density at the seed gym is already solved.

---

## Open questions (need founder input)

These are real strategic gaps that the roadmap can't answer for you:

1. **Business model.** Free for users, free for gyms, forever — really? At what point does monetization need a defined path?
2. **Geography.** Philippines first, or wherever you can get density first? They imply different brand voices.
3. **Founder time horizon.** Is this a 12-month sprint to PMF or a 36-month patient build? Roadmap pace adjusts.
4. **Identity verification ceiling.** How much identity verification is the brand willing to add as it scales? The "you only appear while checked in" promise is partly weakened the more verification you add. There's a tradeoff to negotiate.

Each of these should be answered explicitly within the next 30 days, not implicitly through default behaviors.

---

## How this document gets updated

- I update it. Not you. You signal change through our conversations, I keep this current.
- Items move between sections (Critical → In flight → Done → Cut) over time.
- New items appear when conversations introduce new constraints or opportunities.
- The Anti-roadmap section grows as features are explicitly rejected.
- Quarterly: a full re-read to challenge assumptions.

Treat this document as the operational layer between strategy and execution. If it ever stops being useful, the right move is to delete sections, not pad them.
