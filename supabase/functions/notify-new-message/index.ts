import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record

    // Skip if sender is also the receiver
    if (record.sender_id && record.sender_id === record.receiver_id) {
      return new Response('ok', { status: 200 })
    }

    const { data: tokenRow } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', record.receiver_id)
      .maybeSingle()

    if (!tokenRow?.token) {
      return new Response('no token', { status: 200 })
    }

    const message = {
      to: tokenRow.token,
      sound: 'default',
      title: 'Someone reached out.',
      body: 'Open Spottr to see what they said.',
      channelId: 'default',
      data: { screen: 'profile' },
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
      await supabase.from('push_tokens').delete().eq('user_id', record.receiver_id)
    }

    return new Response(JSON.stringify(pushData), { status: 200 })
  } catch (err) {
    return new Response(String(err), { status: 500 })
  }
})
