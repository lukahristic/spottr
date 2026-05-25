import { createClient } from '@/lib/supabase/server'
import { uploadLogo } from '../actions'
import LogoUpload from '@/components/LogoUpload'
import GymForm from './GymForm'

export const dynamic = 'force-dynamic'

type RoleRow = { gym_id: string | null }

type GymRow = {
  id: string
  name: string | null
  slug: string | null
  location: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  checkin_radius_m: number | null
  gym_code: string | null
  logo_url: string | null
  is_active: boolean | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  opening_hours: any
}

export default async function PartnerGymPage() {
  const supabase = await createClient()
  const { data: rows } = await supabase.rpc('get_my_role')
  const gymId = (rows as RoleRow[] | null)?.[0]?.gym_id
  if (!gymId) return null

  const { data: gym } = await supabase
    .from('gyms')
    .select('id, name, slug, location, address, latitude, longitude, checkin_radius_m, gym_code, logo_url, is_active, opening_hours')
    .eq('id', gymId)
    .maybeSingle<GymRow>()

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-xl font-bold">Gym details</h2>
        <p className="text-[#888] text-sm mt-0.5">Members see this when they check in.</p>
      </div>

      {/* Logo — separate form, handled by LogoUpload */}
      <section className="bg-[#1C1C1C] rounded-2xl p-6 mb-5">
        <h3 className="font-semibold text-sm mb-1">Logo</h3>
        <p className="text-[#888] text-xs mb-4">PNG or JPG, square works best.</p>
        <LogoUpload currentUrl={gym?.logo_url ?? null} action={uploadLogo} />
      </section>

      <GymForm gym={gym} />
    </div>
  )
}
