import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { invitePartner, removePartner } from '../actions'

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

  // Fetch auth users to detect pending (never signed in) vs active partners
  let userLastSignIn: Record<string, string | null> = {}
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data: { users } } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
    for (const u of users) {
      userLastSignIn[u.id] = u.last_sign_in_at ?? null
    }
  }

  const pending = admins.filter((a) => userLastSignIn[a.user_id] === null || userLastSignIn[a.user_id] === undefined)
  const active  = admins.filter((a) => userLastSignIn[a.user_id])

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Gym partners</h1>
        <p className="text-[#888] text-sm mt-0.5">Invite gym owners and managers. They&apos;ll receive an email and land directly on their gym dashboard.</p>
      </div>

      {/* Invite form */}
      <section className="bg-[#1C1C1C] rounded-2xl p-6 mb-5">
        <h2 className="font-semibold text-base mb-1">Invite partner</h2>
        <p className="text-[#888] text-xs mb-4">Enter their email — we&apos;ll send them a setup link. They don&apos;t need a Spottr account first.</p>
        <form action={invitePartner} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="email"
            name="email"
            required
            placeholder="owner@theirgym.com"
            className="bg-[#111] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A] placeholder:text-[#444]"
          />

          <select
            name="gym_id"
            required
            defaultValue=""
            className="bg-[#111] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
          >
            <option value="" disabled>Gym…</option>
            {(gyms ?? []).map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          <select
            name="role"
            defaultValue="owner"
            className="bg-[#111] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
          >
            <option value="owner">Owner</option>
            <option value="manager">Manager</option>
          </select>

          <button
            type="submit"
            className="bg-[#DFAF3A] text-[#111111] font-bold rounded-xl py-2.5 text-sm"
          >
            Send invite
          </button>
        </form>
      </section>

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
