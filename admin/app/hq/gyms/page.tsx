import { createClient } from '@/lib/supabase/server'
import { CreateGymForm } from './CreateGymForm'

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
        <CreateGymForm />
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
