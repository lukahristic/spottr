# Spottr — Claude Code Project Memory

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

- build one feature at a time
- inspect existing architecture first
- keep components small
- use strict TypeScript
- prefer simple solutions
- avoid overengineering
- reuse existing logic whenever possible
- ask before adding new dependencies

Before coding:

1. inspect current implementation
2. explain implementation plan
3. identify affected files
4. identify risks
5. implement minimal changes

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