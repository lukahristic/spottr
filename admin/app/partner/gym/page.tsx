import { createClient } from '@/lib/supabase/server'
import { updateMyGym, uploadLogo } from '../actions'
import OpeningHours from '@/components/OpeningHours'
import LogoUpload from '@/components/LogoUpload'

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

      {/* Logo */}
      <section className="bg-[#1C1C1C] rounded-2xl p-6 mb-5">
        <h3 className="font-semibold text-sm mb-1">Logo</h3>
        <p className="text-[#888] text-xs mb-4">PNG or JPG, square works best.</p>
        <LogoUpload currentUrl={gym?.logo_url ?? null} action={uploadLogo} />
      </section>

      {/* Main settings */}
      <form action={updateMyGym} className="space-y-5">
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

            <div>
              <label className="text-[#888] text-xs block mb-1.5">Address</label>
              <input
                name="address"
                defaultValue={gym?.address ?? ''}
                placeholder="Street, city"
                className="w-full bg-[#111] text-white placeholder-[#444] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
              />
            </div>

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
              <label className="text-[#888] text-xs block mb-1.5">Latitude</label>
              <input
                name="latitude"
                type="number"
                step="any"
                defaultValue={gym?.latitude ?? ''}
                className="w-full bg-[#111] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
              />
            </div>
            <div>
              <label className="text-[#888] text-xs block mb-1.5">Longitude</label>
              <input
                name="longitude"
                type="number"
                step="any"
                defaultValue={gym?.longitude ?? ''}
                className="w-full bg-[#111] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
              />
            </div>
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

        <button
          type="submit"
          className="w-full bg-[#DFAF3A] text-[#111111] font-bold rounded-xl py-3 text-sm"
        >
          Save changes
        </button>
      </form>
    </div>
  )
}
