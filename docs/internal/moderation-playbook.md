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

*Last updated: May 2026. If you change this document, increment the date and ping the team.*
