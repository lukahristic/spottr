import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from './actions'
import Nav from './Nav'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: gymId } = await supabase.rpc('get_my_admin_gym_id')

  if (!gymId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-white text-xl font-bold mb-2">Access denied</h1>
          <p className="text-[#888] text-sm">Your account doesn&apos;t have gym admin access.</p>
          <form action={signOut} className="mt-6">
            <button type="submit" className="text-[#888] text-sm underline">Sign out</button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen text-white">
      <div className="max-w-5xl mx-auto p-6 pb-16">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[#888] text-xs font-semibold tracking-widest uppercase mb-1">Spottr Admin</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-[#888] text-sm hover:text-white transition-colors mt-1">
              Sign out
            </button>
          </form>
        </div>

        <Nav />

        {children}
      </div>
    </main>
  )
}
