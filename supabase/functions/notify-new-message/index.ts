import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record
    // record shape: { id, thread_id, sender_id, body, message_type, created_at }

    if (!record.thread_id || !record.sender_id) {
      return new Response('missing fields', { status: 200 })
    }

    // Resolve recipient via threads table
    const { data: thread } = await supabase
      .from('threads')
      .select('user_1, user_2')
      .eq('id', record.thread_id)
      .single()

    if (!thread) {
      return new Response('no thread', { status: 200 })
    }

    const recipientId = thread.user_1 === record.sender_id ? thread.user_2 : thread.user_1

    if (!recipientId) {
      return new Response('no recipient', { status: 200 })
    }

    const { data: tokenRow } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', recipientId)
      .maybeSingle()

    if (!tokenRow?.token) {
      return new Response('no token', { status: 200 })
    }

    const isIntro = record.message_type === 'intro'
    const message = {
      to: tokenRow.token,
      sound: 'default',
      title: isIntro ? 'Someone reached out.' : 'New message.',
      body: isIntro
        ? 'Open Spottr to see their intro.'
        : 'Open Spottr to continue the conversation.',
      channelId: 'default',
      data: { screen: 'conversation', threadId: record.thread_id },
    }

    const pushRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(message),
    })

    const pushData = await pushRes.json()

    // Clean up stale tokens
    const ticket = pushData?.data
    if (ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered') {
      await supabase.from('push_tokens').delete().eq('user_id', recipientId)
    }

    return new Response(JSON.stringify(pushData), { status: 200 })
  } catch (err) {
    return new Response(String(err), { status: 500 })
  }
})
