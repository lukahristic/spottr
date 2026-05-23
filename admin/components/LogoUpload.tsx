'use client'

import { useRef, useState, useTransition } from 'react'

export default function LogoUpload({
  currentUrl,
  action,
}: {
  currentUrl: string | null
  action: (formData: FormData) => Promise<void>
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(currentUrl)

  return (
    <form ref={formRef} action={(fd) => startTransition(() => action(fd))}>
      <div className="flex items-center gap-4">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Gym logo"
            className="w-20 h-20 rounded-2xl object-cover bg-[#111]"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-[#111] flex items-center justify-center text-[#444] text-xs">
            No logo
          </div>
        )}

        <label className="cursor-pointer">
          <input
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) {
                setPreview(URL.createObjectURL(f))
                formRef.current?.requestSubmit()
              }
            }}
          />
          <span className="inline-block bg-[#1C1C1C] hover:bg-[#222] text-white text-sm rounded-xl px-4 py-2 border border-[#222]">
            {pending ? 'Uploading…' : currentUrl ? 'Replace logo' : 'Upload logo'}
          </span>
        </label>
      </div>
    </form>
  )
}
