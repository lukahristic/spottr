import { useState } from 'react'
import { View, Text, Image } from 'react-native'

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

function dicebearUrl(seed: string, size: number): string {
  return `https://api.dicebear.com/9.x/thumbs/png?seed=${encodeURIComponent(seed)}&size=${size * 2}`
}

type Props = {
  seed: string
  name: string
  size?: number
  bg?: string
  fg?: string
}

export function Avatar({ seed, name, size = 40, bg = '#2E211A', fg = '#F97316' }: Props) {
  const [failed, setFailed] = useState(false)
  const initials = getInitials(name)
  const fontSize = Math.round(size * 0.34)

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
      {failed ? (
        <Text style={{ fontSize, fontWeight: '700', color: fg }}>{initials}</Text>
      ) : (
        <Image
          source={{ uri: dicebearUrl(seed, size) }}
          style={{ width: size, height: size }}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  )
}
