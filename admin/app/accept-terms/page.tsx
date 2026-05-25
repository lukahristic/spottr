import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { acceptPartnerTerms } from './actions'
import SubmitButton from '@/components/SubmitButton'

export const dynamic = 'force-dynamic'

/*
 * Gym Partner Terms acceptance interstitial.
 *
 * The /partner layout redirects here whenever the current admin's
 * gym_admins row has partner_terms_accepted_at IS NULL. After
 * acceptance, the server action stamps the columns and bounces back
 * to /partner.
 *
 * IMPORTANT: this route lives OUTSIDE /partner/* on purpose. If it
 * were inside the partner shell, the partner layout would gate it
 * and trigger an infinite redirect loop.
 */

type RoleRow = {
  gym_id: string | null
  partner_terms_accepted_at: string | null
}

export default async function AcceptTermsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: adminRow } = await supabase
    .from('gym_admins')
    .select('gym_id, partner_terms_accepted_at')
    .eq('user_id', user.id)
    .maybeSingle<RoleRow>()

  if (!adminRow?.gym_id) redirect('/auth/redirect')

  // Already accepted — don't show the gate.
  if (adminRow.partner_terms_accepted_at) redirect('/partner')

  const params = await searchParams
  const hasError = params?.error === '1'

  return (
    <main className="min-h-screen text-white">
      <div className="max-w-2xl mx-auto p-6 pt-16">

        <p className="text-[#888] text-xs font-semibold tracking-widest uppercase mb-3">
          Spottr · Gym Partner
        </p>
        <h1 className="text-3xl font-bold mb-4">
          One quick agreement before you start.
        </h1>
        <p className="text-[#aaa] leading-relaxed mb-8">
          Before you access your gym&rsquo;s partner dashboard, please review
          and accept the Gym Partner Terms. They cover what Spottr provides,
          what gyms can and can&rsquo;t see about members, and how either side
          can end the relationship.
        </p>

        <a
          href="https://spottr.app/partner-terms"
          target="_blank"
          rel="noreferrer"
          className="inline-block mb-8 text-[#DFAF3A] underline underline-offset-2 hover:text-[#f0c560]"
        >
          Read the Gym Partner Terms →
        </a>

        {hasError && (
          <p className="mb-6 text-sm text-red-400 bg-red-900/20 rounded-lg px-4 py-3">
            Something went wrong saving your acceptance. Please try again.
          </p>
        )}

        <form action={acceptPartnerTerms} className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="agree"
              required
              className="mt-1.5 w-4 h-4 accent-[#DFAF3A]"
            />
            <span className="text-sm text-[#ccc] leading-relaxed">
              I have authority to bind this gym to these terms, and I agree to the Gym Partner Terms on behalf of the gym.
            </span>
          </label>

          <SubmitButton label="Accept and continue" pendingLabel="Saving…" />
        </form>

        <p className="text-xs text-[#666] mt-8 leading-relaxed">
          If you don&rsquo;t have authority to accept on behalf of the gym, please
          hand this invitation to someone who does. Questions:{' '}
          <a href="mailto:partners@spottr.app" className="text-[#888] hover:text-white">
            partners@spottr.app
          </a>
          .
        </p>
      </div>
    </main>
  )
}
