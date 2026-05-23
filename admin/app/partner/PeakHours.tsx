'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type PeakRow = { hour: number; checkins: number }

function formatHour(h: number) {
  if (h === 0)  return '12a'
  if (h === 12) return '12p'
  if (h < 12)   return `${h}a`
  return `${h - 12}p`
}

export default function PeakHours({ data }: { data: PeakRow[] }) {
  const shaped = data.map((r) => ({ ...r, label: formatHour(r.hour) }))

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={shaped} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#222" strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke="#444" tick={{ fontSize: 11, fill: '#888' }} interval={1} />
          <YAxis allowDecimals={false} stroke="#444" tick={{ fontSize: 11, fill: '#888' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#888' }}
            formatter={(v) => [v as number, 'check-ins']}
          />
          <Bar dataKey="checkins" fill="#DFAF3A" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
