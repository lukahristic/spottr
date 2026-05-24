'use client'

import { useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { createClient } from '@/lib/supabase/client'

export default function PosterPage() {
  const [gymName, setGymName] = useState<string | null>(null)
  const [slug, setSlug]       = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: rows } = await supabase.rpc('get_my_role')
      const gymId = (rows as { gym_id: string | null }[] | null)?.[0]?.gym_id
      if (!gymId) { setLoading(false); return }

      const { data: gym } = await supabase
        .from('gyms')
        .select('name, slug')
        .eq('id', gymId)
        .maybeSingle()

      setGymName(gym?.name ?? null)
      setSlug(gym?.slug ?? null)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return null

  if (!slug) return (
    <div style={{ padding: 48, fontFamily: 'sans-serif', color: '#111', textAlign: 'center' }}>
      Generate a QR code first from your dashboard before printing the poster.
    </div>
  )

  const qrValue = `spottr://gym/${slug}`

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: #fff; }
        }
        body { background: #f9f9f9; }
      `}</style>

      {/* Print button — hidden on print */}
      <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }}>
        <button
          onClick={() => window.print()}
          style={{
            background: '#111', color: '#fff', fontSize: 14, fontWeight: 600,
            borderRadius: 12, padding: '10px 20px', border: 'none', cursor: 'pointer',
          }}
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Poster */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', padding: '48px 32px',
        background: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.5px', color: '#111' }}>
            spottr
          </div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
            Find your people at the gym
          </div>
        </div>

        {/* QR code */}
        <div style={{
          background: '#fff', padding: 20, borderRadius: 16,
          boxShadow: '0 2px 24px rgba(0,0,0,0.10)', marginBottom: 32,
        }}>
          <QRCodeCanvas
            value={qrValue}
            size={320}
            bgColor="#FFFFFF"
            fgColor="#111111"
            level="M"
            includeMargin={false}
          />
        </div>

        {/* Gym name */}
        <div style={{ fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 16, textAlign: 'center' }}>
          {gymName}
        </div>

        {/* Instructions */}
        <div style={{ maxWidth: 340, textAlign: 'center', color: '#555', fontSize: 16, lineHeight: 1.6 }}>
          Scan to add this gym to your Spottr.
          <br />
          Once added, tap <strong style={{ color: '#111' }}>&ldquo;I&apos;m in&rdquo;</strong> when you arrive.
        </div>

        {/* App store hint */}
        <div style={{
          marginTop: 40, padding: '12px 24px', background: '#f5f5f5',
          borderRadius: 12, fontSize: 12, color: '#888', textAlign: 'center',
        }}>
          Don&apos;t have Spottr yet? Download it from the App Store or Google Play.
        </div>
      </div>
    </>
  )
}
