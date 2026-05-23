import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

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

export default async function ReportsPage() {
  const supabase = await createClient()

  const [{ data: reportsData }, { data: blocksData }] = await Promise.all([
    supabase
      .from('reports')
      .select('id, reporter_id, reported_user_id, checkin_id, reason, note, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('blocks')
      .select('id, blocker_id, blocked_user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const reports = (reportsData as Report[] | null) ?? []
  const blocks  = (blocksData  as Block[]  | null) ?? []

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Reports &amp; blocks</h1>
        <p className="text-[#888] text-sm mt-0.5">Read-only triage of safety signals from members. No actions yet — design once we have volume.</p>
      </div>

      <section className="bg-[#1C1C1C] rounded-2xl overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-[#222]">
          <h2 className="font-semibold text-base">Reports</h2>
          <p className="text-[#888] text-xs mt-0.5">{reports.length} recent</p>
        </div>

        {reports.length === 0 ? (
          <p className="text-[#888] text-sm p-6">No reports filed.</p>
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
                      {new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3 text-white">{r.reason}</td>
                    <td className="px-5 py-3 text-[#888] max-w-md truncate">{r.note ?? '—'}</td>
                    <td className="px-5 py-3 text-[#888] font-mono text-xs">{r.reporter_id.slice(0, 8)}</td>
                    <td className="px-5 py-3 text-[#888] font-mono text-xs">{r.reported_user_id.slice(0, 8)}</td>
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
          <p className="text-[#888] text-sm p-6">No blocks created.</p>
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
                      {b.created_at ? new Date(b.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-3 text-[#888] font-mono text-xs">{b.blocker_id.slice(0, 8)}</td>
                    <td className="px-5 py-3 text-[#888] font-mono text-xs">{b.blocked_user_id.slice(0, 8)}</td>
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
