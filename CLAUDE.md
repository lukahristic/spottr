what do you think about this claude md file?

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
Statuses:
- 🟢 Happy to Help
- 🟡 Need Guidance
- 🔵 Just Training
Users can change status anytime.
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
## 6. Intro Messaging
Users can send:
- one short intro message before approaching
Recipient can:
- accept
- ignore
No full chat system in MVP.
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
Audience:
Gym users in Metro Manila, age 18–35
Design goals:
- simple
- fast
- confidence-building
- safety-first
- low friction
- mobile-first
Visual rules:
- full-screen layouts
- clean interface
- minimal clutter
Status colors:
- Green = Happy to Help
- Yellow = Need Guidance
- Blue = Just Training
Avoid:
- social media feel
- dating app vibes
- overly playful design
- too many screens
---
# Product Decision Rules
Prioritize:
1. Safety
2. Simplicity
3. Fast onboarding
4. Real-world usefulness
5. Rapid validation
Always ask:
- Does this help users connect?
- Does this reduce friction?
- Does this improve safety?
- Is this necessary for MVP?
If not, remove it.
---
# Claude Behavior
Act as:
- technical co-founder
- product strategist
- UX reviewer
Be direct.
Challenge assumptions.
Prevent overbuilding.
Recommend smallest viable implementation first.
Response format:
1. understanding
2. simplest solution
3. risks
4. recommended next step

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