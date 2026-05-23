'use client'

import { QRCodeCanvas } from 'qrcode.react'
import { useRef, useState } from 'react'

export default function QRCode({
  value,
  filename = 'spottr-qr.png',
}: {
  value: string
  filename?: string
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  function download() {
    const canvas = wrapperRef.current?.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  async function copyLink() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div ref={wrapperRef} className="bg-white p-5 rounded-2xl">
        <QRCodeCanvas
          value={value}
          size={280}
          bgColor="#FFFFFF"
          fgColor="#111111"
          level="M"
          includeMargin={false}
        />
      </div>

      <p className="text-[#888] text-xs font-mono break-all max-w-sm text-center">{value}</p>

      <div className="flex gap-3">
        <button
          onClick={download}
          className="bg-[#DFAF3A] text-[#111111] font-bold text-sm rounded-xl px-5 py-2.5"
        >
          Download PNG
        </button>
        <button
          onClick={copyLink}
          className="bg-[#1C1C1C] hover:bg-[#222] text-white text-sm rounded-xl px-5 py-2.5 border border-[#222]"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}
