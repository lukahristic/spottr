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

type InviteState = {
  success?: boolean
  resent?: boolean
  existing?: boolean
  email?: string
  error?: string
} | null

export async function invitePartner(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const email  = (formData.get('email')  as string).trim().toLowerCase()
  const gymId  = (formData.get('gym_id') as string).trim()
  const role   = (formData.get('role')   as string) || 'owner'

  if (!email || !gymId) return { error: 'Email and gym are required.' }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { error: 'Server configuration error.' }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const adminUrl    = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3000'
  const redirectTo  = `${adminUrl}/auth/redirect`

  // Fetch gym_admins + auth users in parallel
  const [{ data: adminsRaw }, { data: { users: authUsers } }] = await Promise.all([
    supabase.rpc('list_gym_admins'),
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const admins       = (adminsRaw as Array<{ admin_id: string; email: string; gym_id: string; user_id: string }> | null) ?? []
  const existingAdmin = admins.find((a) => a.email === email && a.gym_id === gymId)
  const authUser      = authUsers.find((u) => u.email === email)
  const isConfirmed   = !!authUser?.email_confirmed_at

  // Case 1: already a gym admin for this gym
  if (existingAdmin) {
    if (isConfirmed) {
      return { error: `${email} is already an active partner for this gym.` }
    }
    // Pending invite (unconfirmed) — Supabase blocks re-invite for existing users.
    // Delete the stale auth user + gym_admin record, then re-invite fresh.
    await Promise.all([
      adminClient.auth.admin.deleteUser(authUser!.id),
      supabase.rpc('remove_gym_admin', { p_id: existingAdmin.admin_id }),
    ])
    // Fall through to fresh invite below
  }

  // Case 2: user has a confirmed Supabase account but is NOT yet a gym admin here
  if (!existingAdmin && authUser && isConfirmed) {
    await supabase.rpc('add_gym_admin', {
      p_user_id: authUser.id,
      p_gym_id:  gymId,
      p_role:    role,
    })
    revalidatePath('/hq/partners')
    return { success: true, existing: true, email }
  }

  // Case 2b: unconfirmed auth user exists but has no gym_admin record for this gym
  // (e.g. invited to a different gym before, or record was manually removed)
  // Delete the stale auth user so Supabase will accept a fresh invite.
  if (!existingAdmin && authUser && !isConfirmed) {
    await adminClient.auth.admin.deleteUser(authUser.id)
  }

  // Case 3: new user or cleaned-up pending — send a fresh invite email
  const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  })

  if (inviteErr || !inviteData?.user) {
    console.error('invite failed', inviteErr)
    return { error: inviteErr?.message ?? 'Failed to send invite. Please try again.' }
  }

  const { error: rpcErr } = await supabase.rpc('add_gym_admin', {
    p_user_id: inviteData.user.id,
    p_gym_id:  gymId,
    p_role:    role,
  })

  if (rpcErr) {
    console.error('add_gym_admin failed', rpcErr)
    return { error: 'Invite sent but failed to assign gym access. Please try again.' }
  }

  revalidatePath('/hq/partners')
  return { success: true, resent: !!existingAdmin, email }
}

export async function removePartner(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const adminId  = formData.get('admin_id') as string
  const userId   = formData.get('user_id')  as string
  if (!adminId) return

  // For pending (unconfirmed) invites, also delete the auth user so the email
  // can be re-invited cleanly later.
  if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data: { users } } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
    const authUser = users.find((u) => u.id === userId)
    if (authUser && !authUser.email_confirmed_at) {
      await adminClient.auth.admin.deleteUser(userId)
    }
  }

  await supabase.rpc('remove_gym_admin', { p_id: adminId })

  revalidatePath('/hq/partners')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
