import { createClient } from '@/lib/supabase/server'
import { updateGymSettings } from '../actions'

export const dynamic = 'force-dynamic'

export default async function HqSettingsPage() {
  const supabase = await createClient()
  const { data: gymId } = await supabase.rpc('get_my_admin_gym_id')

  const { data: gym } = await supabase
    .from('gyms')
    .select('id, name, location, latitude, longitude, checkin_radius_m, gym_code')
    .eq('id', gymId)
    .maybeSingle()

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{gym?.name ?? 'Your Gym'}</h1>
        <p className="text-[#888] text-sm mt-0.5">{gym?.location}</p>
      </div>

      <section className="bg-[#1C1C1C] rounded-2xl p-6">
        <h2 className="font-semibold text-base mb-1">Gym settings</h2>
        <p className="text-[#888] text-xs mb-5">Set your gym location to enable GPS check-in verification.</p>

        <form action={updateGymSettings} className="space-y-4">
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

          <button
            type="submit"
            className="w-full bg-[#DFAF3A] text-[#111111] font-bold rounded-xl py-3 text-sm"
          >
            Save settings
          </button>
        </form>
      </section>
    </div>
  )
}
