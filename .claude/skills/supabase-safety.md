# Skill: Supabase Safety

Use before any database change.

## Rules

Always:

- inspect current schema first
- reuse existing tables when possible
- use migrations
- preserve RLS
- explain changes before applying

Avoid:

- duplicate columns
- duplicate tables
- weakening security policies

Never:

- delete data without permission
- drop tables without permission

---

## Before Schema Changes

Check:

1. existing table design
2. relationships
3. indexes
4. policies
5. migration impact

---

## Output Format

1. Schema review
2. Proposed changes
3. Migration plan
4. Risks
5. SQL changes