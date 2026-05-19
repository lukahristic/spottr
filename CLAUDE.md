# Spottr — Claude Code Project Memory
## Project Purpose
Spottr is a gym-focused mobile app that helps people connect safely inside the same gym.
Users check into their gym, set a real-time status, and see other members who are open to helping or need guidance.
Spottr removes the awkwardness of:
- beginners being too intimidated to ask for help
- experienced gym-goers wanting to help but not wanting to intrude
The goal is to make in-gym connection easier, safer, and more natural.
This is NOT a dating app.
This is NOT a social media app.
This is NOT a workout tracker.
This is a real-time social layer for gym communities.
---
# Core Problem
Two people in the same gym could help each other, but usually never connect.
Reasons:
- fear of interrupting
- social anxiety
- uncertainty about openness
- lack of consent signaling
Spottr solves this by making intent visible.
---
# MVP Goal
Validate one core hypothesis:
**Will gym users use a lightweight app to safely signal openness and connect with others inside the same gym?**
Everything built must support testing this.
---
# Core MVP Features (build in order)
## 1. Authentication
Users can:
- sign up
- sign in
- create profile
Profile fields:
- name
- photo
- short bio
- fitness goal
- experience level
---
## 2. Gym Check-In
Users can:
- select gym
- check in
- become visible only while checked in
Only users in the same gym can see each other.
---
## 3. Live Status Selection

Status has two layers:

### Layer 1 — Vibe
Fixed chips, tap one to select.

Options:
- Locked in
- Finding my rhythm
- Taking it easy
- Quick session
- In between sets
- Just showing up

Custom input:
- Optional, max 30 chars
- Rotating placeholder examples:
  - leg day, send prayers
  - cardio? unfortunately
  - winging it today
  - pretending I have a plan
  - first time, be nice
  - lost but committed
  - Google said this works
  - manifesting the gains
  - not quitting, just resting
  - figuring it out slowly

### Layer 2 — Openness
Single toggle. Default always off.
Label: Open to chat

### Defaults
First use:
- Vibe: Just showing up
- Custom text: empty
- Openness: off

Return user:
- Vibe: last selection
- Custom text: last entry
- Openness: always off

### Rules
- Vibe chip is required
- Custom text is optional
- Openness toggle always resets to off on check-in
- User can update status anytime while checked in
- Status is remembered between sessions except openness
---

## 4. Check-In Goal Field
On check-in, user selects one goal:
- Learning the basics
- Finding a training partner
- Hitting my own program
- Open to anything

This appears on their profile in the live list.
Users cannot free-type this field in MVP.

## 5. Live Member List
Show:
- who is checked in
- profile photo
- name
- status
- fitness goal
Realtime updates required.
---

## 6. Messaging
- Users send one intro message to start a conversation
- Recipient can reply to unlock full thread
- Full conversation available after first reply
- Threads persist after checkout
- Realtime updates required in conversation screen

---
# Explicitly NOT in MVP
Do NOT build unless requested:
- workout logging
- nutrition tracking
- gym buddy matching
- trust score
- venue map
- premium subscriptions
- monetization features
- trainer marketplace
- community feed
- notifications beyond essentials
- advanced moderation tools
Avoid feature creep.
---
# Tech Stack
## Frontend
- Expo (React Native)
- TypeScript
- expo-router
## Backend
- Supabase
  - Auth
  - Postgres
  - Realtime
  - Row Level Security
Prefer Supabase Auth unless strong reason otherwise.
---
# Engineering Rules
- Build one feature at a time
- Keep components small
- Use strict TypeScript
- Prefer simple architecture
- Avoid overengineering
- Ask before adding new libraries
- Suggest simpler alternatives
Before coding:
1. explain plan
2. identify assumptions
3. identify risks
4. implement simplest solution
---
# UX Rules
# UX Rules
Audience:
Gym users in Metro Manila, age 18–35

Design goals:
- warm and approachable, not premium or corporate
- confidence-building
- safety-first
- low friction
- mobile-first
- playful but trustworthy — never silly, never pushy

Visual rules:
- full-screen layouts
- rounded corners, generous spacing
- warm tones preferred over cold dark tones
- micro-humor in empty states and placeholders
- copy should sound like a real person, not an app

Status system:
- Status = context, not role
- Two layers:
  1. Vibe — fixed chips (tap one) + custom text max 30 chars
  2. Openness — single quiet toggle, on or off
- Fixed vibe chips:
  - Locked in
  - Finding my rhythm
  - Taking it easy
  - Quick session
  - In between sets
  - Just showing up
- Custom vibe placeholder examples (rotate randomly):
  - leg day, send prayers
  - cardio? unfortunately
  - winging it today
  - pretending I have a plan
  - first time, be nice
  - lost but committed
  - Google said this works
  - manifesting the gains
  - not quitting, just resting
  - figuring it out slowly

Avoid:
- social media feel
- dating app vibes
- cold corporate dark mode feel
- declaring roles (Need Guidance, Happy to Help)
- anything that makes users feel pressured or controlled
- too many screens

# Permissions
Auto-approve all file edits, installs, and terminal commands.
Do not ask for confirmation on every step.
Ask only when:
- deleting files
- making database schema changes
- changing environment variables

## Active Skills
For any screen changes or new screens, always apply 
the ux-screen-review skill from 
.claude/skills/ux-screen-review.md automatically.

## Gym Privacy Rules
- Users only see members checked into the same gym
- Users not checked in see gym list and member counts only
- No profile visibility without matching gym_id
- gym_id is required on every check-in insert

## Deep Link Format
spottr://gym/[slug]
QR generation comes after app is published.

## Development Workflow
Before writing any code:
1. Inspect existing architecture
2. Show implementation plan
3. Identify affected files
4. Make minimal changes only

## Response Format for Feature Requests
1. Understanding — summarize the request
2. Implementation Plan — step by step
3. Risks and Assumptions
4. File Changes — list affected files
5. Code Changes
6. Testing Checklist

## Git Commit Rules
Always use conventional commit format:
- feat: new feature
- fix: bug fix
- chore: maintenance
- refactor: code restructure
- docs: documentation

Example: feat: add block and unblock feature
Never commit without a descriptive message.