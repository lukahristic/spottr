'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Stage = 'password' | 'request-code' | 'verify-code' | 'set-password'

export default function SignInPage() {
  const router = useRouter()
  const [stage, setStage]       = useState<Stage>('password')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [code, setCode]         = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [notice, setNotice]     = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  // If a session already exists, hand off to the role router.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/auth/redirect')
    })
  }, [router])

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password. First time here? Use a sign-in code instead.')
      setLoading(false)
      return
    }
    router.replace('/auth/redirect')
  }

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    // shouldCreateUser:false — only invited partners (already provisioned) get a code.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
    setLoading(false)
    // Always advance + show a neutral message (avoids leaking who's invited).
    if (error && error.status !== 422) {
      setError(error.message)
      return
    }
    setNotice(`If ${email} was invited, a sign-in code is on its way.`)
    setStage('verify-code')
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    })
    if (error || !data.session) {
      setError('That code is invalid or expired. Request a new one.')
      setLoading(false)
      return
    }
    // First-time partners have no password yet — make them set one.
    if (data.user?.user_metadata?.password_set) {
      router.replace('/auth/redirect')
      return
    }
    setLoading(false)
    setNotice(null)
    setStage('set-password')
  }

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
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password,
      data: { password_set: true },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.replace('/auth/redirect')
  }

  const inputClass =
    'w-full bg-[#1C1C1C] text-white placeholder-[#555] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]'
  const buttonClass =
    'w-full bg-[#DFAF3A] text-[#111111] font-bold rounded-xl py-3 text-sm disabled:opacity-50 mt-2'

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-1">Spottr Admin</h1>

        {stage === 'password' && (
          <>
            <p className="text-[#888] text-sm mb-8">Sign in to manage your gym.</p>
            <form onSubmit={handleSignIn} className="space-y-3">
              <input type="email" placeholder="Email" value={email} required
                onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              <input type="password" placeholder="Password" value={password} required
                onChange={(e) => setPassword(e.target.value)} className={inputClass} />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className={buttonClass}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <button
              type="button"
              onClick={() => { setError(null); setStage('request-code') }}
              className="w-full text-[#DFAF3A] text-sm mt-4 hover:underline"
            >
              First time, or no password yet? Email me a code
            </button>
          </>
        )}

        {stage === 'request-code' && (
          <>
            <p className="text-[#888] text-sm mb-8">
              Enter your email and we&apos;ll send you a sign-in code.
            </p>
            <form onSubmit={handleRequestCode} className="space-y-3">
              <input type="email" placeholder="Email" value={email} required
                onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className={buttonClass}>
                {loading ? 'Sending…' : 'Email me a code'}
              </button>
            </form>
            <button
              type="button"
              onClick={() => { setError(null); setStage('password') }}
              className="w-full text-[#888] text-sm mt-4 hover:underline"
            >
              Back to password sign-in
            </button>
          </>
        )}

        {stage === 'verify-code' && (
          <>
            <p className="text-[#888] text-sm mb-2">Enter the code we emailed you.</p>
            {notice && <p className="text-[#DFAF3A] text-xs mb-6">{notice}</p>}
            <form onSubmit={handleVerifyCode} className="space-y-3">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                placeholder="12345678"
                value={code}
                required
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className={`${inputClass} tracking-[0.4em] text-center`}
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className={buttonClass}>
                {loading ? 'Verifying…' : 'Verify & continue'}
              </button>
            </form>
            <button
              type="button"
              onClick={() => { setError(null); setCode(''); setStage('request-code') }}
              className="w-full text-[#888] text-sm mt-4 hover:underline"
            >
              Didn&apos;t get it? Send a new code
            </button>
          </>
        )}

        {stage === 'set-password' && (
          <>
            <p className="text-[#888] text-sm mb-1">Welcome to Spottr. Set a password to secure your account.</p>
            <p className="text-[#555] text-xs mb-6">{email}</p>
            <form onSubmit={handleSetPassword} className="space-y-3">
              <input type="password" placeholder="New password (min 8 chars)" value={password}
                required minLength={8} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
              <input type="password" placeholder="Confirm password" value={confirm}
                required onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className={buttonClass}>
                {loading ? 'Saving…' : 'Set password & continue'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
