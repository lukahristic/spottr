import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PartnerNav from './Nav'
import { signOutPartner } from './actions'

export const dynamic = 'force-dynamic'

type RoleRow = {
  gym_id: string | null
  role: string | null
  is_platform_admin: boolean | null
}

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: rows } = await supabase.rpc('get_my_role')
  const role = (rows as RoleRow[] | null)?.[0]

  // Platform admins belong in HQ; non-admins to denied
  if (!role?.gym_id || role.is_platform_admin) {
    redirect('/auth/redirect')
  }

  // Gate the entire partner dashboard on Gym Partner Terms acceptance.
  // Anyone who hasn't accepted yet gets bounced to the interstitial.
  // get_my_role doesn't return the acceptance column, so query it
  // directly. Cheap (single-row primary-key lookup).
  const { data: accept } = await supabase
    .from('gym_admins')
    .select('partner_terms_accepted_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!accept?.partner_terms_accepted_at) {
    redirect('/accept-terms')
  }

  const { data: gym } = await supabase
    .from('gyms')
    .select('id, name, location, logo_url')
    .eq('id', role.gym_id!)
    .maybeSingle()

  return (
    <main className="min-h-screen text-white">
      <div className="max-w-4xl mx-auto p-6 pb-16">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            {gym?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gym.logo_url}
                alt={`${gym.name} logo`}
                className="w-12 h-12 rounded-xl object-cover bg-[#1C1C1C]"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#1C1C1C] flex items-center justify-center text-[#DFAF3A] font-bold">
                {gym?.name?.[0] ?? '·'}
              </div>
            )}
            <div>
              <p className="text-[#888] text-xs font-semibold tracking-widest uppercase">Spottr · Gym Partner</p>
              <h1 className="text-lg font-bold leading-tight">{gym?.name ?? 'Your gym'}</h1>
              <p className="text-[#888] text-xs">{gym?.location}</p>
            </div>
          </div>
          <form action={signOutPartner}>
            <button type="submit" className="text-[#888] text-sm hover:text-white transition-colors mt-1">
              Sign out
            </button>
          </form>
        </div>

        <PartnerNav />

        {children}
      </div>
    </main>
  )
}
