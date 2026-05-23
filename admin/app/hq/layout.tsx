import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from './actions'
import HqNav from './Nav'

export const dynamic = 'force-dynamic'

export default async function HqLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: isPlatform } = await supabase.rpc('is_platform_admin')
  if (!isPlatform) redirect('/auth/redirect')

  return (
    <main className="min-h-screen text-white">
      <div className="max-w-5xl mx-auto p-6 pb-16">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[#DFAF3A] text-xs font-semibold tracking-widest uppercase mb-1">Spottr HQ</p>
            <p className="text-[#666] text-xs">Platform admin · all gyms</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-[#888] text-sm hover:text-white transition-colors mt-1">
              Sign out
            </button>
          </form>
        </div>

        <HqNav />

        {children}
      </div>
    </main>
  )
}
