# Spottr Moderation Playbook

**Audience:** the Spottr team (not public). The user-facing version of these rules lives at `/community` and `/safety`.

**Purpose:** when a report comes in, anyone on the team can open this file and know exactly what to do, how fast, and what the escalation path looks like. The Privacy Policy promises a 48-hour response. The Community Guidelines promise outcomes scale with severity. This document is how we keep those promises.

---

## 1. Triage — within 24 hours

Every new report in the `reports` table gets one of four severity labels within 24 hours of being filed:

| Severity | Meaning | Examples |
|---|---|---|
| **Low** | Annoying but not unsafe. | One-off rude message, low-effort spam, mild complaints about tone. |
| **Medium** | A pattern, or one bad incident that doesn't threaten safety. | Repeated unwanted contact after a soft block, persistent commercial pitches, name-calling. |
| **High** | Safety concern, but no immediate physical danger. | Sustained harassment, sexual content without consent, doxxing attempts. |
| **Severe** | Immediate safety risk OR zero-tolerance category. | Credible threats of physical harm, anything involving a minor, conduct we believe is illegal. |

Triaging means: read the report, read the surrounding context (the reported user's recent messages and check-ins), assign a severity, record the assignment.

When we add the `moderation_actions` table (see Phase 3.9), record the assignment there. Until then, a quick note in our internal moderation channel is enough.

---

## 2. Response SLAs

These are the targets the Privacy Policy and Community Guidelines commit us to. If we'd miss one, escalate to whoever is on call.

| Severity | Response | Action |
|---|---|---|
| Severe | Within **4 hours** | Permanent ban + preserve data + consider law enforcement notification |
| High | Within **24 hours** | Investigate; act per the action ladder below |
| Medium | Within **48 hours** | Investigate; warning or suspension per ladder |
| Low | Within **7 days** | Note and monitor; act if a pattern develops |

"Response" means: a moderation action is taken OR the reporter receives an acknowledgement that we've reviewed and found no violation.

---

## 3. Action ladder

Default progression for non-severe violations:

1. **Warning** — first or minor incidents. Polite, specific, names the rule violated. Logged.
2. **7-day suspension** — repeat warning, or one medium-severity incident. Account is locked; user receives email explaining why and when they can return.
3. **Permanent ban** — third strike, or one high-severity incident, or any severe-tier action.

Skip directly to permanent ban for severe-tier triggers (next section). Don't escalate on autopilot — judgment matters.

---

## 4. Severe triggers — auto-permanent

No warnings, no second chances. Permanent ban on first incident:

- **Anything involving a minor.** We're 18+. Any attempt to evade that age gate, any sexual or grooming behaviour involving someone we have reason to believe is under 18, gets removed immediately. Preserve all data. Consider law enforcement (next section).
- **Credible threats of physical harm.** Threats against another user, a gym, or staff. Take seriously even if framed as "joking."
- **Sexual content sent without consent.** Photos, explicit messages, or pressure. The "one intro" rule was designed to prevent this; violating it is a severe violation, not a minor one.
- **Conduct we reasonably believe is illegal.** Drugs, weapons, stalking that meets legal thresholds, etc. Don't try to be a lawyer about it — if it looks illegal, treat it as severe.

---

## 5. Law enforcement criteria

We contact local authorities when we believe there is a **credible, specific threat of physical harm** — to a user, a gym, or staff. The bar is "credible and specific," not "weird and concerning."

When we escalate to law enforcement:

1. **Preserve data immediately.** Export the full thread, the reported user's profile, recent check-ins, and the report. Save to our incident archive.
2. **Don't tip the user off.** Do not message them about the report. Permanent-ban silently if needed; the explanation can come later (or never).
3. **Notify the reporter** that we've taken serious action without specifying what. Direct them to local emergency services if they're in immediate danger.
4. **Document the contact.** Who we called, when, what reference number they gave us (if any).

We do not have a duty to investigate beyond what we can see in our own data. Hand it over and let professionals do the rest.

---

## 6. Appeals

A banned user can email `safety@spottr.app` to appeal. We aim to respond within 7 days.

Appeals worth taking seriously:

- New evidence we didn't see at the time.
- Mistaken-identity claims (shared device, family member used the account).
- Clear context shift (the report turns out to have been retaliation for the user reporting *them* first).

Appeals we decline:

- "I didn't mean it that way." Intent doesn't override impact, especially for severe-tier actions.
- "It was a joke." See above.
- Anything from a user already banned for a severe-tier violation.

Document the appeal decision either way.

---

## 7. Template responses

Copy-paste-and-edit. The point is consistency and speed, not literal repetition.

### Acknowledge a report

> Thanks for letting us know. We've received your report and a member of our team will review it within [SLA window]. If something changes or you feel unsafe right now, please reach out to local emergency services and email us directly at safety@spottr.app.

### Confirm an action taken (no detail)

> We reviewed your report and took action on the account involved. We can't share specifics, but you don't need to do anything further. If you encounter more issues, please report them in the app or email safety@spottr.app.

### Inform that no violation was found

> We reviewed your report carefully and didn't find a violation of our Community Guidelines this time. If anything changes or you'd like to talk through it, you can reply to this email or contact us at safety@spottr.app.

### Notify someone they've been suspended

> Your Spottr account has been suspended for [DURATION] for [SPECIFIC BEHAVIOUR — e.g. "sending repeated unsolicited messages after another member did not reply"]. You can review our Community Guidelines at https://spottr.app/community. Your account will be reactivated automatically on [DATE]. If you believe this was a mistake, you can appeal at safety@spottr.app.

### Notify someone of a permanent ban

> Your Spottr account has been permanently removed for [SPECIFIC BEHAVIOUR]. This decision is final and you will not be able to create a new Spottr account. If you believe this was a mistake, you can submit an appeal at safety@spottr.app and we'll review it within 7 days.

### Acknowledge an appeal

> Thanks for your appeal. We've received it and will review within 7 days. We'll respond from this email address when we have a decision.

---

## 8. Things we do NOT do

- We do not share user data with one user about another, except for what they can see in their own conversation history.
- We do not act on a report based purely on what the reporter says — we always look at the surrounding context.
- We do not let a single team member act unilaterally on a permanent ban for a *non-severe* violation. Two-person review for non-obvious cases.
- We do not publicly comment on individual moderation actions. Ever.

---

## 9. HQ vs Partner — who decides what

Two admin tiers exist (per `gym_admins.is_platform_admin` + `role`). They have different authority on moderation.

### Platform admins (HQ)

- All moderation actions: warning, suspension, permanent ban, account anonymisation.
- All severities, all gyms.
- All appeals.
- Law enforcement coordination.

### Gym partner admins

- **No moderation actions today.** They can read reports involving their gym's members (`/partner/reports`) but cannot act.
- They can **flag** a report to HQ as needing attention. (Not yet built; today, they email `safety@`.)
- They can **remove their own listing** if they decide Spottr is no longer the right fit for their gym. That's a partnership decision, not a moderation one.

### Why partners don't moderate

- They have a financial interest in keeping members happy that conflicts with safety judgments.
- Members may be reported across multiple gyms — a single gym's view is incomplete.
- A bad-actor partner could weaponise moderation against members they personally dislike.

If a partner asks for action against a specific member, treat it as a flag, not a directive. We make the call.

---

## 10. Implementation requirements (the unbuilt feature)

The admin reports dashboard is read-only today. When we lift the feature freeze and build moderation actions, here's what the implementation needs to support so it actually maps to the policy in §1–8 above.

### Schema additions

A new `moderation_actions` table:

```sql
create table public.moderation_actions (
  id              uuid primary key default gen_random_uuid(),
  target_user_id  uuid not null references auth.users(id) on delete cascade,
  actor_id        uuid not null references auth.users(id),
  action          text not null check (action in ('warning', 'suspension', 'permanent_ban', 'note', 'reinstated')),
  severity        text not null check (severity in ('low', 'medium', 'high', 'severe')),
  reason          text not null,                       -- internal-facing summary
  user_facing_msg text,                                  -- exact text sent to the target
  related_report_ids uuid[] not null default '{}',     -- reports that informed this action
  suspension_until timestamptz,                          -- only set for 'suspension'
  created_at      timestamptz not null default now()
);
```

Plus a column on `profiles`:

```sql
alter table public.profiles
  add column if not exists suspended_until timestamptz,
  add column if not exists banned_at timestamptz;
```

RLS: only platform admins read or write `moderation_actions`. The two `profiles` columns are readable by the user themselves (so the app can render "you're suspended") and by platform admins.

### App-side enforcement

Auth pipeline must check `banned_at IS NOT NULL` or `suspended_until > now()` at sign-in. If suspended:

- Block sign-in until the timestamp passes.
- Show the exact `user_facing_msg` from the most recent moderation action.
- Provide a link to appeal via `safety@spottr.app`.

If permanently banned:

- Block sign-in indefinitely.
- Same UI as above with appeal link.
- Do **not** delete the account — preservation for appeals and law enforcement preservation.

### Admin UI requirements

In `/hq/reports` (currently read-only):

- Each report row gets an action menu: "Warn", "Suspend 7d", "Suspend 30d", "Ban", "No action".
- Selecting an action opens a modal that requires:
  - **Reason** (free text, required).
  - **User-facing message** (auto-pre-filled from playbook §7 templates, editable).
  - **Linked reports** (multi-select; defaults to the originating report).
- On confirm: insert `moderation_actions` row, update `profiles.suspended_until` / `banned_at` as appropriate, send the user-facing message via email and/or in-app notification.
- For permanent bans on **non-severe** violations: require a second admin to confirm before the action commits (playbook §8 — two-person review). Severe-tier bans don't require co-sign.

### Audit trail

Every action visible in two places:

- `/hq/users/[id]/history` — full moderation timeline for one user.
- `/hq/actions` — recent actions across the platform, filterable by actor, severity, action type.

Actors must be visible. No silent moderation.

### Appeals workflow

- A new `appeals` table or a status field on `moderation_actions`. Status: `pending`, `upheld`, `overturned`.
- Appeal acknowledgement is automatic (playbook §6 template).
- Decision is a follow-up `moderation_actions` row (action: `reinstated` or a new row preserving the original).

### Build order, when the freeze lifts

1. Schema (migration).
2. App-side enforcement (auth pipeline).
3. Admin UI (action menu + modal).
4. Audit views.
5. Appeals.

Don't ship 1–3 without 4. A moderation system without an audit trail is a fairness incident waiting to happen.

---

## 11. Patterns we'll see often — quick reference

Field guide for the most common scenarios. Cross-references the action ladder (§3) and severe triggers (§4).

| Scenario | Default response |
|---|---|
| One unsolicited follow-up message after no reply | **Warning.** Reference the one-intro rule. First incident. |
| Repeated follow-ups across multiple targets | **7-day suspension.** Note the pattern. |
| Sexually explicit intro message | **Permanent ban.** Severe-tier per §4. No warning. |
| Member doxxes another member ("you work at [X]") | **30-day suspension.** Escalate to permanent if the target reports feeling unsafe. |
| Member uses Spottr for commercial pitches (training services, supplements) | **Warning** first. Suspension on repeat. |
| Member creates new account after a ban (ban evasion) | **Permanent ban** of new account. Cross-link in moderation history. |
| Two users mutual-block each other after one report | Likely a real conflict; no action unless content is severe. **No action**, monitor. |
| Report turns out to be retaliation (reporter was acting in bad faith) | Consider **warning the reporter** for false reporting. Document carefully. |
| User reports themselves as feeling unsafe with no specific actor | Not a moderation matter — refer to `safety@`, recommend block-and-leave, surface emergency contacts. |
| Underage user discovered via signal (selfie, profile detail) | **Permanent ban** immediately per §4. Preserve data. Notify `safety@` for review. |

This table will grow. When you make a judgment call on something not listed here that you think will recur, add it.

---

*Last updated: May 2026. If you change this document, increment the date and ping the team.*
