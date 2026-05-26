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
  Linking,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native'
import { QrCode } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { colors } from '../../.claude/tokens/colors'

type Vibe =
  | 'Locked in'
  | 'Finding my rhythm'
  | 'Taking it easy'
  | 'Quick session'
  | 'In between sets'
  | 'Just showing up'

type UserGym = {
  id: string        // user_gyms.id
  gym_id: string
  name: string
  location: string | null
  slug: string | null
  latitude: number | null
  longitude: number | null
  checkin_radius_m: number
  gym_code: string | null
  visit_count: number
  last_checkin_at: string | null
  visible_on_profile: boolean
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

export default function YourGymsScreen() {
  const [userGyms, setUserGyms]           = useState<UserGym[]>([])
  const [gymsLoading, setGymsLoading]     = useState(true)
  const [activeGym, setActiveGym]         = useState<UserGym | null>(null)
  const [checkedInGymId, setCheckedInGymId] = useState<string | null>(null)

  const [vibe, setVibe]                   = useState<Vibe>('Just showing up')
  const [customVibe, setCustomVibe]       = useState('')
  const [openToChat, setOpenToChat]       = useState(false)
  const [userName, setUserName]           = useState<string | null>(null)
  const [womenVerified, setWomenVerified] = useState(false)
  const [womenOnlyMode, setWomenOnlyMode] = useState(false)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  const [showLocationPrompt, setShowLocationPrompt]     = useState(false)
  const [gymCodeInput, setGymCodeInput]                 = useState('')
  const [showGymCodeFallback, setShowGymCodeFallback]   = useState(false)
  const [locationDenied, setLocationDenied]             = useState(false)
  const locationVerifiedRef = useRef(false)

  const [showManualCode, setShowManualCode]     = useState(false)
  const [manualCodeInput, setManualCodeInput]   = useState('')
  const [manualCodeError, setManualCodeError]   = useState<string | null>(null)
  const [manualCodeLoading, setManualCodeLoading] = useState(false)

  const placeholder = useMemo(
    () => VIBE_PLACEHOLDERS[Math.floor(Math.random() * VIBE_PLACEHOLDERS.length)],
    []
  )

  async function loadData() {
    setGymsLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setGymsLoading(false); return }

    const [profileRes, userGymsRes, checkinRes] = await Promise.all([
      supabase.from('profiles').select('name, women_verified').eq('id', user.id).maybeSingle(),
      supabase
        .from('user_gyms')
        .select(`
          id,
          gym_id,
          visit_count,
          last_checkin_at,
          visible_on_profile,
          gyms ( name, location, slug, latitude, longitude, checkin_radius_m, gym_code )
        `)
        .eq('user_id', user.id)
        .order('last_checkin_at', { ascending: false, nullsFirst: false }),
      supabase
        .from('checkins')
        .select('gym_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle(),
    ])

    setUserName(profileRes.data?.name ?? null)
    setWomenVerified(profileRes.data?.women_verified ?? false)
    setCheckedInGymId(checkinRes.data?.gym_id ?? null)

    const rows = (userGymsRes.data ?? []) as unknown as {
      id: string
      gym_id: string
      visit_count: number
      last_checkin_at: string | null
      visible_on_profile: boolean
      gyms: {
        name: string
        location: string | null
        slug: string | null
        latitude: number | null
        longitude: number | null
        checkin_radius_m: number
        gym_code: string | null
      } | null
    }[]

    const mapped: UserGym[] = rows
      .filter((r) => r.gyms !== null)
      .map((r) => ({
        id: r.id,
        gym_id: r.gym_id,
        name: r.gyms!.name,
        location: r.gyms!.location,
        slug: r.gyms!.slug,
        latitude: r.gyms!.latitude,
        longitude: r.gyms!.longitude,
        checkin_radius_m: r.gyms!.checkin_radius_m,
        gym_code: r.gyms!.gym_code,
        visit_count: r.visit_count,
        last_checkin_at: r.last_checkin_at,
        visible_on_profile: r.visible_on_profile,
      }))

    setUserGyms(mapped)
    setGymsLoading(false)
  }

  useFocusEffect(
    useCallback(() => {
      loadData()
      setActiveGym(null)
      setOpenToChat(false)
      setWomenOnlyMode(false)
      setGymCodeInput('')
      setShowGymCodeFallback(false)
      setLocationDenied(false)
      locationVerifiedRef.current = false
      setError(null)
    }, [])
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
    const gym = activeGym!
    if (gym.latitude === null || gym.longitude === null) return true

    const Location = require('expo-location') as typeof import('expo-location')
    const { status } = await Location.getForegroundPermissionsAsync()

    if (status === 'denied') {
      setShowGymCodeFallback(true)
      setLocationDenied(true)
      setError("Location is off. Enter the gym code to check in.")
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

    const dist = haversineMeters(coords.latitude, coords.longitude, gym.latitude, gym.longitude)

    if (dist > gym.checkin_radius_m) {
      setShowGymCodeFallback(true)
      setError(`You don't appear to be at ${gym.name}. Try the gym code instead.`)
      return false
    }

    return true
  }

  async function handleGymCode() {
    if (!activeGym) return
    if (gymCodeInput.trim().toLowerCase() !== (activeGym.gym_code ?? '').toLowerCase()) {
      setError("That code doesn't match. Ask the front desk.")
      return
    }
    setError(null)
    locationVerifiedRef.current = true
    await commitCheckIn()
  }

  async function handleCheckIn() {
    if (loading || !activeGym) return
    setLoading(true)
    setError(null)

    if (!locationVerifiedRef.current) {
      const verified = await doLocationCheck()
      if (!verified) { setLoading(false); return }
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

    const gym = activeGym!
    const now  = new Date().toISOString()

    const payload = {
      name:           userName,
      vibe,
      custom_vibe:    customVibe.trim() || null,
      open_to_chat:   openToChat,
      women_only_mode: womenVerified ? womenOnlyMode : false,
      gym_id:         gym.gym_id,
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

    if (dbError) {
      setError('Could not check in. Try again.')
      setLoading(false)
      return
    }

    // Only count a new visit on INSERT, not when updating an existing check-in
    if (!existing) {
      const isFirstCheckin = gym.last_checkin_at === null
      await supabase
        .from('user_gyms')
        .update({
          last_checkin_at:  now,
          first_checkin_at: isFirstCheckin ? now : undefined,
          visit_count:      gym.visit_count + 1,
        })
        .eq('id', gym.id)
    }

    setLoading(false)
    router.replace('/live')
  }

  async function handleLocationPromptAllow() {
    setShowLocationPrompt(false)
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
      setLocationDenied(true)
      setError("Location is off. Enter the gym code to check in.")
    }
  }

  async function handleManualCode() {
    const code = manualCodeInput.trim().toUpperCase()
    if (!code || manualCodeLoading) return
    setManualCodeLoading(true)
    setManualCodeError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setManualCodeLoading(false); return }

    const { data: gym } = await supabase
      .from('gyms')
      .select('id, name, location')
      .eq('gym_code', code)
      .eq('is_active', true)
      .maybeSingle()

    if (!gym) {
      setManualCodeError('Gym code not recognized.')
      setManualCodeLoading(false)
      return
    }

    const { error: upsertErr } = await supabase
      .from('user_gyms')
      .upsert({ user_id: user.id, gym_id: gym.id }, { onConflict: 'user_id,gym_id' })

    setManualCodeLoading(false)

    if (upsertErr) {
      setManualCodeError('Something went wrong. Try again.')
      return
    }

    setShowManualCode(false)
    setManualCodeInput('')
    loadData()
  }

  function handleLongPressGym(gym: UserGym) {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Remove gym from my list', 'Hide gym stats from profile'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) confirmRemoveGym(gym)
          if (idx === 2) hideGymStats(gym)
        }
      )
    } else {
      Alert.alert(gym.name, '', [
        { text: 'Remove gym from my list', style: 'destructive', onPress: () => confirmRemoveGym(gym) },
        { text: 'Hide gym stats from profile', onPress: () => hideGymStats(gym) },
        { text: 'Cancel', style: 'cancel' },
      ])
    }
  }

  function confirmRemoveGym(gym: UserGym) {
    Alert.alert(
      'Remove gym?',
      `${gym.name} will be removed from your list. Your check-in history is not deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('user_gyms').delete().eq('id', gym.id)
            setUserGyms((prev) => prev.filter((g) => g.id !== gym.id))
            if (activeGym?.id === gym.id) setActiveGym(null)
          },
        },
      ]
    )
  }

  async function hideGymStats(gym: UserGym) {
    await supabase.from('user_gyms').update({ visible_on_profile: false }).eq('id', gym.id)
    setUserGyms((prev) =>
      prev.map((g) => g.id === gym.id ? { ...g, visible_on_profile: false } : g)
    )
  }

  if (gymsLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  // ── Empty state ──
  if (userGyms.length === 0 && !activeGym) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyHeader}>
          <Text style={styles.screenTitle}>Your gyms</Text>
        </View>
        <View style={styles.emptyBody}>
          <Text style={styles.emptyTitle}>Your gym isn&apos;t on Spottr yet.</Text>
          <Text style={styles.emptySubtitle}>Scan your gym&apos;s QR to add it.</Text>

          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => router.push('/scan')}
            activeOpacity={0.85}
          >
            <QrCode size={20} color={colors.textPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.scanBtnText}>Scan Gym QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setShowManualCode(true); setManualCodeError(null) }}
            activeOpacity={0.7}
            style={styles.manualLink}
          >
            <Text style={styles.manualLinkText}>Add gym manually</Text>
          </TouchableOpacity>
        </View>

        <ManualCodeModal
          visible={showManualCode}
          value={manualCodeInput}
          onChange={setManualCodeInput}
          onSubmit={handleManualCode}
          onClose={() => { setShowManualCode(false); setManualCodeInput(''); setManualCodeError(null) }}
          loading={manualCodeLoading}
          error={manualCodeError}
        />
      </SafeAreaView>
    )
  }

  // ── Gym list + check-in ──
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
            <Text style={styles.modalTitle}>Verify your gym check-in</Text>
            <Text style={styles.modalBody}>
              Spottr uses your location only to confirm you&apos;re at the gym. Your location is never stored.
            </Text>
            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleLocationPromptAllow} activeOpacity={0.85}>
              <Text style={styles.modalPrimaryBtnText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setShowLocationPrompt(false); setShowGymCodeFallback(true); setError("Enter the gym code to check in without location.") }}
              activeOpacity={0.7}
            >
              <Text style={styles.modalSkipText}>Use gym code instead</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowLocationPrompt(false)} activeOpacity={0.7}>
              <Text style={styles.modalDismissText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ManualCodeModal
        visible={showManualCode}
        value={manualCodeInput}
        onChange={setManualCodeInput}
        onSubmit={handleManualCode}
        onClose={() => { setShowManualCode(false); setManualCodeInput(''); setManualCodeError(null) }}
        loading={manualCodeLoading}
        error={manualCodeError}
      />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.listHeader}>
          <Text style={styles.screenTitle}>Your gyms</Text>
          <TouchableOpacity onPress={() => router.push('/scan')} activeOpacity={0.7} style={styles.scanIconBtn}>
            <QrCode size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Gym cards */}
        <View style={styles.gymList}>
          {userGyms.map((gym) => {
            const isActive = activeGym?.id === gym.id
            const isCheckedIn = checkedInGymId === gym.gym_id

            return (
              <View key={gym.id}>
                <TouchableOpacity
                  style={[styles.gymCard, isActive && styles.gymCardActive]}
                  onPress={() => {
                    setActiveGym(isActive ? null : gym)
                    setGymCodeInput('')
                    setShowGymCodeFallback(false)
                    setLocationDenied(false)
                    locationVerifiedRef.current = false
                    setError(null)
                    setOpenToChat(false)
                    setWomenOnlyMode(false)
                  }}
                  onLongPress={() => handleLongPressGym(gym)}
                  activeOpacity={0.7}
                  delayLongPress={500}
                >
                  <View style={styles.gymCardBody}>
                    <View style={styles.gymCardTop}>
                      <Text style={styles.gymCardName}>{gym.name}</Text>
                      {isCheckedIn && <View style={styles.checkedInDot} />}
                    </View>
                    {gym.location ? <Text style={styles.gymCardLocation}>{gym.location}</Text> : null}
                    <View style={styles.gymCardMeta}>
                      {gym.visit_count > 0 && (
                        <Text style={styles.gymCardStat}>{gym.visit_count} visit{gym.visit_count === 1 ? '' : 's'}</Text>
                      )}
                      {gym.last_checkin_at && (
                        <Text style={styles.gymCardStat}>
                          Last: {new Date(gym.last_checkin_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Inline check-in form */}
                {isActive && (
                  <View style={styles.checkInForm}>
                    <Text style={styles.sectionLabel}>Today&apos;s vibe</Text>
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

                    <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Openness</Text>
                    <View style={styles.toggleRow}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.toggleLabel}>Open to chat</Text>
                        <Text style={styles.toggleHint}>Resets every visit. Always your choice.</Text>
                      </View>
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
                          <Text style={styles.toggleLabel}>Women&apos;s space</Text>
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
                    {locationDenied && (
                      <TouchableOpacity onPress={() => Linking.openSettings()} activeOpacity={0.7} style={styles.settingsLinkWrap}>
                        <Text style={styles.settingsLink}>Enable location in Settings</Text>
                      </TouchableOpacity>
                    )}

                    {!showGymCodeFallback && (
                      <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        disabled={loading}
                        onPress={handleCheckIn}
                        activeOpacity={0.8}
                      >
                        {loading
                          ? <ActivityIndicator color={colors.textPrimary} />
                          : <Text style={styles.buttonText}>I&apos;m in</Text>
                        }
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )
          })}
        </View>

        <TouchableOpacity
          onPress={() => { setShowManualCode(true); setManualCodeError(null) }}
          activeOpacity={0.7}
          style={styles.manualLink}
        >
          <Text style={styles.manualLinkText}>Add gym manually</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

function ManualCodeModal({
  visible, value, onChange, onSubmit, onClose, loading, error,
}: {
  visible: boolean
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  onClose: () => void
  loading: boolean
  error: string | null
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Add gym manually</Text>
          <Text style={styles.modalBody}>Enter the gym code from the front desk or Spottr poster.</Text>
          <TextInput
            style={styles.manualInput}
            placeholder="e.g. IRON24"
            placeholderTextColor={colors.textSecondary}
            value={value}
            onChangeText={(v) => onChange(v.toUpperCase())}
            autoCapitalize="characters"
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            autoFocus
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.modalPrimaryBtn, (!value.trim() || loading) && styles.buttonDisabled]}
            disabled={!value.trim() || loading}
            onPress={onSubmit}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={colors.textPrimary} />
              : <Text style={styles.modalPrimaryBtnText}>Add gym</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.modalDismissText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 24, paddingBottom: 48 },

  emptyHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 0,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptyBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  scanBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  manualLink: {
    marginTop: 16,
    alignSelf: 'center',
  },
  manualLinkText: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  manualInput: {
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
    width: '100%',
    marginBottom: 4,
  },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scanIconBtn: {
    padding: 6,
  },

  gymList: { gap: 10 },

  gymCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  gymCardActive: {
    borderColor: colors.accent,
  },
  gymCardBody: { gap: 4 },
  gymCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gymCardName:     { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  gymCardLocation: { fontSize: 13, color: colors.textSecondary },
  gymCardMeta:     { flexDirection: 'row', gap: 12, marginTop: 4 },
  gymCardStat:     { fontSize: 12, color: colors.textSecondary },
  checkedInDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },

  checkInForm: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 2,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },

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
    marginBottom: 12,
  },
  chip: {
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: { backgroundColor: colors.accent },
  chipText: { fontSize: 14, color: colors.textSecondary },
  chipTextSelected: { color: colors.textPrimary, fontWeight: '600' },

  customInput: {
    backgroundColor: colors.background,
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
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  toggleLabel: { fontSize: 14, color: colors.textPrimary },
  toggleHint:  { fontSize: 11, color: colors.textSecondary },

  gymCodeSection: { marginTop: 16, gap: 10 },
  gymCodeLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  gymCodeInput: {
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.textPrimary,
  },

  error: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 8,
    textAlign: 'center',
  },
  settingsLinkWrap: { alignSelf: 'center', marginTop: 4 },
  settingsLink: { fontSize: 13, color: colors.accent, textDecorationLine: 'underline' },

  button: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },

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
    gap: 12,
    width: '100%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  modalBody:  { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  modalPrimaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  modalPrimaryBtnText: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  modalSkipText:       { fontSize: 14, color: colors.textSecondary, textDecorationLine: 'underline' },
  modalDismissText:    { fontSize: 13, color: colors.textSecondary, opacity: 0.6, marginTop: 4 },
})
