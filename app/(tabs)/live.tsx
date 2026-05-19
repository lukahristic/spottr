import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/Avatar'

type Status = 'happy_to_help' | 'need_guidance' | 'just_training'

type CheckIn = {
  id: string
  user_id: string | null
  name: string
  status: Status
  goal: string
  checked_in_at: string
  is_active: boolean
  gym_id: string
}

const STATUSES: { key: Status; label: string; color: string; confirm: string }[] = [
  { key: 'happy_to_help', label: 'Happy to Help', color: '#22C55E', confirm: "You're now open to helping." },
  { key: 'need_guidance',  label: 'Need Guidance',  color: '#EAB308', confirm: "You're looking for guidance." },
  { key: 'just_training',  label: 'Just Training',  color: '#3B82F6', confirm: "You're in training mode." },
]

const STATUS_META: Record<Status, { label: string; color: string }> = {
  happy_to_help: { label: 'Happy to Help', color: '#22C55E' },
  need_guidance:  { label: 'Need Guidance',  color: '#EAB308' },
  just_training:  { label: 'Just Training',  color: '#3B82F6' },
}

function relativeTime(checkedInAt: string): { label: string; warn: boolean } {
  const mins = Math.floor((Date.now() - new Date(checkedInAt).getTime()) / 60_000)
  if (mins < 5)    return { label: 'Just now',                         warn: false }
  if (mins < 60)   return { label: `${mins} mins ago`,                 warn: false }
  if (mins >= 150) return { label: 'Leaving soon',                     warn: true  }
  return                  { label: `${Math.floor(mins / 60)} hrs ago`, warn: false }
}

export default function LiveListScreen() {
  const [checkins, setCheckins]           = useState<CheckIn[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [gymName, setGymName]             = useState<string | null>(null)
  const [isCheckedIn, setIsCheckedIn]     = useState(false)
  const [loading, setLoading]             = useState(true)
  const [refreshing, setRefreshing]       = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [blockedIds, setBlockedIds]       = useState<Set<string>>(new Set())

  const [myStatus, setMyStatus]           = useState<Status | null>(null)
  const [myCheckinId, setMyCheckinId]     = useState<string | null>(null)
  const [pickerVisible, setPickerVisible] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [toast, setToast]                 = useState<string | null>(null)

  const liveDotOpacity = useRef(new Animated.Value(1)).current
  const toastOpacity   = useRef(new Animated.Value(0)).current

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null)
    })
  }, [])

  useEffect(() => {
    if (!isCheckedIn) return
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(liveDotOpacity, { toValue: 0.2, duration: 900, useNativeDriver: true }),
        Animated.timing(liveDotOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [isCheckedIn])

  function showToast(message: string) {
    setToast(message)
    toastOpacity.setValue(0)
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setToast(null))
  }

  async function fetchCheckins(): Promise<string | null> {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('checkins')
      .update({ is_active: false })
      .eq('is_active', true)
      .lt('checked_in_at', threeHoursAgo)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: myCheckin } = await supabase
      .from('checkins')
      .select('id, gym_id, status')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!myCheckin?.gym_id) {
      setIsCheckedIn(false)
      setCheckins([])
      setGymName(null)
      setMyStatus(null)
      setMyCheckinId(null)
      return null
    }

    setIsCheckedIn(true)
    setMyStatus(myCheckin.status as Status)
    setMyCheckinId(myCheckin.id)
    const gymId = myCheckin.gym_id

    const { data: gymData } = await supabase
      .from('gyms')
      .select('name')
      .eq('id', gymId)
      .maybeSingle()

    setGymName(gymData?.name ?? null)

    const { data, error: dbError } = await supabase
      .from('checkins')
      .select('*')
      .eq('is_active', true)
      .eq('gym_id', gymId)
      .order('checked_in_at', { ascending: false })

    if (dbError) {
      setError('Could not load check-ins.')
      return gymId
    }

    setError(null)
    setCheckins(data as CheckIn[])
    return gymId
  }

  async function handleStatusChange(newStatus: Status) {
    if (newStatus === myStatus || statusLoading || !myCheckinId) {
      setPickerVisible(false)
      return
    }

    const previousStatus = myStatus
    setPickerVisible(false)
    setMyStatus(newStatus)
    setStatusLoading(true)

    const { error: dbError } = await supabase
      .from('checkins')
      .update({ status: newStatus })
      .eq('id', myCheckinId)

    setStatusLoading(false)

    if (dbError) {
      setMyStatus(previousStatus)
      showToast('Something went wrong. Try again.')
      return
    }

    const match = STATUSES.find(s => s.key === newStatus)
    showToast(match?.confirm ?? 'Status updated.')
  }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchCheckins()
    setRefreshing(false)
  }

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function init() {
      const gymId = await fetchCheckins()
      setLoading(false)
      if (!gymId) return

      channel = supabase
        .channel(`checkins-live-${gymId}-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'checkins', filter: `gym_id=eq.${gymId}` },
          (payload) => {
            setCheckins((prev) => [payload.new as CheckIn, ...prev])
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'checkins', filter: `gym_id=eq.${gymId}` },
          (payload) => {
            const updated = payload.new as CheckIn
            if (!updated.is_active) {
              setCheckins((prev) => prev.filter((c) => c.id !== updated.id))
            } else {
              setCheckins((prev) =>
                prev.map((c) => c.id === updated.id ? { ...c, status: updated.status } : c)
              )
            }
          }
        )
        .subscribe()
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      async function fetchBlocks() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const [{ data: myBlocks }, { data: blockedMe }] = await Promise.all([
          supabase.from('blocks').select('blocked_user_id').eq('blocker_id', user.id),
          supabase.from('blocks').select('blocker_id').eq('blocked_user_id', user.id),
        ])

        setBlockedIds(new Set([
          ...(myBlocks?.map((b) => b.blocked_user_id) ?? []),
          ...(blockedMe?.map((b) => b.blocker_id) ?? []),
        ]))
      }

      fetchBlocks()
    }, [])
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#FFFFFF" size="large" />
        </View>
      </SafeAreaView>
    )
  }

  const visibleCheckins = checkins.filter(
    (c) => c.user_id && c.user_id !== currentUserId && !blockedIds.has(c.user_id)
  )

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={visibleCheckins}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headingRow}>
              <Text style={styles.heading}>Live</Text>
              {isCheckedIn && (
                <View style={styles.liveBadge}>
                  <Animated.View style={[styles.liveBadgeDot, { opacity: liveDotOpacity }]} />
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              )}
            </View>
            <Text style={styles.subheading}>
              {gymName ? `Members at ${gymName} right now.` : "Check in to see who's here."}
            </Text>
            {isCheckedIn && myStatus && (
              <TouchableOpacity
                style={styles.statusPill}
                onPress={() => setPickerVisible(true)}
                activeOpacity={0.7}
                disabled={statusLoading}
              >
                <View style={[styles.statusPillDot, { backgroundColor: STATUS_META[myStatus].color }]} />
                <Text style={[styles.statusPillLabel, { color: STATUS_META[myStatus].color }]}>
                  {STATUS_META[myStatus].label}
                </Text>
                <Text style={styles.statusPillCaret}>›</Text>
              </TouchableOpacity>
            )}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {isCheckedIn ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🏋️</Text>
                <Text style={styles.emptyText}>You're the first here.</Text>
                <Text style={styles.emptyHint}>Others will show up as they check in.</Text>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>⚡</Text>
                <Text style={styles.emptyText}>Nobody visible yet.</Text>
                <Text style={styles.emptyHint}>Check in to see who's at your gym.</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/')}>
                  <Text style={styles.emptyButtonText}>Check In</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const meta = STATUS_META[item.status]
          const time = relativeTime(item.checked_in_at)

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => item.user_id && router.push(`/member/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardAvatarWrap}>
                <Avatar seed={item.user_id ?? item.id} name={item.name} size={40} />
                <View style={[styles.cardStatusDot, { backgroundColor: meta.color }]} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardNameRow}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={[styles.cardStatus, { color: meta.color }]}>
                    {meta.label}
                  </Text>
                </View>
                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardGoal} numberOfLines={1}>{item.goal}</Text>
                  <Text style={[styles.cardTime, time.warn && styles.cardTimeWarn]}>
                    {time.label}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )
        }}
      />

      {/* Status picker bottom sheet */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setPickerVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>How are you training today?</Text>
            {STATUSES.map((s) => {
              const isActive = myStatus === s.key
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.sheetOption,
                    isActive && { borderColor: s.color, backgroundColor: `${s.color}18` },
                  ]}
                  onPress={() => handleStatusChange(s.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sheetDot, { backgroundColor: s.color }]} />
                  <Text style={[styles.sheetLabel, isActive && { color: '#FFFFFF', fontWeight: '600' }]}>
                    {s.label}
                  </Text>
                  {isActive && <Text style={[styles.sheetCheck, { color: s.color }]}>✓</Text>}
                </TouchableOpacity>
              )
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Toast confirmation */}
      {toast && (
        <Animated.View pointerEvents="none" style={[styles.toast, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#111111' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:   { padding: 24, paddingBottom: 48, flexGrow: 1 },
  header: { marginBottom: 24 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  heading:    { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveBadgeDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  liveBadgeText: { fontSize: 10, fontWeight: '700', color: '#22C55E', letterSpacing: 1 },
  subheading: { fontSize: 15, color: '#888888', marginBottom: 16 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 4,
  },
  statusPillDot:   { width: 8, height: 8, borderRadius: 4 },
  statusPillLabel: { fontSize: 13, fontWeight: '600' },
  statusPillCaret: { fontSize: 16, color: '#444444', marginLeft: 2 },
  error: { fontSize: 14, color: '#EF4444', marginTop: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 20,
    padding: 32,
    gap: 8,
    width: '100%',
  },
  emptyIcon:       { fontSize: 36, marginBottom: 4 },
  emptyText:       { fontSize: 17, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' },
  emptyHint:       { fontSize: 14, color: '#555555', textAlign: 'center' },
  emptyButton: {
    backgroundColor: '#FFD54A',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 12,
  },
  emptyButtonText: { fontSize: 14, fontWeight: '700', color: '#111111' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 14,
  },
  cardAvatarWrap: { position: 'relative', flexShrink: 0 },
  cardStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: '#111111',
  },
  cardBody:     { flex: 1, gap: 6 },
  cardNameRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardName:     { fontSize: 16, fontWeight: '600', color: '#FFFFFF', flexShrink: 1 },
  cardStatus:   { fontSize: 12, fontWeight: '600', flexShrink: 0 },
  cardMetaRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardGoal:     { fontSize: 13, color: '#888888', flex: 1 },
  cardTime:     { fontSize: 12, color: '#555555', flexShrink: 0 },
  cardTimeWarn: { color: '#EAB308' },
  // Bottom sheet
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 24,
    paddingBottom: 40,
    gap: 10,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333333',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  sheetDot:   { width: 10, height: 10, borderRadius: 5 },
  sheetLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#AAAAAA' },
  sheetCheck: { fontSize: 14, fontWeight: '700' },
  // Toast
  toast: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  toastText: { fontSize: 14, fontWeight: '500', color: '#FFFFFF' },
})
