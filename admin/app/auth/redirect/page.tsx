'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type RoleRow = {
  gym_id: string | null
  role: string | null
  is_platform_admin: boolean | null
}

export default function AuthRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        redirectByRole(supabase, router)
      } else {
        router.replace('/')
      }
    })
  }, [router])

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-[#888] text-sm">Signing you in…</p>
    </main>
  )
}

async function redirectByRole(
  supabase: ReturnType<typeof createClient>,
  router: ReturnType<typeof useRouter>,
) {
  const { data: rows } = await supabase.rpc('get_my_role')
  const row = (rows as RoleRow[] | null)?.[0]

  if (row?.is_platform_admin) {
    router.replace('/hq')
  } else if (row?.gym_id) {
    router.replace('/partner')
  } else {
    router.replace('/auth/denied')
  }
}
