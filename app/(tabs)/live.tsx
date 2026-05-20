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
import { Pencil, Zap } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/Avatar'
import { colors } from '../../.claude/tokens/colors'

type CheckIn = {
  id: string
  user_id: string | null
  name: string
  vibe: string
  custom_vibe: string | null
  open_to_chat: boolean
  checked_in_at: string
  is_active: boolean
  gym_id: string
}

function relativeTime(checkedInAt: string): string {
  const mins = Math.floor((Date.now() - new Date(checkedInAt).getTime()) / 60_000)
  if (mins < 5)    return 'Just now'
  if (mins < 60)   return `${mins} mins ago`
  if (mins >= 150) return 'Leaving soon'
  return `${Math.floor(mins / 60)} hrs ago`
}

export default function LiveListScreen() {
  const [checkins, setCheckins]         = useState<CheckIn[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isCheckedIn, setIsCheckedIn]   = useState(false)
  const [loading, setLoading]           = useState(true)
  const [refreshing, setRefreshing]     = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [blockedIds, setBlockedIds]     = useState<Set<string>>(new Set())
  const [myName, setMyName]             = useState<string | null>(null)
  const [myVibe, setMyVibe]             = useState<string | null>(null)
  const [myCustomVibe, setMyCustomVibe] = useState<string | null>(null)

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
      .select('id, gym_id, name, vibe, custom_vibe')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!myCheckin?.gym_id) {
      setIsCheckedIn(false)
      setCheckins([])
      setMyName(null)
      setMyVibe(null)
      setMyCustomVibe(null)
      return null
    }

    setIsCheckedIn(true)
    setMyName(myCheckin.name)
    setMyVibe(myCheckin.vibe)
    setMyCustomVibe(myCheckin.custom_vibe)
    const gymId = myCheckin.gym_id

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
            } else {
              setCheckins((prev) =>
                prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
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
      async function refresh() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await fetchCheckins()

        const [{ data: myBlocks }, { data: blockedMe }] = await Promise.all([
          supabase.from('blocks').select('blocked_user_id').eq('blocker_id', user.id),
          supabase.from('blocks').select('blocker_id').eq('blocked_user_id', user.id),
        ])

        setBlockedIds(new Set([
          ...(myBlocks?.map((b) => b.blocked_user_id) ?? []),
          ...(blockedMe?.map((b) => b.blocker_id) ?? []),
        ]))
      }

      refresh()
    }, [])
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  if (!isCheckedIn) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notCheckedIn}>
          <Zap size={40} color={colors.accent} />
          <Text style={styles.notCheckedInHeadline}>No one visible yet.</Text>
          <Text style={styles.notCheckedInSubtitle}>Check in first to see who's here.</Text>
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => router.push('/')}
            activeOpacity={0.85}
          >
            <Text style={styles.checkInButtonText}>Check In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const visibleCheckins = checkins.filter(
    (c) => c.user_id && c.user_id !== currentUserId && !blockedIds.has(c.user_id)
  )

  const myVibeDisplay = myCustomVibe || myVibe

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
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.push('/')}
              activeOpacity={0.7}
            >
              <Text style={styles.headerName}>{myName ?? 'You'}</Text>
              {myVibeDisplay ? (
                <View style={styles.headerVibeRow}>
                  <Text style={styles.headerVibe}>{myVibeDisplay}</Text>
                  <Pencil size={14} color={colors.textSecondary} strokeWidth={1.75} style={{ marginLeft: 4 }} />
                </View>
              ) : null}
            </TouchableOpacity>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>You're the first here.</Text>
            <Text style={styles.emptyHint}>Others will show up as they check in.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const time = relativeTime(item.checked_in_at)

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => item.user_id && router.push(`/member/${item.id}`)}
              activeOpacity={0.7}
            >
              <Avatar
                seed={item.user_id ?? item.id}
                name={item.name}
                size={44}
                bg={colors.accent}
                fg={colors.textPrimary}
              />
              <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.cardVibeBadge}>
                    <Text style={styles.cardVibeBadgeText}>{item.vibe}</Text>
                  </View>
                </View>
                <View style={styles.cardBottomRow}>
                  {item.custom_vibe ? (
                    <Text style={styles.cardVibeText} numberOfLines={1}>{item.custom_vibe}</Text>
                  ) : (
                    <View style={styles.cardVibeTextPlaceholder} />
                  )}
                  <Text style={styles.cardTime}>{time}</Text>
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
  safe:   { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  notCheckedIn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  notCheckedInHeadline: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 8,
  },
  notCheckedInSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  checkInButton: {
    backgroundColor: '#DFAF3A',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  checkInButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  list:   { padding: 24, paddingBottom: 48, flexGrow: 1 },
  header: { marginBottom: 28 },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerVibeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerVibe: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  error: { fontSize: 14, color: '#EF4444', marginTop: 12 },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    gap: 8,
  },
  emptyText: { fontSize: 17, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
  emptyHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    gap: 12,
  },
  cardBody:    { flex: 1, gap: 4 },
  cardTopRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardName:    { fontSize: 15, fontWeight: '600', color: colors.textPrimary, flexShrink: 1 },
  cardVibeBadge: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
  },
  cardVibeBadgeText: { fontSize: 12, color: colors.textSecondary },
  cardBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardVibeText:  { fontSize: 13, color: colors.textSecondary, flex: 1 },
  cardVibeTextPlaceholder: { flex: 1 },
  cardTime:      { fontSize: 12, color: colors.textSecondary, flexShrink: 0 },
})
