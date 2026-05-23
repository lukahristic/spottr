import { createClient } from '@/lib/supabase/server'
import PeakHours, { type PeakRow } from './PeakHours'

export const dynamic = 'force-dynamic'

type Overview = {
  members_today:           number
  checkins_this_week:      number
  unique_members_all_time: number
  intros_sent:             number
  conversations_unlocked:  number
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-[#1C1C1C] rounded-2xl p-5">
      <p className="text-[#888] text-xs font-medium uppercase tracking-wider mb-2">{label}</p>
      <p className="text-3xl font-bold text-white tabular-nums">{value}</p>
      {hint && <p className="text-[#666] text-xs mt-1">{hint}</p>}
    </div>
  )
}

export default async function PartnerOverviewPage() {
  const supabase = await createClient()

  const [{ data: overviewRows }, { data: peakRows }] = await Promise.all([
    supabase.rpc('get_partner_overview'),
    supabase.rpc('get_partner_peak_hours', { p_days: 30 }),
  ])

  const overview = (overviewRows as Overview[] | null)?.[0]
  const peak     = (peakRows     as PeakRow[]  | null) ?? []

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-bold">Overview</h2>
        <p className="text-[#888] text-sm mt-0.5">How Spottr is feeling at your gym.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <StatCard label="Members in your gym today" value={overview?.members_today ?? 0} />
        <StatCard label="Check-ins this week"       value={overview?.checkins_this_week ?? 0} />
        <StatCard label="Members who've visited"    value={overview?.unique_members_all_time ?? 0} hint="all-time" />
        <StatCard label="Connections started"       value={overview?.intros_sent ?? 0} hint="member-to-member" />
        <StatCard label="Conversations that took off" value={overview?.conversations_unlocked ?? 0} hint="reached a reply" />
      </div>

      <section className="bg-[#1C1C1C] rounded-2xl p-6">
        <h3 className="font-semibold text-sm mb-1">Busiest times of day</h3>
        <p className="text-[#888] text-xs mb-4">Check-ins by hour, last 30 days</p>
        <PeakHours data={peak} />
      </section>
    </div>
  )
}
