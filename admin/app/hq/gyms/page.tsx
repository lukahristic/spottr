import { createClient } from '@/lib/supabase/server'
import { createGym } from '../actions'

export const dynamic = 'force-dynamic'

type Gym = {
  id: string
  name: string
  location: string | null
  address: string | null
  is_active: boolean
  gym_code: string | null
  created_at: string
}

type AdminRow = {
  gym_id: string
  email: string
  role: string
}

export default async function GymsPage() {
  const supabase = await createClient()

  const [{ data: gyms }, { data: adminsRaw }] = await Promise.all([
    supabase
      .from('gyms')
      .select('id, name, location, address, is_active, gym_code, created_at')
      .order('name'),
    supabase.rpc('list_gym_admins'),
  ])

  const admins = (adminsRaw as AdminRow[] | null) ?? []
  const adminsByGym = admins.reduce<Record<string, string>>((acc, a) => {
    if (!acc[a.gym_id]) acc[a.gym_id] = a.email
    return acc
  }, {})

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Gyms</h1>
        <p className="text-[#888] text-sm mt-0.5">Create and manage gyms on the Spottr platform.</p>
      </div>

      {/* Create form */}
      <section className="bg-[#1C1C1C] rounded-2xl p-6 mb-5">
        <h2 className="font-semibold text-base mb-4">Create gym</h2>
        <form action={createGym} className="space-y-4">
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
            <label className="text-xs text-[#888] font-medium">Gym code *</label>
            <input
              name="gym_code"
              required
              placeholder="e.g. IRON24"
              className="bg-[#111] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A] placeholder:text-[#444] uppercase"
            />
            <p className="text-xs text-[#555]">Short code members can enter manually to add the gym without scanning a QR.</p>
          </div>

          {/* Advanced section */}
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

          <button
            type="submit"
            className="bg-[#DFAF3A] text-[#111111] font-bold rounded-xl py-2.5 px-5 text-sm"
          >
            Create gym
          </button>
        </form>
      </section>

      {/* Gym list */}
      <section className="bg-[#1C1C1C] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#222]">
          <h2 className="font-semibold text-base">All gyms</h2>
          <p className="text-[#888] text-xs mt-0.5">{(gyms ?? []).length} gym{(gyms ?? []).length === 1 ? '' : 's'}</p>
        </div>

        {(gyms ?? []).length === 0 ? (
          <p className="text-[#888] text-sm p-6">No gyms yet. Create the first one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#888] text-xs uppercase tracking-wider">
                  <th className="text-left font-medium px-5 py-3">Name</th>
                  <th className="text-left font-medium px-5 py-3">Location</th>
                  <th className="text-left font-medium px-5 py-3">Code</th>
                  <th className="text-left font-medium px-5 py-3">Partner</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {(gyms as Gym[]).map((g) => (
                  <tr key={g.id}>
                    <td className="px-5 py-3 text-white font-medium">{g.name}</td>
                    <td className="px-5 py-3 text-[#888]">{g.location ?? '—'}</td>
                    <td className="px-5 py-3 text-[#888] font-mono text-xs">{g.gym_code ?? '—'}</td>
                    <td className="px-5 py-3 text-[#888] text-xs">{adminsByGym[g.id] ?? <span className="text-[#555] italic">No partner yet</span>}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${g.is_active ? 'bg-green-900/40 text-green-400' : 'bg-[#222] text-[#555]'}`}>
                        {g.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
