import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Spottr Admin',
  description: 'Gym admin panel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#111111] antialiased">{children}</body>
    </html>
  )
}
