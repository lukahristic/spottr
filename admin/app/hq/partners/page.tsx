import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { removePartner } from '../actions'
import { InviteForm } from './InviteForm'

export const dynamic = 'force-dynamic'

type AdminRow = {
  admin_id: string
  user_id: string
  email: string
  gym_id: string
  gym_name: string
  role: string
  created_at: string
  invited_by: string | null
}

export default async function PartnersPage() {
  const supabase = await createClient()

  const [{ data: adminsRaw }, { data: gyms }] = await Promise.all([
    supabase.rpc('list_gym_admins'),
    supabase.from('gyms').select('id, name').order('name'),
  ])

  const admins = (adminsRaw as AdminRow[] | null) ?? []

  // Fetch auth users to detect pending (unconfirmed invite) vs active (confirmed account)
  let confirmedAt: Record<string, string | null> = {}
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data: { users } } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
    for (const u of users) {
      confirmedAt[u.id] = u.email_confirmed_at ?? null
    }
  }

  const pending = admins.filter((a) => !confirmedAt[a.user_id])
  const active  = admins.filter((a) =>  confirmedAt[a.user_id])

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Gym partners</h1>
        <p className="text-[#888] text-sm mt-0.5">Invite gym owners and managers. They&apos;ll receive an email and land directly on their gym dashboard.</p>
      </div>

      <InviteForm gyms={gyms ?? []} />

      {/* Pending invites */}
      {pending.length > 0 && (
        <section className="bg-[#1C1C1C] rounded-2xl overflow-hidden mb-5">
          <div className="px-6 py-4 border-b border-[#222]">
            <h2 className="font-semibold text-base">Pending invites</h2>
            <p className="text-[#888] text-xs mt-0.5">Invited but haven&apos;t signed in yet</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#888] text-xs uppercase tracking-wider">
                  <th className="text-left font-medium px-5 py-3">Email</th>
                  <th className="text-left font-medium px-5 py-3">Gym</th>
                  <th className="text-left font-medium px-5 py-3">Role</th>
                  <th className="text-left font-medium px-5 py-3">Invited</th>
                  <th className="text-right font-medium px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {pending.map((a) => (
                  <tr key={a.admin_id}>
                    <td className="px-5 py-3 text-white">{a.email}</td>
                    <td className="px-5 py-3 text-[#888]">{a.gym_name}</td>
                    <td className="px-5 py-3 text-[#888] capitalize">{a.role}</td>
                    <td className="px-5 py-3 text-[#888]">
                      {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <form action={removePartner}>
                        <input type="hidden" name="admin_id" value={a.admin_id} />
                        <button type="submit" className="text-[#f87171] text-xs font-semibold hover:text-red-300 transition-colors">
                          Revoke
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Active partners */}
      <section className="bg-[#1C1C1C] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#222]">
          <h2 className="font-semibold text-base">Active partners</h2>
          <p className="text-[#888] text-xs mt-0.5">{active.length} partner{active.length === 1 ? '' : 's'}</p>
        </div>

        {active.length === 0 ? (
          <p className="text-[#888] text-sm p-6">No active partners yet. Send an invite above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#888] text-xs uppercase tracking-wider">
                  <th className="text-left  font-medium px-5 py-3">Email</th>
                  <th className="text-left  font-medium px-5 py-3">Gym</th>
                  <th className="text-left  font-medium px-5 py-3">Role</th>
                  <th className="text-left  font-medium px-5 py-3">Added</th>
                  <th className="text-right font-medium px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {active.map((a) => (
                  <tr key={a.admin_id}>
                    <td className="px-5 py-3 text-white">{a.email}</td>
                    <td className="px-5 py-3 text-white">{a.gym_name}</td>
                    <td className="px-5 py-3 text-[#888] capitalize">{a.role}</td>
                    <td className="px-5 py-3 text-[#888]">
                      {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <form action={removePartner}>
                        <input type="hidden" name="admin_id" value={a.admin_id} />
                        <button type="submit" className="text-[#f87171] text-xs font-semibold hover:text-red-300 transition-colors">
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
