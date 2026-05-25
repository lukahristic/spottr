// supabase/functions/retention-cleanup/index.ts
//
// Enforces the retention windows promised in the Spottr Privacy
// Policy. Designed to be called on a cron schedule (see the
// 20260526000002 migration for the pg_cron entry that invokes it
// daily).
//
// Retention rules:
//   1. checkins   — delete where checked_in_at < now - 12 months
//   2. reports    — delete where created_at    < now - 24 months
//   3. threads    — delete orphan threads where either participant's
//                   profile row no longer exists (the immediate-on-
//                   delete cleanup happens in delete-account; this is
//                   the safety net for out-of-band deletions)
//
// Auth: verify_jwt is disabled at the gateway because pg_cron calls
// this with a custom shared secret, not a user JWT. The shared
// secret lives in two places:
//
//   - the function's RETENTION_CRON_SECRET env var (set via the
//     Edge Functions secrets UI)
//   - Supabase Vault under the name "retention_cron_secret"
//
// The cron body pulls the value from vault and passes it as a
// Bearer token. The function compares to the env var.
//
// Using a dedicated secret (rather than SUPABASE_SERVICE_ROLE_KEY)
// decouples cron auth from Supabase's key management — there have
// been cases where the value injected into SUPABASE_SERVICE_ROLE_KEY
// at runtime differs from the JWT shown in the dashboard.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET           = Deno.env.get('RETENTION_CRON_SECRET') ?? ''

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization') ?? ''
  const expected = `Bearer ${CRON_SECRET}`
  if (!CRON_SECRET || authHeader !== expected) {
    return json({ error: 'unauthorized' }, 401)
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const startedAt = new Date().toISOString()
  const results: Record<string, { deleted: number | null; error?: string }> = {}

  // 1. Old check-ins
  {
    const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    const { error, count } = await admin
      .from('checkins')
      .delete({ count: 'exact' })
      .lt('checked_in_at', cutoff)
    results.checkins = { deleted: count ?? null, error: error?.message }
  }

  // 2. Old reports
  {
    const cutoff = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString()
    const { error, count } = await admin
      .from('reports')
      .delete({ count: 'exact' })
      .lt('created_at', cutoff)
    results.reports = { deleted: count ?? null, error: error?.message }
  }

  // 3. Orphan threads
  {
    const { data, error } = await admin.rpc('delete_orphan_threads')
    results.orphan_threads = {
      deleted: typeof data === 'number' ? data : null,
      error: error?.message,
    }
  }

  const summary = { started_at: startedAt, finished_at: new Date().toISOString(), results }
  console.log('[retention-cleanup]', JSON.stringify(summary))
  return json(summary)
})
