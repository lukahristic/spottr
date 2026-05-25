'use client'

import { useFormStatus } from 'react-dom'

export default function SubmitButton({
  label,
  pendingLabel,
  className,
  variant = 'primary',
}: {
  label: string
  pendingLabel: string
  className?: string
  variant?: 'primary' | 'danger' | 'ghost'
}) {
  const { pending } = useFormStatus()

  const base = 'font-bold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'w-full bg-[#DFAF3A] text-[#111111] py-3 px-5',
    danger:  'text-[#f87171] text-xs font-semibold hover:text-red-300',
    ghost:   'bg-[#1a3d2b] text-[#4ade80] text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-[#2B6B42]',
  }

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${base} ${variants[variant]} ${className ?? ''}`}
    >
      {pending ? pendingLabel : label}
    </button>
  )
}
