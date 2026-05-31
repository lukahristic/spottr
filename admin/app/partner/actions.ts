'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type RoleRow = { gym_id: string | null }

// Always re-derive the partner's gym from gym_admins. Never trust the client.
async function resolveMyGymId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: rows } = await supabase.rpc('get_my_role')
  return (rows as RoleRow[] | null)?.[0]?.gym_id ?? null
}

const DAYS = ['mon','tue','wed','thu','fri','sat','sun'] as const
type Day = typeof DAYS[number]
type Hours = Record<Day, { open: string; close: string; closed: boolean }>

function parseHours(formData: FormData): Hours {
  const out = {} as Hours
  for (const d of DAYS) {
    out[d] = {
      open:   (formData.get(`hours_${d}_open`)   as string) || '06:00',
      close:  (formData.get(`hours_${d}_close`)  as string) || '22:00',
      closed: formData.get(`hours_${d}_closed`) === 'on',
    }
  }
  return out
}

type GymState = { success?: boolean; error?: string } | null

export async function updateMyGym(
  _prev: GymState,
  formData: FormData,
): Promise<GymState> {
  const supabase = await createClient()
  const gymId = await resolveMyGymId()
  if (!gymId) redirect('/auth/redirect')

  const name        = (formData.get('name')     as string).trim() || null
  const address     = (formData.get('address')  as string).trim() || null
  const location    = (formData.get('location') as string).trim() || null
  const latRaw      = (formData.get('latitude') as string).trim()
  const lngRaw      = (formData.get('longitude') as string).trim()
  const radiusRaw   = (formData.get('checkin_radius_m') as string).trim()
  const gymCodeRaw  = (formData.get('gym_code') as string).trim()
  const isActive    = formData.get('is_active') === 'on'

  const latitude       = latRaw ? parseFloat(latRaw) : null
  const longitude      = lngRaw ? parseFloat(lngRaw) : null
  const checkinRadius  = parseInt(radiusRaw) || 100
  const gymCode        = gymCodeRaw || null

  const { error } = await supabase
    .from('gyms')
    .update({
      name,
      address,
      location,
      latitude,
      longitude,
      checkin_radius_m: checkinRadius,
      gym_code: gymCode,
      is_active: isActive,
      opening_hours: parseHours(formData),
    })
    .eq('id', gymId)

  if (error) return { error: error.message }

  revalidatePath('/partner/gym')
  return { success: true }
}

export async function uploadLogo(
  formData: FormData,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const gymId = await resolveMyGymId()
  if (!gymId) redirect('/auth/redirect')

  const file = formData.get('logo') as File | null
  if (!file || file.size === 0) {
    return { error: 'No file received. The image may be too large (max 5 MB).' }
  }

  const ext      = (file.name.split('.').pop() || 'png').toLowerCase()
  const path     = `${gymId}/logo.${ext}`
  const arrayBuf = await file.arrayBuffer()

  // The user's session JWT isn't attached to storage requests inside a server
  // action, so a user-session upload hits the bucket as `anon` and trips the
  // gym-logos RLS policy. We've already authorized the gym via resolveMyGymId
  // and scoped the path to it, so do the write with a service-role client —
  // same trust model as hq/actions.ts.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: 'Server configuration error.' }
  }
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  const { error: uploadErr } = await adminClient
    .storage
    .from('gym-logos')
    .upload(path, arrayBuf, {
      contentType: file.type || 'image/png',
      upsert: true,
    })

  if (uploadErr) {
    console.error('logo upload failed:', uploadErr.message)
    return { error: uploadErr.message }
  }

  const { data: pub } = adminClient.storage.from('gym-logos').getPublicUrl(path)
  const publicUrl = `${pub.publicUrl}?v=${Date.now()}`

  const { error: dbErr } = await supabase
    .from('gyms')
    .update({ logo_url: publicUrl })
    .eq('id', gymId)

  if (dbErr) {
    console.error('logo db update failed:', dbErr.message)
    return { error: dbErr.message }
  }

  revalidatePath('/partner/gym')
  revalidatePath('/partner')
  return {}
}

export async function generateSlug() {
  const supabase = await createClient()
  const gymId = await resolveMyGymId()
  if (!gymId) redirect('/auth/redirect')

  const { data: gym } = await supabase
    .from('gyms')
    .select('id, name, slug')
    .eq('id', gymId)
    .maybeSingle()

  if (!gym || gym.slug) return  // already has one

  const base = (gym.name ?? 'gym')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || 'gym'

  // append short id to guarantee uniqueness
  const slug = `${base}-${gym.id.slice(0, 6)}`

  await supabase.from('gyms').update({ slug }).eq('id', gymId)
  revalidatePath('/partner/qr')
}

export async function approveVerification(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const gymId = await resolveMyGymId()
  if (!gymId) redirect('/auth/redirect')

  const userId = formData.get('user_id') as string

  // Only approve if this user has checked into the partner's gym
  const { count } = await supabase
    .from('checkins')
    .select('id', { count: 'exact', head: true })
    .eq('gym_id', gymId)
    .eq('user_id', userId)

  if (!count) return

  await supabase
    .from('profiles')
    .update({ women_verified: true, women_verified_at: new Date().toISOString() })
    .eq('id', userId)

  revalidatePath('/partner/verifications')
}

export async function signOutPartner() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
