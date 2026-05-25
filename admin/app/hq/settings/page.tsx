import { createClient } from '@/lib/supabase/server'
import SettingsForm from './SettingsForm'

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
        <SettingsForm gym={gym} />
      </section>
    </div>
  )
}
