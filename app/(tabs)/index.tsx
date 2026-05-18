import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'

type Status = 'happy_to_help' | 'need_guidance' | 'just_training'
type Goal =
  | 'Learning the basics'
  | 'Finding a training partner'
  | 'Hitting my own program'
  | 'Open to anything'

type Gym = {
  id: string
  name: string
  slug: string
  location: string
}

const STATUSES: { key: Status; label: string; color: string }[] = [
  { key: 'happy_to_help', label: 'Happy to Help', color: '#22C55E' },
  { key: 'need_guidance',  label: 'Need Guidance',  color: '#EAB308' },
  { key: 'just_training',  label: 'Just Training',  color: '#3B82F6' },
]

const GOALS: Goal[] = [
  'Learning the basics',
  'Finding a training partner',
  'Hitting my own program',
  'Open to anything',
]

export default function CheckInScreen() {
  const { gymSlug } = useLocalSearchParams<{ gymSlug?: string }>()

  const [name, setName]           = useState('')
  const [status, setStatus]       = useState<Status | null>(null)
  const [goal, setGoal]           = useState<Goal | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Gym list state (home state)
  const [gyms, setGyms]           = useState<Gym[]>([])
  const [gymsLoading, setGymsLoading] = useState(true)

  // Selected gym — set from gymSlug param or existing active checkin
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null)
  const [resolving, setResolving] = useState(true)

  // Load name from user metadata once
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const savedName = user?.user_metadata?.name
      if (savedName) setName(savedName)
    })
  }, [])

  // Load all active gyms for the gym list
  useEffect(() => {
    supabase
      .from('gyms')
      .select('id, name, slug, location')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setGyms((data as Gym[]) ?? [])
        setGymsLoading(false)
      })
  }, [])

  // Resolve which gym to show in the form:
  // 1. gymSlug param from deep link → look up that gym
  // 2. User already has an active checkin → use that gym
  // 3. Neither → show gym list
  useFocusEffect(
    useCallback(() => {
      async function resolve() {
        setResolving(true)

        if (gymSlug) {
          const { data } = await supabase
            .from('gyms')
            .select('id, name, slug, location')
            .eq('slug', gymSlug)
            .eq('is_active', true)
            .maybeSingle()

          setSelectedGym(data as Gym | null)
          setResolving(false)
          return
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setSelectedGym(null)
          setResolving(false)
          return
        }

        const { data: existing } = await supabase
          .from('checkins')
          .select('gym_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle()

        if (existing?.gym_id) {
          const { data: gym } = await supabase
            .from('gyms')
            .select('id, name, slug, location')
            .eq('id', existing.gym_id)
            .maybeSingle()

          setSelectedGym(gym as Gym | null)
        } else {
          setSelectedGym(null)
        }

        setResolving(false)
      }

      resolve()
    }, [gymSlug])
  )

  const canCheckIn = name.trim().length > 0 && status !== null && goal !== null && selectedGym !== null

  async function handleCheckIn() {
    if (!canCheckIn || loading || !selectedGym) return
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Not signed in. Please sign in again.')
      setLoading(false)
      return
    }

    const { data: existing } = await supabase
      .from('checkins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    const { error: dbError } = existing
      ? await supabase
          .from('checkins')
          .update({ name: name.trim(), status, goal, gym_id: selectedGym.id })
          .eq('id', existing.id)
      : await supabase
          .from('checkins')
          .insert({ name: name.trim(), status, goal, user_id: user.id, gym_id: selectedGym.id })

    setLoading(false)

    if (dbError) {
      setError('Could not check in. Try again.')
      return
    }

    router.replace('/live')
  }

  // Loading state while resolving gym
  if (resolving || gymsLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#FFFFFF" size="large" />
        </View>
      </SafeAreaView>
    )
  }

  // Home state: no gym selected — show gym list
  if (!selectedGym) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Your Gym</Text>
          <Text style={styles.subheading}>Choose a gym to get started.</Text>


          {gyms.length === 0 ? (
            <Text style={styles.noGyms}>No gyms available.</Text>
          ) : (
            <View style={styles.gymList}>
              {gyms.map((gym) => (
                <TouchableOpacity
                  key={gym.id}
                  style={styles.gymCard}
                  onPress={() => router.push(`/gym/${gym.slug}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.gymCardBody}>
                    <Text style={styles.gymCardName}>{gym.name}</Text>
                    <Text style={styles.gymCardLocation}>{gym.location}</Text>
                  </View>
                  <Text style={styles.gymCardArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    )
  }

  // Form state: gym selected
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Check In</Text>
        <Text style={styles.subheading}>Let others know you're here.</Text>

        {/* Gym chip — locked */}
        <View style={styles.gymChip}>
          <Text style={styles.gymChipLabel}>📍</Text>
          <View style={styles.gymChipInfo}>
            <Text style={styles.gymChipName}>{selectedGym.name}</Text>
            <Text style={styles.gymChipLocation}>{selectedGym.location}</Text>
          </View>
        </View>

        <Text style={styles.label}>1 · Your Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Alex"
          placeholderTextColor="#555"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="done"
          editable={!loading}
        />

        <Text style={styles.label}>2 · Today's Status</Text>
        <View style={styles.optionGroup}>
          {STATUSES.map((s) => {
            const selected = status === s.key
            return (
              <TouchableOpacity
                key={s.key}
                style={[
                  styles.optionCard,
                  selected && { borderColor: s.color, backgroundColor: `${s.color}18` },
                ]}
                onPress={() => setStatus(s.key)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <View style={[styles.optionDot, { backgroundColor: s.color }]} />
                <Text style={[styles.optionLabel, selected && { color: s.color }]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <Text style={styles.label}>3 · Today's Goal</Text>
        <View style={styles.optionGroup}>
          {GOALS.map((g) => {
            const selected = goal === g
            return (
              <TouchableOpacity
                key={g}
                style={[styles.optionCard, selected && styles.optionCardSelected]}
                onPress={() => setGoal(g)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {g}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, (!canCheckIn || loading) && styles.buttonDisabled]}
          disabled={!canCheckIn || loading}
          onPress={handleCheckIn}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#111111" />
            : <Text style={styles.buttonText}>Check In</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#111111' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 24, paddingBottom: 48 },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 15,
    color: '#888888',
    marginBottom: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },
  noGyms: { fontSize: 15, color: '#555555' },
  gymList: { gap: 10 },
  gymCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 14,
    padding: 18,
    gap: 12,
  },
  gymCardBody:     { flex: 1, gap: 3 },
  gymCardName:     { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  gymCardLocation: { fontSize: 13, color: '#666666' },
  gymCardArrow:    { fontSize: 20, color: '#444444' },
  gymChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    marginBottom: 28,
  },
  gymChipLabel:    { fontSize: 18 },
  gymChipInfo:     { flex: 1, gap: 2 },
  gymChipName:     { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  gymChipLocation: { fontSize: 13, color: '#666666' },
  input: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 28,
  },
  optionGroup: {
    gap: 10,
    marginBottom: 28,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  optionCardSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF18',
  },
  optionDot: { width: 10, height: 10, borderRadius: 5 },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#AAAAAA',
  },
  optionLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  error: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: 0.3,
  },
})
