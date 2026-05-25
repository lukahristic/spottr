'use client'

import { useRef, useState, useTransition } from 'react'

export default function LogoUpload({
  currentUrl,
  action,
}: {
  currentUrl: string | null
  action: (formData: FormData) => Promise<{ error?: string }>
}) {
  const formRef   = useRef<HTMLFormElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [error, setError]     = useState<string | null>(null)

  function handleFile(file: File) {
    const localUrl = URL.createObjectURL(file)
    setError(null)

    const fd = new FormData()
    fd.append('logo', file)

    startTransition(async () => {
      const result = await action(fd)
      if (result.error) {
        setError(result.error)
        // revert preview to whatever was confirmed before
        setPreview(currentUrl)
      } else {
        setPreview(localUrl)
      }
      // reset input so the same file can be re-selected after an error
      if (inputRef.current) inputRef.current.value = ''
    })
  }

  return (
    <div>
      <form ref={formRef}>
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

          <div className="flex flex-col gap-2">
            <label className="cursor-pointer">
              <input
                ref={inputRef}
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={pending}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
              <span className={`inline-block text-white text-sm rounded-xl px-4 py-2 border border-[#222] transition-colors ${
                pending
                  ? 'bg-[#111] text-[#666] cursor-not-allowed'
                  : 'bg-[#1C1C1C] hover:bg-[#222] cursor-pointer'
              }`}>
                {pending ? 'Uploading…' : currentUrl ? 'Replace logo' : 'Upload logo'}
              </span>
            </label>

            {error && (
              <p className="text-red-400 text-xs max-w-xs">{error}</p>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
