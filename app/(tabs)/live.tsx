import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null)
    })
  }, [])

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
            <Text style={styles.heading}>Live</Text>
            <Text style={styles.subheading}>
              {gymName ? `Members at ${gymName} right now.` : 'Check in to see who\'s here.'}
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {isCheckedIn ? (
              <>
                <Text style={styles.emptyText}>You're the only one here.</Text>
                <Text style={styles.emptyHint}>Nobody else has checked in yet.</Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyText}>Not checked in.</Text>
                <Text style={styles.emptyHint}>Check in first to see who's here.</Text>
              </>
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
  heading:    { fontSize: 32, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  subheading: { fontSize: 15, color: '#888888' },
  error:      { fontSize: 14, color: '#EF4444', marginTop: 12 },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 80 },
  emptyText:  { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  emptyHint:  { fontSize: 14, color: '#555555' },
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
