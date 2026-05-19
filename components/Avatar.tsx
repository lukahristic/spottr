import { View, Text } from 'react-native'

const PALETTE = [
  { bg: '#1A2E1A', fg: '#22C55E' },
  { bg: '#1A1F2E', fg: '#3B82F6' },
  { bg: '#251A2E', fg: '#A855F7' },
  { bg: '#2E1A25', fg: '#EC4899' },
  { bg: '#2E211A', fg: '#F97316' },
  { bg: '#1A282E', fg: '#06B6D4' },
  { bg: '#2E2A1A', fg: '#FFD54A' },
  { bg: '#2E1A1A', fg: '#EF4444' },
]

function hashSeed(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

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

type Props = {
  seed: string
  name: string
  size?: number
}

export function Avatar({ seed, name, size = 40 }: Props) {
  const { bg, fg } = PALETTE[hashSeed(seed) % PALETTE.length]
  const initials   = getInitials(name)
  const fontSize   = Math.round(size * 0.34)

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize, fontWeight: '700', color: fg }}>{initials}</Text>
    </View>
  )
}
