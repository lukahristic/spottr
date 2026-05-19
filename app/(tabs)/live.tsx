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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'

type CheckIn = {
  id: string
  user_id: string | null
  name: string
  status: 'happy_to_help' | 'need_guidance' | 'just_training'
  goal: string
  checked_in_at: string
  is_active: boolean
  gym_id: string
}

const STATUS_META: Record<CheckIn['status'], { label: string; color: string }> = {
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
  const liveDotOpacity = useRef(new Animated.Value(1)).current

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
      .select('gym_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!myCheckin?.gym_id) {
      setIsCheckedIn(false)
      setCheckins([])
      setGymName(null)
      return null
    }

    setIsCheckedIn(true)
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

  // Fetch blocks on every focus so the list updates immediately after blocking someone
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
              {gymName ? `Members at ${gymName} right now.` : 'Check in to see who\'s here.'}
            </Text>
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
              <View style={[styles.dot, { backgroundColor: meta.color }]} />
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
  liveBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  liveBadgeText: { fontSize: 10, fontWeight: '700', color: '#22C55E', letterSpacing: 1 },
  subheading: { fontSize: 15, color: '#888888' },
  error:      { fontSize: 14, color: '#EF4444', marginTop: 12 },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
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
  emptyIcon: { fontSize: 36, marginBottom: 4 },
  emptyText:  { fontSize: 17, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' },
  emptyHint:  { fontSize: 14, color: '#555555', textAlign: 'center' },
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
  dot:           { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  cardBody:      { flex: 1, gap: 6 },
  cardNameRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardName:      { fontSize: 16, fontWeight: '600', color: '#FFFFFF', flexShrink: 1 },
  cardStatus:    { fontSize: 12, fontWeight: '600', flexShrink: 0 },
  cardMetaRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardGoal:      { fontSize: 13, color: '#888888', flex: 1 },
  cardTime:      { fontSize: 12, color: '#555555', flexShrink: 0 },
  cardTimeWarn:  { color: '#EAB308' },
})
