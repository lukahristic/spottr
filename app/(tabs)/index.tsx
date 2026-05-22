import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LocationObject } from 'expo-location'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Modal,
} from 'react-native'
import { ChevronRight, MapPin } from 'lucide-react-native'
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
  latitude: number | null
  longitude: number | null
  checkin_radius_m: number
  gym_code: string | null
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
  const [womenVerified, setWomenVerified] = useState(false)
  const [womenOnlyMode, setWomenOnlyMode] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const [gyms, setGyms]               = useState<Gym[]>([])
  const [gymsLoading, setGymsLoading] = useState(true)
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null)
  const [resolving, setResolving]     = useState(true)

  const [showLocationPrompt, setShowLocationPrompt] = useState(false)
  const [gymCodeInput, setGymCodeInput]             = useState('')
  const [showGymCodeFallback, setShowGymCodeFallback] = useState(false)
  const locationVerifiedRef = useRef(false)

  const placeholder = useMemo(
    () => VIBE_PLACEHOLDERS[Math.floor(Math.random() * VIBE_PLACEHOLDERS.length)],
    []
  )

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const savedName = user.user_metadata?.name
      if (savedName) setName(savedName)

      const { data: profile } = await supabase
        .from('profiles')
        .select('women_verified')
        .eq('id', user.id)
        .maybeSingle()
      setWomenVerified(profile?.women_verified ?? false)
    })
  }, [])

  useEffect(() => {
    supabase
      .from('gyms')
      .select('id, name, slug, location, latitude, longitude, checkin_radius_m, gym_code')
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
        setWomenOnlyMode(false)
        setGymCodeInput('')
        setShowGymCodeFallback(false)
        locationVerifiedRef.current = false

        if (gymSlug) {
          const { data } = await supabase
            .from('gyms')
            .select('id, name, slug, location, latitude, longitude, checkin_radius_m, gym_code')
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
            .select('id, name, slug, location, latitude, longitude, checkin_radius_m, gym_code')
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

  function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6_371_000
    const toRad = (d: number) => (d * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  async function doLocationCheck(): Promise<boolean> {
    const gym = selectedGym!
    if (gym.latitude === null || gym.longitude === null) return true

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Location = require('expo-location') as typeof import('expo-location')
    const { status } = await Location.getForegroundPermissionsAsync()

    if (status === 'denied') {
      setShowGymCodeFallback(true)
      setError("Location access was denied. Enter the gym code to check in.")
      return false
    }

    if (status === 'undetermined') {
      setShowLocationPrompt(true)
      return false
    }

    let coords: { latitude: number; longitude: number } | null = null
    try {
      const timeout = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 8_000)
      )
      const result = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        timeout,
      ]) as LocationObject
      coords = result.coords
    } catch {
      setShowGymCodeFallback(true)
      setError("Couldn't get your location. Enter the gym code instead.")
      return false
    }

    if (!coords) return false

    const dist = haversineMeters(
      coords.latitude,
      coords.longitude,
      gym.latitude,
      gym.longitude
    )

    if (dist > gym.checkin_radius_m) {
      setShowGymCodeFallback(true)
      setError(`You don't appear to be at ${gym.name}. Try the gym code instead.`)
      return false
    }

    return true
  }

  async function handleGymCode() {
    if (!selectedGym) return
    if (gymCodeInput.trim().toLowerCase() !== (selectedGym.gym_code ?? '').toLowerCase()) {
      setError("That code doesn't match. Ask the front desk for today's code.")
      return
    }
    setError(null)
    locationVerifiedRef.current = true
    await commitCheckIn()
  }

  async function handleCheckIn() {
    if (loading || !selectedGym) return
    setLoading(true)
    setError(null)

    if (!locationVerifiedRef.current) {
      const verified = await doLocationCheck()
      if (!verified) {
        setLoading(false)
        return
      }
      locationVerifiedRef.current = true
    }

    await commitCheckIn()
  }

  async function commitCheckIn() {
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
      women_only_mode: womenVerified ? womenOnlyMode : false,
      gym_id: selectedGym!.id,
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

  async function handleLocationPromptAllow() {
    setShowLocationPrompt(false)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Location = require('expo-location') as typeof import('expo-location')
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status === 'granted') {
      setLoading(true)
      const verified = await doLocationCheck()
      if (verified) {
        locationVerifiedRef.current = true
        await commitCheckIn()
      } else {
        setLoading(false)
      }
    } else {
      setShowGymCodeFallback(true)
      setError("Location access was denied. Enter the gym code to check in.")
    }
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
      <Modal
        visible={showLocationPrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationPrompt(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <MapPin size={28} color={colors.accent} />
            <Text style={styles.modalTitle}>Verify your gym check-in</Text>
            <Text style={styles.modalBody}>
              Spottr uses your location only to confirm you're at the gym. Your location is never stored.
            </Text>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={handleLocationPromptAllow}
              activeOpacity={0.85}
            >
              <Text style={styles.modalPrimaryBtnText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowLocationPrompt(false)
                setShowGymCodeFallback(true)
                setError("Enter the gym code to check in without location.")
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.modalSkipText}>Use gym code instead</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

        {womenVerified && (
          <View style={[styles.toggleRow, { marginTop: 8 }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.toggleLabel}>Women's space</Text>
              <Text style={styles.toggleHint}>Only visible to other verified women</Text>
            </View>
            <Switch
              value={womenOnlyMode}
              onValueChange={setWomenOnlyMode}
              trackColor={{ false: '#C8C2BB', true: colors.accent }}
              thumbColor="#FFFFFF"
              disabled={loading}
            />
          </View>
        )}

        {showGymCodeFallback && (
          <View style={styles.gymCodeSection}>
            <Text style={styles.gymCodeLabel}>Gym code</Text>
            <TextInput
              style={styles.gymCodeInput}
              placeholder="Ask the front desk"
              placeholderTextColor={colors.textSecondary}
              value={gymCodeInput}
              onChangeText={setGymCodeInput}
              autoCapitalize="none"
              returnKeyType="done"
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.button, (!gymCodeInput.trim() || loading) && styles.buttonDisabled]}
              disabled={!gymCodeInput.trim() || loading}
              onPress={handleGymCode}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color={colors.textPrimary} />
                : <Text style={styles.buttonText}>Check in with code</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!showGymCodeFallback && (
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
        )}
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
  toggleHint: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  error: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },

  gymCodeSection: {
    marginTop: 24,
    gap: 10,
  },
  gymCodeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  gymCodeInput: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.textPrimary,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  modalPrimaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  modalPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSkipText: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
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
