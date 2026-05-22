'use server'

import { createClient } from '@/lib/supabase/server'
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

  revalidatePath('/dashboard')
}

export async function approveVerification(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const userId = formData.get('user_id') as string
  await supabase
    .from('profiles')
    .update({ women_verified: true })
    .eq('id', userId)

  revalidatePath('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
