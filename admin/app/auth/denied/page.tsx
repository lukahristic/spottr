import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export default function DeniedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-white text-xl font-bold mb-2">Access denied</h1>
        <p className="text-[#888] text-sm">Your account doesn&apos;t have gym admin or platform admin access.</p>
        <form action={signOut} className="mt-6">
          <button type="submit" className="text-[#888] text-sm underline">Sign out</button>
        </form>
      </div>
    </main>
  )
}
