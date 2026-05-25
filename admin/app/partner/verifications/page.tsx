import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { approveVerification } from '../actions'
import SubmitButton from '@/components/SubmitButton'

export const dynamic = 'force-dynamic'

type RoleRow = { gym_id: string | null }

type PendingProfile = {
  id: string
  name: string | null
  verification_requested_at: string
}

export default async function PartnerVerificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: roleRows } = await supabase.rpc('get_my_role')
  const gymId = (roleRows as RoleRow[] | null)?.[0]?.gym_id
  if (!gymId) redirect('/auth/redirect')

  // Get distinct user IDs who have checked into this gym
  const { data: checkinRows } = await supabase
    .from('checkins')
    .select('user_id')
    .eq('gym_id', gymId)

  const gymUserIds = [...new Set((checkinRows ?? []).map((r: { user_id: string }) => r.user_id))]

  const pending: PendingProfile[] = []

  if (gymUserIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, verification_requested_at')
      .not('verification_requested_at', 'is', null)
      .eq('women_verified', false)
      .in('id', gymUserIds)
      .order('verification_requested_at', { ascending: true })

    pending.push(...((data as PendingProfile[] | null) ?? []))
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Women&apos;s space verifications</h1>
        <p className="text-[#888] text-sm mt-0.5">
          Approve requests from women at your gym who want access to women-only check-ins.
        </p>
      </div>

      <section className="bg-[#1C1C1C] rounded-2xl p-6">
        <p className="text-[#888] text-xs mb-5">
          {pending.length === 0 ? 'No pending requests.' : `${pending.length} pending`}
        </p>

        {pending.length > 0 && (
          <div className="space-y-3">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-[#111] rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{p.name ?? 'Unknown member'}</p>
                  <p className="text-[#888] text-xs mt-0.5">
                    Requested{' '}
                    {new Date(p.verification_requested_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                </div>
                <form action={approveVerification}>
                  <input type="hidden" name="user_id" value={p.id} />
                  <SubmitButton label="Approve" pendingLabel="Approving…" variant="ghost" />
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
