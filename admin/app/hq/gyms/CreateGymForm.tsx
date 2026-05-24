'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createGym } from '../actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-[#DFAF3A] text-[#111111] font-bold rounded-xl py-2.5 px-5 text-sm disabled:opacity-50"
    >
      {pending ? 'Creating…' : 'Create gym'}
    </button>
  )
}

export function CreateGymForm() {
  const [state, action] = useActionState(createGym, null)

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#888] font-medium">Gym name *</label>
          <input
            name="name"
            required
            placeholder="e.g. Iron Works Gym"
            className="bg-[#111] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A] placeholder:text-[#444]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-[#888] font-medium">Location label *</label>
          <input
            name="location"
            required
            placeholder="e.g. Downtown LA"
            className="bg-[#111] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A] placeholder:text-[#444]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[#888] font-medium">Address *</label>
        <input
          name="address"
          required
          placeholder="e.g. 123 Main St, Los Angeles, CA 90001"
          className="bg-[#111] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A] placeholder:text-[#444]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-[#888] font-medium">Gym code</label>
        <input
          name="gym_code"
          placeholder="e.g. IRON24 (auto-generated if blank)"
          className="bg-[#111] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A] placeholder:text-[#444] uppercase"
        />
        <p className="text-xs text-[#555]">Short code members can enter manually to add the gym. Leave blank to auto-generate.</p>
      </div>

      <details className="group">
        <summary className="text-xs text-[#888] cursor-pointer select-none list-none flex items-center gap-1.5 py-1">
          <span className="border border-[#333] rounded px-2 py-0.5 text-[#555] text-xs group-open:text-[#888]">Advanced</span>
          <span className="text-[#555]">Recommended for better location accuracy</span>
        </summary>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#888] font-medium">Latitude</label>
            <input
              name="latitude"
              type="number"
              step="any"
              placeholder="34.0522"
              className="bg-[#111] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A] placeholder:text-[#444]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#888] font-medium">Longitude</label>
            <input
              name="longitude"
              type="number"
              step="any"
              placeholder="-118.2437"
              className="bg-[#111] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A] placeholder:text-[#444]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#888] font-medium">Check-in radius (m)</label>
            <input
              name="checkin_radius_m"
              type="number"
              defaultValue={100}
              min={10}
              max={2000}
              className="bg-[#111] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
            />
          </div>
        </div>
      </details>

      {state?.error && (
        <p className="text-red-400 text-sm bg-red-900/20 rounded-xl px-4 py-2.5">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-green-400 text-sm bg-green-900/20 rounded-xl px-4 py-2.5">
          Gym created successfully.
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
