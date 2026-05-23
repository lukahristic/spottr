import { createClient } from '@/lib/supabase/server'
import QRCode from '@/components/QRCode'
import { generateSlug } from '../actions'

export const dynamic = 'force-dynamic'

type RoleRow = { gym_id: string | null }

export default async function PartnerQrPage() {
  const supabase = await createClient()
  const { data: rows } = await supabase.rpc('get_my_role')
  const gymId = (rows as RoleRow[] | null)?.[0]?.gym_id
  if (!gymId) return null

  const { data: gym } = await supabase
    .from('gyms')
    .select('id, name, slug')
    .eq('id', gymId)
    .maybeSingle()

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-xl font-bold">Your gym QR code</h2>
        <p className="text-[#888] text-sm mt-0.5">Print this and place it at reception. Members scan with their phone to find your gym in Spottr.</p>
      </div>

      <section className="bg-[#1C1C1C] rounded-2xl p-8">
        {gym?.slug ? (
          <QRCode value={`spottr://gym/${gym.slug}`} filename={`spottr-${gym.slug}.png`} />
        ) : (
          <div className="text-center">
            <p className="text-white font-medium mb-2">No QR code yet</p>
            <p className="text-[#888] text-sm mb-6">Generate a unique link for your gym to create your QR code.</p>
            <form action={generateSlug}>
              <button
                type="submit"
                className="bg-[#DFAF3A] text-[#111111] font-bold text-sm rounded-xl px-5 py-2.5"
              >
                Generate QR code
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  )
}
