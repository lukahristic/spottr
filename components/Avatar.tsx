import { useState } from 'react'
import { View, Text, Image } from 'react-native'

export type AvatarStyle = 'thumbs' | 'avataaars-neutral' | 'personas'

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  )
}

function dicebearUrl(seed: string, size: number, avatarStyle: AvatarStyle): string {
  return `https://api.dicebear.com/9.x/${avatarStyle}/png?seed=${encodeURIComponent(seed)}&size=${size * 2}`
}

type Props = {
  seed: string
  name: string
  size?: number
  bg?: string
  fg?: string
  avatarStyle?: AvatarStyle
  /*
   * If set, render this URL (a user-uploaded selfie) instead of the
   * Dicebear-generated avatar. Falls back to the generated avatar if
   * the photo URL fails to load, and to initials if both fail.
   */
  photoUrl?: string | null
}

export function Avatar({
  seed,
  name,
  size = 40,
  bg = '#2E211A',
  fg = '#F97316',
  avatarStyle = 'thumbs',
  photoUrl,
}: Props) {
  const [photoFailed, setPhotoFailed] = useState(false)
  const [generatedFailed, setGeneratedFailed] = useState(false)
  const initials = getInitials(name)
  const fontSize = Math.round(size * 0.34)

  // Three-tier rendering: real photo → generated avatar → initials.
  // Each step only kicks in if the previous one failed to load.
  const showPhoto = !!photoUrl && !photoFailed
  const showGenerated = !showPhoto && !generatedFailed

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {showPhoto ? (
        <Image
          source={{ uri: photoUrl! }}
          style={{ width: size, height: size }}
          onError={() => setPhotoFailed(true)}
        />
      ) : showGenerated ? (
        <Image
          source={{ uri: dicebearUrl(seed, size, avatarStyle) }}
          style={{ width: size, height: size }}
          onError={() => setGeneratedFailed(true)}
        />
      ) : (
        <Text style={{ fontSize, fontWeight: '700', color: fg }}>{initials}</Text>
      )}
    </View>
  )
}
