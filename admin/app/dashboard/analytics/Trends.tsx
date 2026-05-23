'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'

export type TrendRow = {
  day: string
  checkins: number
  intros: number
  unlocked: number
  active_users: number
}

function formatDay(d: string) {
  const date = new Date(d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1C1C1C] rounded-2xl p-6 mb-5">
      <h3 className="font-semibold text-sm mb-4">{title}</h3>
      <div className="h-[220px]">{children}</div>
    </div>
  )
}

const axisProps = {
  stroke: '#444',
  tick: { fontSize: 11, fill: '#888' },
}

const tooltipStyle = {
  backgroundColor: '#111',
  border: '1px solid #333',
  borderRadius: 8,
  fontSize: 12,
}

export default function Trends({ data }: { data: TrendRow[] }) {
  const formatted = data.map((d) => ({ ...d, day: formatDay(d.day) }))

  return (
    <>
      <ChartCard title="Daily check-ins">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#222" strokeDasharray="3 3" />
            <XAxis dataKey="day" {...axisProps} />
            <YAxis allowDecimals={false} {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#888' }} />
            <Line
              type="monotone"
              dataKey="checkins"
              stroke="#DFAF3A"
              strokeWidth={2}
              dot={false}
              name="Check-ins"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Intros sent vs. conversations unlocked">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#222" strokeDasharray="3 3" />
            <XAxis dataKey="day" {...axisProps} />
            <YAxis allowDecimals={false} {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#888' }} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#888' }} />
            <Line
              type="monotone"
              dataKey="intros"
              stroke="#C9D8E8"
              strokeWidth={2}
              dot={false}
              name="Intros"
            />
            <Line
              type="monotone"
              dataKey="unlocked"
              stroke="#B8D8C0"
              strokeWidth={2}
              dot={false}
              name="Unlocked"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Active users (daily check-in distinct)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#222" strokeDasharray="3 3" />
            <XAxis dataKey="day" {...axisProps} />
            <YAxis allowDecimals={false} {...axisProps} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#888' }} />
            <Line
              type="monotone"
              dataKey="active_users"
              stroke="#F3D7B6"
              strokeWidth={2}
              dot={false}
              name="Active users"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  )
}
