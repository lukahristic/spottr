import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'

type Gym = {
  id: string
  name: string
  location: string
  slug: string
  is_active: boolean
}

export default function GymLandingScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()

  const [gym, setGym]         = useState<Gym | null>(null)
  const [count, setCount]     = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('gyms')
        .select('id, name, location, slug, is_active')
        .eq('slug', slug)
        .maybeSingle()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setGym(data as Gym)

      const { count: liveCount } = await supabase
        .from('checkins')
        .select('id', { count: 'exact', head: true })
        .eq('gym_id', data.id)
        .eq('is_active', true)

      setCount(liveCount ?? 0)
      setLoading(false)
    }

    load()
  }, [slug])

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#FFFFFF" size="large" />
        </View>
      </SafeAreaView>
    )
  }

  if (notFound || !gym) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.stateTitle}>Gym not found.</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!gym.is_active) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.stateTitle}>This gym is no longer active.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.gymCard}>
          <Text style={styles.gymName}>{gym.name}</Text>
          <Text style={styles.gymLocation}>{gym.location}</Text>

          <View style={styles.countRow}>
            <View style={styles.countDot} />
            <Text style={styles.countText}>
              {count === 0
                ? 'No one checked in yet'
                : count === 1
                ? '1 member here now'
                : `${count} members here now`}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkInButton}
          onPress={() =>
            router.navigate({ pathname: '/(tabs)', params: { gymSlug: gym.slug } })
          }
          activeOpacity={0.85}
        >
          <Text style={styles.checkInButtonText}>Check In Here</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#111111' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  container: { flex: 1, padding: 24 },
  back:      { marginBottom: 32 },
  backText:  { fontSize: 15, color: '#888888' },
  stateTitle: { fontSize: 16, fontWeight: '500', color: '#666666' },
  gymCard: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 16,
    padding: 24,
    gap: 8,
    marginBottom: 24,
  },
  gymName:     { fontSize: 26, fontWeight: '700', color: '#FFFFFF' },
  gymLocation: { fontSize: 14, color: '#888888' },
  countRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  countDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  countText:   { fontSize: 14, color: '#22C55E', fontWeight: '500' },
  checkInButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkInButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: 0.3,
  },
})
