'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'

type RoleRow = {
  gym_id: string | null
  role: string | null
  is_platform_admin: boolean | null
}

type Stage = 'loading' | 'set-password' | 'redirecting'

export default function AuthRedirectPage() {
  const router = useRouter()
  const [stage, setStage]     = useState<Stage>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)

  // Capture invite context BEFORE the Supabase client processes and clears
  // the URL hash. useState initializer is synchronous (runs before useEffect).
  // Also accept ?from=invite passed by the sign-in page when it catches the hash first.
  const [isInviteFlow] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const hashType   = new URLSearchParams(window.location.hash.slice(1)).get('type')
    const queryFrom  = new URLSearchParams(window.location.search).get('from')
    return hashType === 'invite' || queryFrom === 'invite'
  })

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && sess) {
        if (isInviteFlow) {
          setSession(sess)
          setStage('set-password')
          return
        }
        setStage('redirecting')
        await redirectByRole(supabase, router)
      } else if (event === 'INITIAL_SESSION' && !sess) {
        router.replace('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, isInviteFlow])

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: updateErr } = await supabase.auth.updateUser({ password })
    if (updateErr) {
      setError(updateErr.message)
      setSaving(false)
      return
    }
    setStage('redirecting')
    await redirectByRole(supabase, router)
  }

  if (stage === 'set-password') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-white mb-1">Set your password</h1>
          <p className="text-[#888] text-sm mb-2">
            Welcome to Spottr. Create a password to secure your account.
          </p>
          <p className="text-[#555] text-xs mb-6">{session?.user.email}</p>

          <form onSubmit={handleSetPassword} className="space-y-3">
            <input
              type="password"
              placeholder="New password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-[#1C1C1C] text-white placeholder-[#555] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full bg-[#1C1C1C] text-white placeholder-[#555] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#DFAF3A] text-[#111111] font-bold rounded-xl py-3 text-sm disabled:opacity-50 mt-2"
            >
              {saving ? 'Saving…' : 'Set password & continue'}
            </button>
          </form>
        </div>
      </main>
    )
  }

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
