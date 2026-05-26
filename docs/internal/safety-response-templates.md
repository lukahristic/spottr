# safety@spottr.app — Response Workflow

**Audience:** the Spottr team. Supplements `docs/internal/moderation-playbook.md` (the policy) with the specific workflow for the inbound safety inbox.

**Scope:** what to do when an email arrives at `safety@spottr.app`. The in-app report flow is covered by the playbook — this doc covers email and ambiguous cases.

---

## 1. Routing the inbox

Every inbound message at `safety@` is one of these. Sort first, respond second.

| Category | Examples | Initial action |
|---|---|---|
| **Active safety incident** | "Someone I met on Spottr is following me," "I'm being threatened" | Acknowledge within **2 hours**. Then per moderation playbook §4–5. |
| **Harassment / abuse report** | Reporting someone for in-app behaviour | Acknowledge within **24 hours**. Then per playbook §1 triage. |
| **Account help** | "I think my account was hacked," "I can't sign in" | Acknowledge within **24 hours**. Verify identity before any action. |
| **Data request** | Delete my account, export my data, GDPR/CCPA request | Acknowledge within **24 hours**. Action within **30 days** per privacy policy. |
| **Age dispute** | "I think a user is under 18" / "Someone is impersonating my under-18 child" | Treat as severe-tier per playbook §4. Suspend pending review. |
| **Appeal** | Banned user asking for review | Per playbook §6. Acknowledge within **24 hours**, decide within **7 days**. |
| **General feedback** | Not a safety matter | Forward or redirect to `hello@spottr.app`. |

If it's unclear which category it is, default to the **most cautious** one (i.e., if it could be active safety, treat it as active safety).

---

## 2. The first 10 minutes

When you open a new email at `safety@`:

1. **Read it twice.** Don't skim. Survivors of harassment often write carefully and leave the worst details understated.
2. **Acknowledge fast, even before you investigate.** Use the acknowledgement template below. The reporter has already done the hardest part — telling someone. Make sure they know they were heard.
3. **Don't promise specific outcomes** in the acknowledgement. "We'll review this" is fine. "We'll ban them" is not — even if it ends up being true.
4. **Check the database.** Look up the reported user (if named) in `profiles`, `checkins`, `reports`, `blocks`. Read their last 50 messages. Check whether anyone else has reported them.
5. **Open an internal note** before responding substantively. (Until we add `moderation_actions`, our team Slack works.) Write what you saw, what you decided, why.

---

## 3. Verification before account actions

Anyone can email `safety@` claiming to be anyone. Before you take action on a specific account based on an email:

- **Compromised account claims:** require the user to verify they own the email registered to the account. Send a verification link to the registered email, not to the address that wrote to safety@. If those are the same, proceed.
- **Deletion requests:** verify the same way. Confirm intent clearly — deletion is irreversible. Tell them what gets removed (per privacy policy) and what doesn't (e.g., aggregated logs).
- **Reports about a specific named user:** no verification needed of the reporter, but the report alone doesn't justify action. Check the data.
- **Appeals:** the banned user emails from the email registered to the account. If they don't, that's a flag.

---

## 4. Templates not in the moderation playbook

The playbook has the in-app moderation templates (warn / suspend / ban / appeal). These cover scenarios the playbook doesn't.

### Acknowledge an active safety concern

> Thanks for reaching out. We've received your email and we're reviewing it now. Someone on our team will be in touch within the next few hours.
>
> If you feel you're in immediate physical danger, please call local emergency services. We can act on the Spottr account immediately if needed — let us know.

### Acknowledge a non-urgent report (email channel)

> Thanks for letting us know. We've received your email and will review within 24 hours.
>
> If you haven't already, the in-app report tool gives us extra context that helps us act faster — you can find it on any conversation or member card. Either channel works; we just want to make sure you have both options.

### Acknowledge an account deletion request

> Got it — we'll delete your Spottr account and all associated data. To confirm this is really you, please reply to this email from the address registered to the account.
>
> Once confirmed, we'll process the deletion within [N] days. Here's what gets removed: your profile, check-in history, messages, and any reports you've filed. Here's what doesn't: aggregated, anonymised logs we keep for security and abuse prevention.
>
> If you change your mind before we process, just reply to this thread.

### Acknowledge a data export request (GDPR / CCPA)

> Thanks for your request. To confirm this is really you, please reply to this email from the address registered to the account.
>
> Once confirmed, we'll send you a downloadable export of your Spottr data within 30 days, per our privacy policy. The export includes your profile, check-ins, messages, and any reports you've filed.

### Acknowledge an age-dispute report (severe-tier)

Send within 1 hour of receiving. Suspend the disputed account immediately while reviewing.

> Thanks for letting us know. We take this extremely seriously and the account in question has been temporarily suspended while we review.
>
> If you have any additional context that would help us — screenshots, related accounts, anything — please reply with it. If the person in question is your child or someone you have a duty of care for, let us know that too.
>
> We'll have an update within 24 hours.

### Compromised account — verification request

> We can help. Before we make changes to the account, we need to confirm it's yours.
>
> Please reply to this email from the address you originally registered with. If you can't access that email anymore, let us know what's going on and we'll work with you on next steps.

### General feedback (not a safety matter) — redirect

> Thanks for writing in. This inbox is for safety and account issues, but the feedback you've sent is something the team will want to see — I've forwarded it to hello@spottr.app, where someone will get back to you.

---

## 5. Tone rules

The voice for `safety@` is the same Spottr voice (see `.claude/skills/spottr-voice.md`) but stripped of any playfulness. Warm, direct, specific.

- **Use first-person team voice.** "We've received your email," not "Your email has been received."
- **Be specific about timing.** "Within 24 hours" beats "soon" beats nothing.
- **Don't apologise reflexively.** "Sorry you had to write in" reads as evasive. Acknowledge the situation; don't apologise unless we caused it.
- **Don't speculate.** If you don't know what the reported user did, don't guess. If you don't know if a ban is appropriate, don't promise it.
- **Sign with your first name and "Spottr."** Not a brand-team auto-signature. The recipient is talking to a human; let them know that.

---

## 6. Escalation

Escalate to founder if:

- You can't determine severity within 30 minutes.
- The email mentions self-harm, physical violence in progress, or a minor.
- The reporter is a gym partner asking for action against a paying member.
- A press, legal, or law-enforcement request comes in.
- You don't want to be the only one to make this call.

"Escalate" means: forward the thread to the founder with a one-line context, then pause the response until they reply. Maximum pause: 2 hours; if no reply, default to the cautious action (suspend, not ban) and continue.

---

## 7. After-action documentation

For every safety email that resulted in an account action, record:

- Date received
- Category (from §1)
- Reported user ID (if any)
- Action taken (warning / suspension / ban / no action)
- Reason in one sentence
- Decision-maker

This lives in the same place as in-app report triage (internal Slack until `moderation_actions` ships). Two purposes: appeals reference, and pattern recognition over time.

---

*Last updated: May 2026. Mirror updates to `moderation-playbook.md` if the action ladder changes.*
