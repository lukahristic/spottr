import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type RoleRow = { gym_id: string | null }

type Report = {
  id: string
  reporter_id: string
  reported_user_id: string
  checkin_id: string | null
  reason: string
  note: string | null
  created_at: string
}

type Block = {
  id: string
  blocker_id: string
  blocked_user_id: string
  created_at: string | null
}

type Profile = { id: string; name: string | null }

function nameOf(id: string, nameMap: Record<string, string>): string {
  return nameMap[id] ?? id.slice(0, 8)
}

export default async function PartnerReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: roleRows } = await supabase.rpc('get_my_role')
  const gymId = (roleRows as RoleRow[] | null)?.[0]?.gym_id
  if (!gymId) redirect('/auth/redirect')

  // Fetch checkins at this gym to scope reports and blocks
  const { data: checkinRows } = await supabase
    .from('checkins')
    .select('id, user_id')
    .eq('gym_id', gymId)

  const checkinIds  = (checkinRows ?? []).map((c: { id: string; user_id: string }) => c.id)
  const gymUserIds  = [...new Set((checkinRows ?? []).map((c: { id: string; user_id: string }) => c.user_id))]

  const reports: Report[] = []
  const blocks: Block[]   = []

  await Promise.all([
    checkinIds.length > 0
      ? supabase
          .from('reports')
          .select('id, reporter_id, reported_user_id, checkin_id, reason, note, created_at')
          .in('checkin_id', checkinIds)
          .order('created_at', { ascending: false })
          .limit(50)
          .then(({ data }) => reports.push(...((data as Report[] | null) ?? [])))
      : Promise.resolve(),

    gymUserIds.length > 0
      ? supabase
          .from('blocks')
          .select('id, blocker_id, blocked_user_id, created_at')
          .in('blocker_id', gymUserIds)
          .order('created_at', { ascending: false })
          .limit(50)
          .then(({ data }) => blocks.push(...((data as Block[] | null) ?? [])))
      : Promise.resolve(),
  ])

  // Collect all user IDs we need names for
  const allUserIds = [
    ...new Set([
      ...reports.flatMap((r) => [r.reporter_id, r.reported_user_id]),
      ...blocks.flatMap((b)  => [b.blocker_id, b.blocked_user_id]),
    ]),
  ]

  let nameMap: Record<string, string> = {}
  if (allUserIds.length > 0) {
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', allUserIds)
    nameMap = Object.fromEntries(
      ((profileRows as Profile[] | null) ?? []).map((p) => [p.id, p.name ?? p.id.slice(0, 8)])
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Reports &amp; blocks</h1>
        <p className="text-[#888] text-sm mt-0.5">
          Safety signals from members at your gym. Read-only — contact Spottr HQ for escalations.
        </p>
      </div>

      <section className="bg-[#1C1C1C] rounded-2xl overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-[#222]">
          <h2 className="font-semibold text-base">Reports</h2>
          <p className="text-[#888] text-xs mt-0.5">{reports.length} recent</p>
        </div>

        {reports.length === 0 ? (
          <p className="text-[#888] text-sm p-6">No reports at your gym.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#888] text-xs uppercase tracking-wider">
                  <th className="text-left font-medium px-5 py-3">When</th>
                  <th className="text-left font-medium px-5 py-3">Reason</th>
                  <th className="text-left font-medium px-5 py-3">Note</th>
                  <th className="text-left font-medium px-5 py-3">Reporter</th>
                  <th className="text-left font-medium px-5 py-3">Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 text-[#888] whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3 text-white">{r.reason}</td>
                    <td className="px-5 py-3 text-[#888] max-w-md truncate">{r.note ?? '—'}</td>
                    <td className="px-5 py-3 text-white text-xs">{nameOf(r.reporter_id, nameMap)}</td>
                    <td className="px-5 py-3 text-white text-xs">{nameOf(r.reported_user_id, nameMap)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-[#1C1C1C] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#222]">
          <h2 className="font-semibold text-base">Blocks</h2>
          <p className="text-[#888] text-xs mt-0.5">{blocks.length} recent</p>
        </div>

        {blocks.length === 0 ? (
          <p className="text-[#888] text-sm p-6">No blocks involving your members.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#888] text-xs uppercase tracking-wider">
                  <th className="text-left font-medium px-5 py-3">When</th>
                  <th className="text-left font-medium px-5 py-3">Blocker</th>
                  <th className="text-left font-medium px-5 py-3">Blocked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {blocks.map((b) => (
                  <tr key={b.id}>
                    <td className="px-5 py-3 text-[#888] whitespace-nowrap">
                      {b.created_at
                        ? new Date(b.created_at).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-white text-xs">{nameOf(b.blocker_id, nameMap)}</td>
                    <td className="px-5 py-3 text-white text-xs">{nameOf(b.blocked_user_id, nameMap)}</td>
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
