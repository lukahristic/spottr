'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateGymSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const gymId         = formData.get('gym_id') as string
  const latRaw        = formData.get('latitude') as string
  const lngRaw        = formData.get('longitude') as string
  const radiusRaw     = formData.get('checkin_radius_m') as string
  const gymCodeRaw    = (formData.get('gym_code') as string).trim()

  const latitude       = latRaw  ? parseFloat(latRaw)  : null
  const longitude      = lngRaw  ? parseFloat(lngRaw)  : null
  const checkinRadius  = parseInt(radiusRaw) || 100
  const gymCode        = gymCodeRaw || null

  await supabase
    .from('gyms')
    .update({ latitude, longitude, checkin_radius_m: checkinRadius, gym_code: gymCode })
    .eq('id', gymId)

  revalidatePath('/hq/settings')
}

export async function approveVerification(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const userId = formData.get('user_id') as string
  await supabase
    .from('profiles')
    .update({ women_verified: true, women_verified_at: new Date().toISOString() })
    .eq('id', userId)

  revalidatePath('/hq/verifications')
}

type CreateGymState = { success?: boolean; error?: string } | null

export async function createGym(
  _prev: CreateGymState,
  formData: FormData,
): Promise<CreateGymState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const name     = ((formData.get('name')      as string) ?? '').trim()
  const location = ((formData.get('location')  as string) ?? '').trim()
  const address  = ((formData.get('address')   as string) ?? '').trim()
  const gymCodeRaw  = ((formData.get('gym_code') as string) ?? '').trim().toUpperCase()
  const gymCode     = gymCodeRaw || Math.random().toString(36).slice(2, 7).toUpperCase()
  const latRaw      = ((formData.get('latitude')  as string) ?? '').trim()
  const lngRaw      = ((formData.get('longitude') as string) ?? '').trim()
  const radiusRaw   = ((formData.get('checkin_radius_m') as string) ?? '').trim()

  if (!name || !location || !address) {
    return { error: 'Name, location, and address are required.' }
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Math.random().toString(36).slice(2, 6)

  const latitude       = latRaw   ? parseFloat(latRaw)   : null
  const longitude      = lngRaw   ? parseFloat(lngRaw)   : null
  const checkinRadius  = parseInt(radiusRaw) || 100

  const { error } = await supabase.from('gyms').insert({
    name,
    slug,
    location,
    address,
    gym_code:        gymCode,
    latitude,
    longitude,
    checkin_radius_m: checkinRadius,
    is_active:       true,
  })

  if (error) {
    console.error('createGym failed:', error.message)
    return { error: error.message }
  }

  revalidatePath('/hq/gyms')
  return { success: true }
}

export async function invitePartner(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const email  = (formData.get('email')  as string).trim().toLowerCase()
  const gymId  = (formData.get('gym_id') as string).trim()
  const role   = (formData.get('role')   as string) || 'owner'

  if (!email || !gymId) return

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3000'
  const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${adminUrl}/auth/redirect`,
  })

  if (inviteErr || !inviteData?.user) {
    console.error('invite failed', inviteErr)
    return
  }

  await supabase.rpc('add_gym_admin', {
    p_user_id: inviteData.user.id,
    p_gym_id:  gymId,
    p_role:    role,
  })

  revalidatePath('/hq/partners')
}

export async function removePartner(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const adminId = formData.get('admin_id') as string
  if (!adminId) return

  await supabase.rpc('remove_gym_admin', { p_id: adminId })

  revalidatePath('/hq/partners')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
