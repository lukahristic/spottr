'use client'

import { useActionState } from 'react'
import { updateGymSettings } from '../actions'
import SubmitButton from '@/components/SubmitButton'

type Gym = {
  id: string
  latitude: number | null
  longitude: number | null
  checkin_radius_m: number | null
  gym_code: string | null
}

export default function SettingsForm({ gym }: { gym: Gym | null }) {
  const [state, action] = useActionState(updateGymSettings, null)

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="gym_id" value={gym?.id ?? ''} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[#888] text-xs block mb-1.5">Latitude</label>
          <input
            name="latitude"
            type="number"
            step="any"
            defaultValue={gym?.latitude ?? ''}
            placeholder="e.g. 14.5995"
            className="w-full bg-[#111] text-white placeholder-[#444] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
          />
        </div>
        <div>
          <label className="text-[#888] text-xs block mb-1.5">Longitude</label>
          <input
            name="longitude"
            type="number"
            step="any"
            defaultValue={gym?.longitude ?? ''}
            placeholder="e.g. 120.9842"
            className="w-full bg-[#111] text-white placeholder-[#444] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[#888] text-xs block mb-1.5">Check-in radius (meters)</label>
          <input
            name="checkin_radius_m"
            type="number"
            min="50"
            max="500"
            defaultValue={gym?.checkin_radius_m ?? 100}
            className="w-full bg-[#111] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
          />
        </div>
        <div>
          <label className="text-[#888] text-xs block mb-1.5">Gym code (fallback)</label>
          <input
            name="gym_code"
            type="text"
            defaultValue={gym?.gym_code ?? ''}
            placeholder="e.g. OPEN24"
            className="w-full bg-[#111] text-white placeholder-[#444] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
          />
        </div>
      </div>

      {state?.success && (
        <p className="text-green-400 text-sm bg-green-900/20 rounded-xl px-4 py-2.5">
          Settings saved.
        </p>
      )}
      {state?.error && (
        <p className="text-red-400 text-sm bg-red-900/20 rounded-xl px-4 py-2.5">
          {state.error}
        </p>
      )}

      <SubmitButton label="Save settings" pendingLabel="Saving…" />
    </form>
  )
}
