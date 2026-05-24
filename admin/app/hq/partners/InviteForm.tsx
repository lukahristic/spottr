'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { invitePartner } from '../actions'

type Gym = { id: string; name: string }
type InviteState = { success?: boolean; resent?: boolean; existing?: boolean; email?: string; error?: string } | null

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-[#DFAF3A] text-[#111111] font-bold rounded-xl py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
    >
      {pending ? 'Sending…' : 'Send invite'}
    </button>
  )
}

export function InviteForm({ gyms }: { gyms: Gym[] }) {
  const [state, action] = useActionState(invitePartner, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state])

  return (
    <section className="bg-[#1C1C1C] rounded-2xl p-6 mb-5">
      <h2 className="font-semibold text-base mb-1">Invite partner</h2>
      <p className="text-[#888] text-xs mb-4">
        Enter their email — we&apos;ll email them a sign-in code. They don&apos;t need a Spottr account first.
      </p>

      {state?.success && (
        <div className="mb-4 rounded-xl bg-green-950 border border-green-800 px-4 py-3 text-sm text-green-400">
          {state.existing ? (
            <><span className="font-semibold">{state.email}</span> already has an account — partner access granted. They can sign in now.</>
          ) : state.resent ? (
            <>Invite re-sent to <span className="font-semibold">{state.email}</span>.</>
          ) : (
            <>Invite sent to <span className="font-semibold">{state.email}</span>.</>
          )}
        </div>
      )}
      {state?.error && (
        <div className="mb-4 rounded-xl bg-red-950 border border-red-900 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <form ref={formRef} action={action} className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="email"
          name="email"
          required
          placeholder="owner@theirgym.com"
          className="bg-[#111] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A] placeholder:text-[#444]"
        />
        <select
          name="gym_id"
          required
          defaultValue=""
          className="bg-[#111] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
        >
          <option value="" disabled>Gym…</option>
          {gyms.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <select
          name="role"
          defaultValue="owner"
          className="bg-[#111] text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]"
        >
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
        </select>
        <SubmitButton />
      </form>
    </section>
  )
}
