# Spottr — Claude Code Project Memory

---

## Current Operating Mode: FEATURE FREEZE

**Instituted:** 2026-05-27
**Lifts when:** private beta closes (≥30 active users at seed gym for ≥2 consecutive weeks, **or** explicit founder decision)
**Reason:** the product is functionally complete for MVP. The remaining work is validation, not engineering. Every hour spent building is an hour not spent talking to users.

### What is prohibited under the freeze

- New product features (anything that wasn't in the MVP scope as of 2026-05-27)
- New screens or routes in the mobile app
- New database tables (except as explicitly required by roadmap items 1.2–1.7)
- New columns (except as explicitly required by roadmap items 1.2–1.7)
- New admin or partner portal features
- Refactors that aren't fixing a known bug
- New libraries or dependencies
- Premium features, monetization scaffolding, or commercial logic
- "While we're at it" enhancements

### What is allowed under the freeze

- Bug fixes for existing functionality
- Copy and microcopy edits (see `.claude/skills/spottr-voice.md` for calibration)
- Visual polish on existing flows (no new flows)
- Items explicitly listed in `docs/internal/ROADMAP.md` Section 1 (Critical fixes before beta) and Section 2 (Launch blockers)
- Marketing site changes
- Analytics / telemetry that respects the privacy policy
- Removals and simplifications (Section 7 of the roadmap)
- Documentation updates

### If in doubt

The default is **no**. If Claude or the founder isn't sure whether a change is allowed under the freeze, the answer is no — flag it as out-of-scope and add to `docs/internal/ROADMAP.md` for post-freeze consideration.

### Anti-loophole rules

- "It's just a small change" is not a reason to bypass the freeze.
- "It would only take an hour" is not a reason to bypass the freeze.
- "The user might want this" is not a reason to bypass the freeze.
- "Let's just add a column" is not a reason to bypass the freeze.

The discipline is the point. The freeze isn't about specific features — it's about reorienting energy from building to validating.

### How to lift the freeze

Either:
- Founder posts a dated note: "Feature freeze lifted as of [date]. Reason: [reason]." in `docs/internal/PROJECT_STATE.md` or `memory/spottr-current-state.md`, OR
- The beta-close criteria are met and documented in the state file.

Until then, this rule overrides every other rule below.

---

## Product Purpose

Spottr is a gym-focused mobile app that helps people connect safely inside the same gym.

Users check in, share their current vibe, and quietly signal whether they’re open to conversation.

Spottr exists to make gym interactions feel more natural.

It helps users feel:

- less alone
- more comfortable
- more in control

Spottr is:

- a real-time social layer for gyms
- consent-first
- warm and approachable

Spottr is NOT:

- a dating app
- a social media app
- a workout tracker

---

## Core Product Principles

1. Users should never feel exposed.
2. Presence over pressure.
3. Context over labels.
4. Safety over growth.
5. Warmth over polish.
6. Simplicity over features.

---

## MVP Goal

Validate this hypothesis:

**Will gym users use a lightweight app to safely signal openness and connect with others inside the same gym?**

Every feature must support this.

Avoid feature creep.

---

## Core MVP Features

### Authentication

Users can:

- sign up
- sign in
- create profile

Profile fields:

- name
- avatar_seed
- short bio
- fitness goal
- experience level

---

### Gym Check-In

Users can:

- select gym
- check in
- become visible only while checked in

Only users in the same gym can see each other.

---

### Status System

Users choose:

- vibe (required)
- optional custom text
- openness toggle ("Open to chat")

Rules:

- vibe is remembered
- custom text is remembered
- openness resets to OFF every check-in
- status can be updated anytime while checked in

Status labels and copy are defined in:

**.claude/skills/spottr-copy.md**

---

### Live Member List

Show:

- avatar
- name
- vibe
- fitness goal
- openness signal

Realtime updates required.

---

### Messaging

- one intro message starts conversation
- recipient reply unlocks full thread
- threads persist after checkout
- realtime conversation updates required

---

## Explicitly NOT in MVP

Do not build unless requested:

- workout logging
- nutrition tracking
- trainer marketplace
- community feed
- trust score
- premium subscriptions
- monetization features
- advanced moderation tools

---

## Tech Stack

### Frontend

- Expo (React Native)
- TypeScript
- expo-router

### Backend

- Supabase
  - Auth
  - Postgres
  - Realtime
  - RLS

Prefer existing stack.
Avoid unnecessary libraries.

---

## Engineering Rules

**First check: does this work conform to the Feature Freeze at the top of this file?** If no, stop. Surface the question, don't proceed.

- build one feature at a time
- inspect existing architecture first
- keep components small
- use strict TypeScript
- prefer simple solutions
- avoid overengineering
- reuse existing logic whenever possible
- ask before adding new dependencies

Before coding:

1. **confirm the work is allowed under the freeze**
2. inspect current implementation
3. explain implementation plan
4. identify affected files
5. identify risks
6. implement minimal changes

---

## Permissions

Auto-approve:

- file edits
- installs
- terminal commands

Ask only before:

- deleting files
- database schema changes
- environment variable changes

---

## Active Skills

Use these automatically when relevant:

- feature-planning
- spottr-copy
- ui-polish
- supabase-safety

---

## Gym Privacy Rules

- users only see members in same gym
- users not checked in only see gym list + member counts
- no profile visibility without matching gym_id
- gym_id required on check-in

---

## Deep Link Format

spottr://gym/[slug]

---

## Admin Website — Action Button Pattern

Every submit button and action form in the admin website must follow this pattern:

### Double-click prevention
Always use `SubmitButton` from `admin/components/SubmitButton.tsx` instead of a raw `<button type="submit">`. It uses `useFormStatus` to auto-disable while pending and shows a loading label.

```tsx
<SubmitButton label="Save settings" pendingLabel="Saving…" />
// variants: 'primary' (default, gold full-width), 'danger' (red text), 'ghost' (green pill)
```

### Response messages (success / error)
For any form that saves or mutates data:
- The server action must return `{ success?: boolean; error?: string }` (not `void`)
- The form must be a client component using `useActionState` to read and display the result
- Show success in green (`text-green-400 bg-green-900/20`) and errors in red (`text-red-400 bg-red-900/20`)

### Pattern for "Save" forms (settings, gym details, etc.)
1. Server action: `async function myAction(_prev: State, fd: FormData): Promise<State>`
2. Client form component: `useActionState(myAction, null)` + `<form action={action}>`
3. Show `state?.success` and `state?.error` inline above the submit button
4. Page stays a server component that fetches data and passes it as props to the client form

### Pattern for quick row actions (approve, remove, revoke)
Use `SubmitButton` inside the existing server-component form — no `useActionState` needed. The page revalidates and the row disappears, which is sufficient feedback.

### File size limit
`admin/next.config.ts` sets `serverActions.bodySizeLimit: '5mb'`. Do not lower this — file uploads need headroom.