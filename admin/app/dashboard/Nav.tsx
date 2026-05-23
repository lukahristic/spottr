'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/dashboard',            label: 'Settings'  },
  { href: '/dashboard/analytics',  label: 'Analytics' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 border-b border-[#222] mb-8">
      {tabs.map((t) => {
        const active = pathname === t.href
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active
                ? 'border-[#DFAF3A] text-white'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
