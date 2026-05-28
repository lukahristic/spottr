import { supabase } from './supabase'

/*
 * Upload a profile photo (from a local Expo Camera URI) to Supabase Storage
 * and update the user's profiles row with the resulting URL.
 *
 * The path inside the bucket is constant — {user_id}/avatar.jpg — so re-uploads
 * overwrite. To bust caches across clients, the public URL we store on the
 * profile includes a ?v=<timestamp> query string that changes on each upload.
 *
 * Why FormData + supabase-js (and not a hand-rolled fetch)
 * ────────────────────────────────────────────────────────
 * Two earlier approaches both failed in React Native:
 *
 *   1. supabase.storage.upload(path, blob) where blob came from
 *      fetch(uri).blob() or arrayBuffer() — RN's runtime drops the binary
 *      when supabase-js wraps it. Server gets 0 bytes → 400.
 *
 *   2. Hand-rolled fetch() POST to /storage/v1/object/... with FormData and
 *      manually-set Authorization + apikey headers — on Android the native
 *      okhttp layer that handles multipart-with-file-uri rebuilds the
 *      request and silently drops the Authorization header. Server treats
 *      the request as anon → auth.uid() is NULL → RLS denies INSERT → 403.
 *
 * The fix: build FormData with the RN file-shape object (the only binary
 * form that survives the JS↔native bridge intact) AND let supabase-js own
 * the auth headers. supabase-js accepts FormData as a body type and
 * attaches Authorization + apikey via its internal request layer, so the
 * JWT actually reaches Storage and auth.uid() resolves for RLS.
 *
 * Returns the new URL on success, or an error message string on failure.
 */
export async function uploadProfilePhoto(
  localUri: string
): Promise<{ url: string; uploadedAt: string } | { error: string }> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return { error: 'Sign in first.' }
  const userId = session.user.id

  const path = `${userId}/avatar.jpg`

  // ── Diagnostic: prove auth is actually working with this session ──────────
  // We've been getting "RLS denies" on upload but can't tell whether the JWT
  // is arriving, valid, or carrying the right user. Three quick checks:
  //
  //   1. getUser() round-trips to auth-api with the access_token. If this
  //      fails, the token is invalid/expired and Storage will reject too.
  //   2. Decode the sub claim from the JWT and confirm it matches the
  //      session.user.id we're using to build the storage path.
  //   3. Read our own profiles row — that table has an RLS policy gated on
  //      auth.uid() = id. If this read succeeds, auth.uid() is resolving
  //      end-to-end against Postgres for THIS session. If Storage still
  //      rejects after that, the issue is Storage-specific, not auth.
  try {
    const token = session.access_token
    const payloadB64Url = token.split('.')[1] ?? ''
    const payloadB64 = payloadB64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = payloadB64 + '='.repeat((4 - (payloadB64.length % 4)) % 4)
    const decoded = JSON.parse(
      decodeURIComponent(
        atob(padded)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
    )
    console.log('[photo][diag] session.user.id =', userId)
    console.log('[photo][diag] jwt sub        =', decoded.sub)
    console.log('[photo][diag] jwt role       =', decoded.role)
    console.log('[photo][diag] jwt exp        =', new Date(decoded.exp * 1000).toISOString())
    console.log('[photo][diag] now            =', new Date().toISOString())
    console.log('[photo][diag] aud            =', decoded.aud)
    console.log('[photo][diag] iss            =', decoded.iss)
  } catch (e) {
    console.log('[photo][diag] jwt decode failed:', String(e))
  }

  const { data: getUserData, error: getUserErr } = await supabase.auth.getUser()
  console.log('[photo][diag] getUser ok =', !!getUserData?.user, 'err =', getUserErr?.message ?? 'none')

  const { data: profileProbe, error: probeErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()
  console.log('[photo][diag] profile self-read ok =', !!profileProbe, 'err =', probeErr?.message ?? 'none')

  // ── Actual upload ─────────────────────────────────────────────────────────

  // RN FormData with the file-shape object — this is the only form of
  // binary upload that survives the JS-to-native bridge intact.
  const formData = new FormData()
  formData.append('file', {
    uri: localUri,
    name: 'avatar.jpg',
    type: 'image/jpeg',
  } as unknown as Blob)

  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(path, formData as unknown as File, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (uploadError) {
    console.error('[photo] Upload failed:', uploadError.message)
    return { error: 'Upload failed. Try again.' }
  }

  // Build the public URL with a cache-busting timestamp.
  const { data: { publicUrl } } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(path)

  const uploadedAt = new Date().toISOString()
  const versionedUrl = `${publicUrl}?v=${Date.parse(uploadedAt)}`

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      photo_url: versionedUrl,
      photo_uploaded_at: uploadedAt,
    })
    .eq('id', userId)

  if (profileError) {
    console.error('[photo] Profile update failed:', profileError.message)
    return { error: 'Saved the photo but profile update failed. Try again.' }
  }

  return { url: versionedUrl, uploadedAt }
}

/*
 * Remove the user's photo from storage and clear the URL on their profile.
 * Useful for a "remove photo" action and for delete-account cleanup.
 */
export async function removeProfilePhoto(): Promise<{ ok: true } | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in first.' }

  const path = `${user.id}/avatar.jpg`

  // Best-effort delete; if the file doesn't exist, we still clear the URL.
  await supabase.storage.from('profile-photos').remove([path])

  const { error } = await supabase
    .from('profiles')
    .update({ photo_url: null, photo_uploaded_at: null })
    .eq('id', user.id)

  if (error) return { error: "Couldn't update your profile. Try again." }
  return { ok: true }
}
