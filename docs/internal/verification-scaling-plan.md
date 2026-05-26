# Women's verification — scaling plan

**Audience:** the Spottr team. Strategic preparation, not implementation. The current implementation is documented in `app/(tabs)/index.tsx` (request flow) and `admin/app/hq/verifications/` (approval flow).

**The problem:** Today, women's verification is a manual review process. The founder reads the requests, makes a judgment call, approves or declines. This works fine at <500 verified women. It breaks somewhere between 500 and 5,000. By 10,000 it's a part-time job that nobody wants.

**This document defines the three-tier path before we're forced to scramble.**

---

## Why verification matters (one paragraph)

The women's verified space is the single feature most likely to be the reason a woman downloads Spottr. It is therefore both the highest-leverage trust feature we have and the most operationally fragile if we get it wrong. A failure mode where a non-woman gets verified is a brand-existential incident, not a customer service issue. This document errs on the side of cautious.

---

## Tier 1 — Manual review (current)

**Cutover trigger:** in force today. Lifts when verification queue routinely exceeds 10 pending requests at a time.
**Cost:** founder time only — ~3 minutes per review.
**Throughput ceiling:** ~50 reviews per week sustainably.
**Failure mode:** queue blows out; verification waits >7 days; women lose trust in the feature; non-women complete the request by sheer persistence.

### How it works

1. User taps "Request verification" in the app.
2. `profiles.verification_requested_at` is set.
3. Founder (or designated reviewer) opens `/hq/verifications` in the admin app.
4. Reviewer makes a judgment call — what signals? Today, the only signals are name, bio, avatar (often a Dicebear cartoon), and recent check-in/message history. None of these are strong.
5. Approve → `women_verified = true`, `women_verified_at = now()`.

### Honest weaknesses

- No actual identity signal is being checked. A determined bad actor with a feminine-presenting name and a normal-looking bio passes.
- The reviewer is making a gendered judgment on text — which is a) inaccurate and b) increasingly contested ground.
- No appeal process if declined.

We accept these weaknesses at Tier 1 because the user base is small enough that bad actors get caught quickly via reports. That stops being true at scale.

---

## Tier 2 — Photo + selfie comparison

**Cutover trigger:** verification queue routinely exceeds 10 pending requests per day, **or** any single confirmed incident of a non-woman being verified.
**Cost:** ~$0.05–$0.50 per verification depending on automated face-match provider. ~30 seconds of reviewer time only for edge cases.
**Throughput ceiling:** ~1,000 reviews per day with one part-time human in the loop.
**Failure mode:** good-faith users who can't or won't share a selfie get blocked; users with non-standard appearance get false-rejected; reviewer fatigue on the edge cases.

### How it would work

1. User taps "Request verification."
2. App captures: a selfie + a separate photo of a government ID (or a holdable handwritten note with a unique code we generate). Both photos are sent through the existing Supabase Storage pipeline (likely a new private bucket `verifications/`).
3. Automated face-match service compares the two photos. If match confidence is above threshold, the request moves to "auto-approved-pending-review."
4. Human reviewer scans the auto-approved queue — quick visual confirmation, ~5 seconds per case. Only declines or escalations require deeper review.
5. After approval, the photos are deleted (or hashed) per privacy policy.

### Decisions to make before building this

- **Provider.** AWS Rekognition vs Azure Face vs a specialist (Veriff, Onfido, Persona). Costs vary 10x.
- **Document storage.** How long do we keep the ID photo? Our privacy policy currently promises we don't collect identity documents — that policy must change before this tier ships, and the change must be announced publicly.
- **Trans inclusion.** A document-based check that requires the document to "match" perceived gender presentation will fail trans women. Policy decision needed upfront, not at the moment of the first incident.
- **Failure-mode UX.** What does a declined user see? What's the appeal? (See §Appeal process below.)

### Cost model at scale

| Verifications per month | Provider cost | Human review cost | Total |
|---|---|---|---|
| 100 | $5–50 | 1 hr | $25–75 |
| 1,000 | $50–500 | 8 hr | $250–750 |
| 10,000 | $500–5,000 | 80 hr | $2,500–7,500 |

A clear lesson here: at 10k/month, even at the low end, this is a meaningful expense. Build the cost into pricing assumptions if we ever ship paid features.

---

## Tier 3 — Third-party identity verification

**Cutover trigger:** verification queue routinely exceeds 100/day, **or** legal/regulatory pressure mandates stronger checks.
**Cost:** $1–3 per verification.
**Throughput ceiling:** effectively unlimited.
**Failure mode:** privacy-conscious users decline to verify; the verified pool skews toward people comfortable handing ID to a third party.

### How it would work

1. User taps "Request verification."
2. App opens an embedded flow from a third-party provider (Veriff, Persona, Stripe Identity, Onfido). The provider handles ID capture, face match, liveness check, and returns a verification result.
3. Provider returns either "verified" + the legal gender on the ID, or a fail reason.
4. Our system stores **only the outcome** — not the underlying documents or biometric data. The privacy policy explicitly forbids us from holding the source material, and the providers handle this correctly.
5. Auto-approve verified results. Manual review only for declines and edge cases.

### Why we wouldn't ship this today

- The trust message of Spottr ("you only appear while checked in," "we don't store your location") gets diluted the more identity friction we add upfront.
- It's expensive at small scale relative to the value at small scale.
- The user experience of being asked to scan a passport feels heavy for a gym social app. Reserved for when the alternative is worse.

### When we *would* want this

- Active enforcement action by a regulator who requires stronger age/identity checks.
- A reported pattern of bad actors successfully gaming Tier 2.
- A pivot toward features that materially require verified identity (e.g., women-only meet-ups in person, partnership with women's-only gyms).

---

## Appeal process (applies to Tier 2 and Tier 3)

Anyone declined gets a clear path:

1. Decline reason in plain language — not "you failed verification."
2. Option to request human review via `safety@spottr.app`.
3. Human review SLA: 7 days.
4. Final decisions are appealable once. After that, the decision stands.

The appeal process is where trans women, women with appearance changes (medical, age), and women with unusual ID situations get treated like humans. Tier 2 will produce false rejections; the appeal is how we don't lose them.

---

## What we change today, before we need any of this

Three small actions that cost nothing and avoid future regret:

1. **Add a `verification_method` column to `profiles`.** Default `'manual'`. Future tiers populate `'photo_match'` or `'third_party'`. Lets us segment trust signals over time. (Migration only; not in the freeze, so defer until next dev window.)
2. **Track decline reasons.** Today, declining is a non-action. We should add a `verification_declined_reason` column and a small admin UI for recording why. The data lets us tune the bar over time.
3. **Write the public-facing copy.** When we move to Tier 2, the privacy policy and verification flow copy both need updates. Drafting them now (under a flag) means we ship the policy update in lockstep, not three weeks late.

---

## Decision log

When we cross a tier, record here:

| Date | From → To | Reason | Reviewer |
|---|---|---|---|
| 2026-05-27 | (none) → Tier 1 | Initial implementation | wency |

---

*Last updated: May 2026. Re-read this document the first time the verification queue feels uncomfortable.*
