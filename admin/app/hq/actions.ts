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

  // Look up the existing gym_admin assignment + auth user (if any) in parallel.
  const [{ data: adminsRaw }, { data: { users: authUsers } }] = await Promise.all([
    supabase.rpc('list_gym_admins'),
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const admins        = (adminsRaw as Array<{ admin_id: string; email: string; gym_id: string; user_id: string }> | null) ?? []
  const existingAdmin = admins.find((a) => a.email === email && a.gym_id === gymId)
  const authUser      = authUsers.find((u) => u.email?.toLowerCase() === email)
  const passwordSet   = !!authUser?.user_metadata?.password_set

  // Already assigned to this gym: active partners are done; pending ones can
  // just re-request a code, so treat re-invite as a harmless resend.
  if (existingAdmin) {
    if (passwordSet) return { error: `${email} is already an active partner for this gym.` }
    await sendPartnerCode(email)
    return { success: true, resent: true, email }
  }

  // Provision the auth account if it doesn't exist yet. email_confirm:true so
  // no confirmation email (consumable link) is sent — onboarding is OTP-only.
  let userId = authUser?.id
  if (!userId) {
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
    })
    if (createErr || !created?.user) {
      console.error('createUser failed', createErr)
      return { error: createErr?.message ?? 'Failed to create partner account.' }
    }
    userId = created.user.id
  }

  const { error: rpcErr } = await supabase.rpc('add_gym_admin', {
    p_user_id: userId,
    p_gym_id:  gymId,
    p_role:    role,
  })

  if (rpcErr) {
    console.error('add_gym_admin failed', rpcErr)
    return { error: 'Failed to assign gym access. Please try again.' }
  }

  await sendPartnerCode(email)

  revalidatePath('/hq/partners')
  return { success: true, existing: !!authUser, email }
}

// Email the partner a 6-digit sign-in code (no clickable link to consume).
// Uses a stateless anon client so it never touches the HQ admin's session.
async function sendPartnerCode(email: string) {
  const otpClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  const { error } = await otpClient.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })
  if (error) console.error('sendPartnerCode failed', error)
}

export async function removePartner(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const adminId  = formData.get('admin_id') as string
  const userId   = formData.get('user_id')  as string
  if (!adminId) return

  // Remove the gym assignment first.
  await supabase.rpc('remove_gym_admin', { p_id: adminId })

  // If this user has no remaining gym_admin rows, their auth account exists
  // only for the partner portal — delete it so Authentication stays clean and
  // the email can be re-invited fresh. The platform admin keeps their row, so
  // this never removes them.
  if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { count } = await adminClient
      .from('gym_admins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (!count) {
      await adminClient.auth.admin.deleteUser(userId)
    }
  }

  revalidatePath('/hq/partners')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
