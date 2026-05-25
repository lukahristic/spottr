// supabase/functions/delete-account/index.ts
//
// Permanently deletes the calling user's account and all associated
// data. Required for App Store / Play Store compliance.
//
// Deletion order (each scoped to the calling user_id):
//   1. messages          (sender_id = uid)
//   2. threads           (user_1 = uid OR user_2 = uid)  — cascades to remaining messages
//   3. reports           (reporter_id = uid)             — reports ABOUT the user are kept
//                                                         for 24mo per retention policy
//   4. blocks            (blocker_id = uid OR blocked_user_id = uid)
//   5. checkins          (user_id = uid)
//   6. profiles          (id = uid)
//   7. auth.users        (admin.deleteUser)
//
// Auth model: the function reads the user's JWT from the
// Authorization header to determine WHOSE account to delete. The
// service-role client then performs the deletes (so we don't fight
// RLS row by row).
//
// Invoke from the app:
//   await supabase.functions.invoke('delete-account')
//
// Deploy:
//   supabase functions deploy delete-account --no-verify-jwt
// (We verify the JWT manually so we can return clean error messages
//  to the client instead of a 401 from the gateway.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const SUPABASE_URL          = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'missing_authorization' }, 401)

  // Identify the caller via their JWT using the anon client.
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) {
    return json({ error: 'unauthorized' }, 401)
  }
  const uid = userData.user.id

  // Service-role client for the actual deletes.
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Each step is logged on failure but doesn't short-circuit the
  // overall delete — partial cleanup is still preferable to leaving
  // the account dangling. If auth.deleteUser at the end fails, we
  // surface the error so the client can retry.
  const failures: { step: string; message: string }[] = []
  async function step(name: string, op: () => Promise<{ error: unknown }>) {
    try {
      const { error } = await op()
      if (error) failures.push({ step: name, message: (error as Error).message ?? String(error) })
    } catch (e) {
      failures.push({ step: name, message: (e as Error).message ?? String(e) })
    }
  }

  await step('messages',
    () => admin.from('messages').delete().eq('sender_id', uid))

  await step('threads',
    () => admin.from('threads').delete().or(`user_1.eq.${uid},user_2.eq.${uid}`))

  await step('reports_by_me',
    () => admin.from('reports').delete().eq('reporter_id', uid))

  await step('blocks',
    () => admin.from('blocks').delete().or(`blocker_id.eq.${uid},blocked_user_id.eq.${uid}`))

  await step('checkins',
    () => admin.from('checkins').delete().eq('user_id', uid))

  await step('profiles',
    () => admin.from('profiles').delete().eq('id', uid))

  // Finally, delete the auth user. This is the only step we treat as
  // fatal — if it fails, the user still exists and the client should
  // be able to retry.
  const { error: authDeleteError } = await admin.auth.admin.deleteUser(uid)
  if (authDeleteError) {
    console.error('[delete-account] auth.admin.deleteUser failed', {
      uid,
      message: authDeleteError.message,
      partial_failures: failures,
    })
    return json({
      error: 'auth_delete_failed',
      message: authDeleteError.message,
      partial_failures: failures,
    }, 500)
  }

  if (failures.length > 0) {
    console.warn('[delete-account] completed with partial failures', { uid, failures })
  }

  return json({ ok: true })
})
