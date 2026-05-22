import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { updateGymSettings, approveVerification, signOut } from './actions'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: adminRow } = await supabase
    .from('gym_admins')
    .select('gym_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!adminRow) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-white text-xl font-bold mb-2">Access denied</h1>
          <p className="text-[#888] text-sm">Your account doesn't have gym admin access.</p>
          <form action={signOut} className="mt-6">
            <button type="submit" className="text-[#888] text-sm underline">Sign out</button>
          </form>
        </div>
      </main>
    )
  }

  const { data: gym } = await supabase
    .from('gyms')
    .select('id, name, location, latitude, longitude, checkin_radius_m, gym_code')
    .eq('id', adminRow.gym_id)
    .maybeSingle()

  const { data: pendingProfiles } = await supabase
    .from('profiles')
    .select('id, verification_requested_at')
    .not('verification_requested_at', 'is', null)
    .eq('women_verified', false)
    .order('verification_requested_at', { ascending: true })

  // Enrich with names from auth.users via admin API
  let userNames: Record<string, string> = {}
  if (pendingProfiles && pendingProfiles.length > 0 && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data: { users } } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
    userNames = Object.fromEntries(
      users.map((u) => [u.id, (u.user_metadata?.name as string) ?? u.email ?? u.id])
    )
  }

  const pending = (pendingProfiles ?? []).map((p) => ({
    ...p,
    displayName: userNames[p.id] ?? p.id,
  }))

  return (
    <main className="min-h-screen text-white">
      <div className="max-w-2xl mx-auto p-6 pb-16">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-[#888] text-xs font-semibold tracking-widest uppercase mb-1">Spottr Admin</p>
            <h1 className="text-2xl font-bold">{gym?.name ?? 'Your Gym'}</h1>
            <p className="text-[#888] text-sm mt-0.5">{gym?.location}</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-[#888] text-sm hover:text-white transition-colors mt-1">
              Sign out
            </button>
          </form>
        </div>

        {/* Gym Settings */}
        <section className="bg-[#1C1C1C] rounded-2xl p-6 mb-5">
          <h2 className="font-semibold text-base mb-1">Gym settings</h2>
          <p className="text-[#888] text-xs mb-5">Set your gym location to enable GPS check-in verification.</p>

          <form action={updateGymSettings} className="space-y-4">
            <input type="hidden" name="gym_id" value={gym?.id ?? ''} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#888] text-xs block mb-1.5">Latitude</label>
                <input
                  name="latitude"
                  type="number"
                  step="any"
                  defaultValue={gym?.latitude ?? ''}
                  placeholder="e.g. 14.5995"
                  className="w-full bg-[#111] text-white placeholder-[#444] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
                />
              </div>
              <div>
                <label className="text-[#888] text-xs block mb-1.5">Longitude</label>
                <input
                  name="longitude"
                  type="number"
                  step="any"
                  defaultValue={gym?.longitude ?? ''}
                  placeholder="e.g. 120.9842"
                  className="w-full bg-[#111] text-white placeholder-[#444] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#888] text-xs block mb-1.5">Check-in radius (meters)</label>
                <input
                  name="checkin_radius_m"
                  type="number"
                  min="50"
                  max="500"
                  defaultValue={gym?.checkin_radius_m ?? 100}
                  className="w-full bg-[#111] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
                />
              </div>
              <div>
                <label className="text-[#888] text-xs block mb-1.5">Gym code (fallback)</label>
                <input
                  name="gym_code"
                  type="text"
                  defaultValue={gym?.gym_code ?? ''}
                  placeholder="e.g. OPEN24"
                  className="w-full bg-[#111] text-white placeholder-[#444] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#DFAF3A] text-[#111111] font-bold rounded-xl py-3 text-sm"
            >
              Save settings
            </button>
          </form>
        </section>

        {/* Women's verification requests */}
        <section className="bg-[#1C1C1C] rounded-2xl p-6">
          <h2 className="font-semibold text-base mb-1">Women's space — verification requests</h2>
          <p className="text-[#888] text-xs mb-5">
            {pending.length === 0 ? 'No pending requests.' : `${pending.length} pending`}
          </p>

          {pending.length > 0 && (
            <div className="space-y-3">
              {pending.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-[#111] rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{p.displayName}</p>
                    <p className="text-[#888] text-xs mt-0.5">
                      Requested {new Date(p.verification_requested_at!).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <form action={approveVerification}>
                    <input type="hidden" name="user_id" value={p.id} />
                    <button
                      type="submit"
                      className="bg-[#1a3d2b] text-[#4ade80] text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-[#2B6B42] transition-colors"
                    >
                      Approve
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
