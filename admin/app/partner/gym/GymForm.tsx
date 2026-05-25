'use client'

import { useActionState } from 'react'
import { updateMyGym } from '../actions'
import GeoDetect from '@/components/GeoDetect'
import OpeningHours from '@/components/OpeningHours'
import SubmitButton from '@/components/SubmitButton'

type GymRow = {
  name: string | null
  location: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  checkin_radius_m: number | null
  gym_code: string | null
  is_active: boolean | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  opening_hours: any
}

export default function GymForm({ gym }: { gym: GymRow | null }) {
  const [state, action] = useActionState(updateMyGym, null)

  return (
    <form action={action} className="space-y-5">
      <section className="bg-[#1C1C1C] rounded-2xl p-6">
        <h3 className="font-semibold text-sm mb-4">Gym info</h3>

        <div className="space-y-4">
          <div>
            <label className="text-[#888] text-xs block mb-1.5">Gym name</label>
            <input
              name="name"
              defaultValue={gym?.name ?? ''}
              className="w-full bg-[#111] text-white placeholder-[#444] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
            />
          </div>

          <GeoDetect
            initialAddress={gym?.address ?? ''}
            initialLat={gym?.latitude != null ? String(gym.latitude) : ''}
            initialLng={gym?.longitude != null ? String(gym.longitude) : ''}
          />

          <div>
            <label className="text-[#888] text-xs block mb-1.5">Short location (shown in app)</label>
            <input
              name="location"
              defaultValue={gym?.location ?? ''}
              placeholder="e.g. Bonifacio Global City"
              className="w-full bg-[#111] text-white placeholder-[#444] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#1C1C1C] rounded-2xl p-6">
        <h3 className="font-semibold text-sm mb-1">Check-in</h3>
        <p className="text-[#888] text-xs mb-4">Set your location so members can check in by GPS.</p>

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
            <label className="text-[#888] text-xs block mb-1.5">Gym code (backup)</label>
            <input
              name="gym_code"
              defaultValue={gym?.gym_code ?? ''}
              placeholder="e.g. OPEN24"
              className="w-full bg-[#111] text-white placeholder-[#444] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#1C1C1C] rounded-2xl p-6">
        <h3 className="font-semibold text-sm mb-1">Opening hours</h3>
        <p className="text-[#888] text-xs mb-4">Shown to members in the app.</p>
        <OpeningHours initial={gym?.opening_hours ?? null} />
      </section>

      <section className="bg-[#1C1C1C] rounded-2xl p-6">
        <label className="flex items-start gap-3">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={gym?.is_active !== false}
            className="mt-1 accent-[#DFAF3A]"
          />
          <div>
            <p className="font-semibold text-sm">Spottr is on at this gym</p>
            <p className="text-[#888] text-xs mt-0.5">
              When off, new check-ins are paused. Members already inside stay checked in until their session ends.
            </p>
          </div>
        </label>
      </section>

      {state?.success && (
        <p className="text-green-400 text-sm bg-green-900/20 rounded-xl px-4 py-2.5">
          Changes saved.
        </p>
      )}
      {state?.error && (
        <p className="text-red-400 text-sm bg-red-900/20 rounded-xl px-4 py-2.5">
          {state.error}
        </p>
      )}

      <SubmitButton label="Save changes" pendingLabel="Saving…" />
    </form>
  )
}
