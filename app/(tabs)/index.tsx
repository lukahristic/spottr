import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { colors } from '../../.claude/tokens/colors'

type Vibe =
  | 'Locked in'
  | 'Finding my rhythm'
  | 'Taking it easy'
  | 'Quick session'
  | 'In between sets'
  | 'Just showing up'

type Gym = {
  id: string
  name: string
  slug: string
  location: string
}

const VIBES: Vibe[] = [
  'Locked in',
  'Finding my rhythm',
  'Taking it easy',
  'Quick session',
  'In between sets',
  'Just showing up',
]

const VIBE_PLACEHOLDERS = [
  'leg day, send prayers',
  'cardio? unfortunately',
  'winging it today',
  'pretending I have a plan',
  'first time, be nice',
  'lost but committed',
  'Google said this works',
  'manifesting the gains',
  'not quitting, just resting',
  'figuring it out slowly',
]

export default function CheckInScreen() {
  const { gymSlug } = useLocalSearchParams<{ gymSlug?: string }>()

  const [name, setName]               = useState('')
  const [vibe, setVibe]               = useState<Vibe>('Just showing up')
  const [customVibe, setCustomVibe]   = useState('')
  const [openToChat, setOpenToChat]   = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const [gyms, setGyms]               = useState<Gym[]>([])
  const [gymsLoading, setGymsLoading] = useState(true)
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null)
  const [resolving, setResolving]     = useState(true)

  const placeholder = useMemo(
    () => VIBE_PLACEHOLDERS[Math.floor(Math.random() * VIBE_PLACEHOLDERS.length)],
    []
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const savedName = user?.user_metadata?.name
      if (savedName) setName(savedName)
    })
  }, [])

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

  useFocusEffect(
    useCallback(() => {
      async function resolve() {
        setResolving(true)
        setOpenToChat(false)

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

  async function handleCheckIn() {
    if (loading || !selectedGym) return
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Not signed in. Please sign in again.')
      setLoading(false)
      return
    }

    const payload = {
      name: name.trim(),
      vibe,
      custom_vibe: customVibe.trim() || null,
      open_to_chat: openToChat,
      gym_id: selectedGym.id,
    }

    const { data: existing } = await supabase
      .from('checkins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    const { error: dbError } = existing
      ? await supabase.from('checkins').update(payload).eq('id', existing.id)
      : await supabase.from('checkins').insert({ ...payload, user_id: user.id })

    setLoading(false)

    if (dbError) {
      setError('Could not check in. Try again.')
      return
    }

    router.replace('/live')
  }

  if (resolving || gymsLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  if (!selectedGym) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Where are you training today?</Text>
          <Text style={styles.subheading}>Pick your gym to get started.</Text>

          {gyms.length === 0 ? (
            <Text style={styles.noGyms}>No gyms available yet.</Text>
          ) : (
            <View style={styles.gymList}>
              {gyms.map((gym) => (
                <TouchableOpacity
                  key={gym.id}
                  style={styles.gymListCard}
                  onPress={() => router.push(`/gym/${gym.slug}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.gymCardBody}>
                    <Text style={styles.gymCardName}>{gym.name}</Text>
                    <Text style={styles.gymCardLocation}>{gym.location}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.gymSelectedCard}>
          <View style={styles.gymCardBody}>
            <Text style={styles.gymCardName}>{selectedGym.name}</Text>
            <Text style={styles.gymCardLocation}>{selectedGym.location}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Today's vibe</Text>
        <View style={styles.chipRow}>
          {VIBES.map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.chip, vibe === v && styles.chipSelected]}
              onPress={() => setVibe(v)}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={[styles.chipText, vibe === v && styles.chipTextSelected]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.customInput}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={customVibe}
          onChangeText={(t) => setCustomVibe(t.slice(0, 30))}
          maxLength={30}
          returnKeyType="done"
          editable={!loading}
        />
        <Text style={styles.charCount}>{customVibe.length}/30</Text>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Openness</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Open to chat</Text>
          <Switch
            value={openToChat}
            onValueChange={setOpenToChat}
            trackColor={{ false: '#C8C2BB', true: colors.accent }}
            thumbColor="#FFFFFF"
            disabled={loading}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          disabled={loading}
          onPress={handleCheckIn}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color={colors.textPrimary} />
            : <Text style={styles.buttonText}>I'm in</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 24, paddingBottom: 48 },

  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  noGyms: { fontSize: 15, color: colors.textSecondary },

  gymList: { gap: 10 },
  gymListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 12,
  },
  gymSelectedCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 28,
  },
  gymCardBody:     { flex: 1, gap: 3 },
  gymCardName:     { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  gymCardLocation: { fontSize: 13, color: colors.textSecondary },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: colors.accent,
  },
  chipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.textPrimary,
    fontWeight: '600',
  },

  customInput: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.textPrimary,
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 4,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: colors.textPrimary,
  },

  error: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },

  button: {
    backgroundColor: '#DFAF3A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
})
