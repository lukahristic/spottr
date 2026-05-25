'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Bump this string whenever the public Gym Partner Terms change
// materially. Stored on each admin's row so we can audit which
// version they actually accepted, and trigger a re-acceptance flow
// in the future by comparing the stored version against this one.
const PARTNER_TERMS_VERSION = '2026-05-26'

export async function acceptPartnerTerms() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { error } = await supabase
    .from('gym_admins')
    .update({
      partner_terms_accepted_at: new Date().toISOString(),
      partner_terms_accepted_version: PARTNER_TERMS_VERSION,
    })
    .eq('user_id', user.id)

  if (error) {
    console.error('[acceptPartnerTerms] update failed:', error.message)
    redirect('/accept-terms?error=1')
  }

  redirect('/partner')
}
