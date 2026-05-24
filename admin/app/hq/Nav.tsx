'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/hq/analytics',     label: 'Analytics'     },
  { href: '/hq/gyms',          label: 'Gyms'          },
  { href: '/hq/partners',      label: 'Partners'      },
  { href: '/hq/verifications', label: 'Verifications' },
  { href: '/hq/reports',       label: 'Reports'       },
]

export default function HqNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 border-b border-[#222] mb-8 overflow-x-auto">
      {tabs.map((t) => {
        const active = pathname === t.href || pathname?.startsWith(t.href + '/')
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
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
