'use client'

import { useState } from 'react'

const DAYS = [
  { key: 'mon', label: 'Monday'    },
  { key: 'tue', label: 'Tuesday'   },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday'  },
  { key: 'fri', label: 'Friday'    },
  { key: 'sat', label: 'Saturday'  },
  { key: 'sun', label: 'Sunday'    },
] as const

type DayKey = typeof DAYS[number]['key']
type Hours = Record<DayKey, { open: string; close: string; closed: boolean }>

const DEFAULT: Hours = {
  mon: { open: '06:00', close: '22:00', closed: false },
  tue: { open: '06:00', close: '22:00', closed: false },
  wed: { open: '06:00', close: '22:00', closed: false },
  thu: { open: '06:00', close: '22:00', closed: false },
  fri: { open: '06:00', close: '22:00', closed: false },
  sat: { open: '08:00', close: '20:00', closed: false },
  sun: { open: '08:00', close: '20:00', closed: false },
}

export default function OpeningHours({ initial }: { initial: Hours | null }) {
  const [hours, setHours] = useState<Hours>(initial ?? DEFAULT)

  function update(day: DayKey, patch: Partial<Hours[DayKey]>) {
    setHours((h) => ({ ...h, [day]: { ...h[day], ...patch } }))
  }

  return (
    <div className="space-y-2">
      {DAYS.map(({ key, label }) => {
        const h = hours[key]
        return (
          <div key={key} className="grid grid-cols-[7rem_1fr_1fr_auto] items-center gap-3">
            <label className="text-sm text-white">{label}</label>
            <input
              name={`hours_${key}_open`}
              type="time"
              value={h.open}
              onChange={(e) => update(key, { open: e.target.value })}
              disabled={h.closed}
              className="bg-[#111] text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A] disabled:opacity-40"
            />
            <input
              name={`hours_${key}_close`}
              type="time"
              value={h.close}
              onChange={(e) => update(key, { close: e.target.value })}
              disabled={h.closed}
              className="bg-[#111] text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A] disabled:opacity-40"
            />
            <label className="flex items-center gap-2 text-xs text-[#888]">
              <input
                name={`hours_${key}_closed`}
                type="checkbox"
                checked={h.closed}
                onChange={(e) => update(key, { closed: e.target.checked })}
                className="accent-[#DFAF3A]"
              />
              Closed
            </label>
          </div>
        )
      })}
    </div>
  )
}
