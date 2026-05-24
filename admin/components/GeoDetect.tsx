'use client'

import { useState } from 'react'

type Props = {
  initialAddress: string
  initialLat: string
  initialLng: string
}

export default function GeoDetect({ initialAddress, initialLat, initialLng }: Props) {
  const [address, setAddress]   = useState(initialAddress)
  const [lat, setLat]           = useState(initialLat)
  const [lng, setLng]           = useState(initialLng)
  const [status, setStatus]     = useState<'idle' | 'loading' | 'found' | 'notfound'>('idle')

  async function detect() {
    if (!address.trim()) return
    setStatus('loading')
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
        { headers: { 'User-Agent': 'Spottr/1.0' } }
      )
      const results = await res.json()
      if (results[0]) {
        setLat(parseFloat(results[0].lat).toFixed(6))
        setLng(parseFloat(results[0].lon).toFixed(6))
        setStatus('found')
      } else {
        setStatus('notfound')
      }
    } catch {
      setStatus('notfound')
    }
  }

  const inputClass = 'w-full bg-[#111] text-white placeholder-[#444] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#DFAF3A]'

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[#888] text-xs block mb-1.5">Address</label>
        <div className="flex gap-2">
          <input
            name="address"
            value={address}
            onChange={e => { setAddress(e.target.value); setStatus('idle') }}
            placeholder="Street, city"
            className={inputClass}
          />
          <button
            type="button"
            onClick={detect}
            disabled={status === 'loading' || !address.trim()}
            className="shrink-0 bg-[#2A2A2A] text-white text-xs font-semibold rounded-xl px-3 py-2.5 whitespace-nowrap disabled:opacity-40 hover:bg-[#333] transition-colors"
          >
            {status === 'loading' ? 'Detecting…' : 'Detect coordinates'}
          </button>
        </div>
        {status === 'found' && (
          <p className="text-[#4CAF50] text-xs mt-1.5">Coordinates detected.</p>
        )}
        {status === 'notfound' && (
          <p className="text-[#EF5350] text-xs mt-1.5">Address not found. Try a more specific address.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[#888] text-xs block mb-1.5">Latitude</label>
          <input
            name="latitude"
            type="number"
            step="any"
            value={lat}
            onChange={e => setLat(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-[#888] text-xs block mb-1.5">Longitude</label>
          <input
            name="longitude"
            type="number"
            step="any"
            value={lng}
            onChange={e => setLng(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  )
}
