import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { approveVerification } from '../actions'

export const dynamic = 'force-dynamic'

export default async function VerificationsPage() {
  const supabase = await createClient()

  const { data: pendingProfiles } = await supabase
    .from('profiles')
    .select('id, verification_requested_at')
    .not('verification_requested_at', 'is', null)
    .eq('women_verified', false)
    .order('verification_requested_at', { ascending: true })

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
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Women&apos;s space verifications</h1>
        <p className="text-[#888] text-sm mt-0.5">Approve requests from women who want access to women-only check-ins.</p>
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
  )
}
