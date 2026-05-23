import { createClient } from '@/lib/supabase/server'
import Trends, { type TrendRow } from './Trends'

export const dynamic = 'force-dynamic'

type Overview = {
  total_users: number
  verified_users: number
  active_users_today: number
  checkins_today: number
  unique_checkins_today: number
  intros_sent: number
  conversations_unlocked: number
  reply_rate_pct: number
  reports_filed: number
  blocks_created: number
}

type GymRow = {
  gym_id: string
  gym_name: string
  checkins_today: number
  total_checkins: number
  unique_members: number
  intros_sent: number
  conversations_unlocked: number
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-[#1C1C1C] rounded-2xl p-5">
      <p className="text-[#888] text-xs font-medium uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      {hint && <p className="text-[#666] text-xs mt-1">{hint}</p>}
    </div>
  )
}

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const [
    { data: overviewRows, error: overviewErr },
    { data: gymRows, error: gymErr },
    { data: trendRows, error: trendErr },
  ] = await Promise.all([
    supabase.rpc('get_admin_overview'),
    supabase.rpc('get_admin_gym_activity'),
    supabase.rpc('get_admin_trends', { p_days: 30 }),
  ])

  const overview = (overviewRows as Overview[] | null)?.[0]
  const gyms     = (gymRows     as GymRow[]   | null) ?? []
  const trends   = (trendRows   as TrendRow[] | null) ?? []

  if (overviewErr || gymErr || trendErr) {
    return (
      <div className="bg-[#1C1C1C] rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-2">Couldn&apos;t load analytics</h2>
        <p className="text-[#888] text-sm">
          {overviewErr?.message || gymErr?.message || trendErr?.message}
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-[#888] text-sm mt-0.5">Platform-wide view</p>
      </div>

      <section className="mb-8">
        <h2 className="text-white font-semibold text-base mb-4">Product overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Total users"     value={overview?.total_users           ?? 0} />
          <StatCard label="Verified"        value={overview?.verified_users        ?? 0} hint="women's space" />
          <StatCard label="Active now"      value={overview?.active_users_today    ?? 0} hint="checked-in" />
          <StatCard label="Check-ins today" value={overview?.checkins_today        ?? 0} />
          <StatCard label="Unique today"    value={overview?.unique_checkins_today ?? 0} />
          <StatCard label="Intros sent"     value={overview?.intros_sent           ?? 0} hint="all-time" />
          <StatCard label="Unlocked"        value={overview?.conversations_unlocked ?? 0} hint="conversations" />
          <StatCard label="Reply rate"      value={`${overview?.reply_rate_pct ?? 0}%`} hint="intros that got a reply" />
          <StatCard label="Reports"         value={overview?.reports_filed         ?? 0} />
          <StatCard label="Blocks"          value={overview?.blocks_created        ?? 0} />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-white font-semibold text-base mb-4">Gym activity</h2>
        <div className="bg-[#1C1C1C] rounded-2xl overflow-hidden">
          {gyms.length === 0 ? (
            <p className="text-[#888] text-sm p-6">No gym activity yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#888] text-xs uppercase tracking-wider">
                    <th className="text-left  font-medium px-5 py-3">Gym</th>
                    <th className="text-right font-medium px-5 py-3">Today</th>
                    <th className="text-right font-medium px-5 py-3">All-time</th>
                    <th className="text-right font-medium px-5 py-3">Members</th>
                    <th className="text-right font-medium px-5 py-3">Intros</th>
                    <th className="text-right font-medium px-5 py-3">Unlocked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {gyms.map((g) => (
                    <tr key={g.gym_id}>
                      <td className="px-5 py-3 text-white font-medium">{g.gym_name}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{g.checkins_today}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{g.total_checkins}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{g.unique_members}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{g.intros_sent}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{g.conversations_unlocked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-white font-semibold text-base mb-4">Engagement trends · last 30 days</h2>
        <Trends data={trends} />
      </section>
    </div>
  )
}
