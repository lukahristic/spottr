// @ts-nocheck
//
// notify-checkin
// ──────────────
// Fires when someone checks in at a gym. Notifies other members who have
// that gym in their user_gyms list with a push message: "N people just
// checked in at [Gym Name]."
//
// Triggered by the database trigger on_checkin_insert_notify (see migration
// 20260527000000_checkin_notifications.sql), which POSTs { record: <new row> }
// to this function.
//
// Filtering rules (all must be true to send):
//   - Recipient is NOT the user who just checked in.
//   - Recipient has the gym in their user_gyms list.
//   - Recipient has notify_gym_activity = true on their profile.
//   - Recipient is NOT currently checked in at the same gym.
//   - Recipient has an active push token.
//   - We haven't notified this recipient about this gym in the past 90 minutes.
//
// On send: upsert into checkin_notifications to update last_sent_at.
//
// Deploy:
//   supabase functions deploy notify-checkin --no-verify-jwt
//
// The --no-verify-jwt flag is needed because pg_net.http_post from the
// database trigger uses the anon key (no user JWT). The function does its
// own authorization by using the service role internally.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Match the throttle threshold in the migration comment.
const THROTTLE_MINUTES = 90

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record

    if (!record?.id || !record?.user_id || !record?.gym_id) {
      return new Response('missing fields', { status: 200 })
    }

    const checkerId: string = record.user_id
    const gymId: string = record.gym_id

    // ─── Get gym name (for notification copy) ────────────────────────────────
    const { data: gym } = await supabase
      .from('gyms')
      .select('name')
      .eq('id', gymId)
      .maybeSingle()

    if (!gym?.name) {
      // Gym doesn't exist or has no name — silently skip.
      return new Response('no gym', { status: 200 })
    }
    const gymName: string = gym.name

    // ─── Find candidate recipients ───────────────────────────────────────────
    // Users who have this gym in their user_gyms list, excluding the checker.
    const { data: candidates } = await supabase
      .from('user_gyms')
      .select('user_id')
      .eq('gym_id', gymId)
      .neq('user_id', checkerId)

    if (!candidates?.length) {
      return new Response('no candidates', { status: 200 })
    }

    const candidateIds = candidates.map((c) => c.user_id).filter(Boolean) as string[]
    if (candidateIds.length === 0) {
      return new Response('no candidate ids', { status: 200 })
    }

    // ─── Filter by notify_gym_activity preference ────────────────────────────
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, notify_gym_activity')
      .in('id', candidateIds)

    const optedIn = (profiles ?? [])
      .filter((p) => p.notify_gym_activity !== false)
      .map((p) => p.id as string)

    if (optedIn.length === 0) {
      return new Response('all opted out', { status: 200 })
    }

    // ─── Exclude users currently checked in at this gym ──────────────────────
    // (No point telling them about activity at the gym they're already in.)
    const { data: activeAtGym } = await supabase
      .from('checkins')
      .select('user_id')
      .eq('gym_id', gymId)
      .eq('is_active', true)
      .in('user_id', optedIn)

    const activeIds = new Set((activeAtGym ?? []).map((c) => c.user_id))
    const offSite = optedIn.filter((uid) => !activeIds.has(uid))

    if (offSite.length === 0) {
      return new Response('all on site', { status: 200 })
    }

    // ─── Apply throttle: skip anyone we notified about this gym recently ────
    const throttleCutoff = new Date(Date.now() - THROTTLE_MINUTES * 60_000).toISOString()
    const { data: recentSends } = await supabase
      .from('checkin_notifications')
      .select('user_id')
      .eq('gym_id', gymId)
      .gt('last_sent_at', throttleCutoff)
      .in('user_id', offSite)

    const throttled = new Set((recentSends ?? []).map((r) => r.user_id))
    const toNotify = offSite.filter((uid) => !throttled.has(uid))

    if (toNotify.length === 0) {
      return new Response('all throttled', { status: 200 })
    }

    // ─── Pull push tokens for the survivors ─────────────────────────────────
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('user_id, token')
      .in('user_id', toNotify)

    if (!tokens?.length) {
      return new Response('no tokens', { status: 200 })
    }

    // ─── Build and send the Expo push batch ─────────────────────────────────
    // Expo supports up to 100 messages per request. For our scale this is
    // always a single batch.
    const messages = tokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title: `Activity at ${gymName}`,
      body: `Someone just checked in. Open Spottr to see who's around.`,
      channelId: 'default',
      data: { screen: 'live', gymId },
    }))

    const pushRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    })

    const pushData = await pushRes.json()

    // ─── Record successful sends in the throttle table ──────────────────────
    // We upsert one row per (user_id, gym_id) so future check-ins know we
    // notified them. Doing this AFTER the push fires so a network failure
    // means we'll retry on the next check-in (instead of being silently
    // throttled).
    const upserts = tokens.map((t) => ({
      user_id: t.user_id,
      gym_id: gymId,
      last_sent_at: new Date().toISOString(),
    }))

    await supabase
      .from('checkin_notifications')
      .upsert(upserts, { onConflict: 'user_id,gym_id' })

    // ─── Clean up dead tokens flagged by Expo ───────────────────────────────
    // pushData.data is an array of tickets, one per message in the request.
    if (Array.isArray(pushData?.data)) {
      const tickets = pushData.data as Array<{ status: string; details?: { error?: string } }>
      const deadTokenUserIds: string[] = []
      tickets.forEach((ticket, i) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          deadTokenUserIds.push(tokens[i].user_id)
        }
      })
      if (deadTokenUserIds.length > 0) {
        await supabase.from('push_tokens').delete().in('user_id', deadTokenUserIds)
      }
    }

    return new Response(
      JSON.stringify({ sent: tokens.length, gym: gymName }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('notify-checkin error:', String(err))
    return new Response(String(err), { status: 500 })
  }
})
