import { useCallback, useEffect, useRef, useState } from 'react'
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
import { Avatar, AvatarStyle } from '../../components/Avatar'
import { colors } from '../../.claude/tokens/colors'

type CheckIn = {
  id: string
  user_id: string | null
  name: string
  vibe: string
  custom_vibe: string | null
  open_to_chat: boolean
  women_only_mode: boolean
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
  const [avatarMap, setAvatarMap]       = useState<Record<string, { seed: string; style: AvatarStyle }>>({})

  const [myName, setMyName]               = useState<string | null>(null)
  const [myVibe, setMyVibe]               = useState<string | null>(null)
  const [myCustomVibe, setMyCustomVibe]   = useState<string | null>(null)
  const [myOpenToChat, setMyOpenToChat]   = useState(false)
  const [myWomenOnlyMode, setMyWomenOnlyMode] = useState(false)
  const myWomenOnlyModeRef = useRef(false)

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
      .select('id, gym_id, name, vibe, custom_vibe, open_to_chat, women_only_mode')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!myCheckin?.gym_id) {
      setIsCheckedIn(false)
      setCheckins([])
      setMyName(null)
      setMyVibe(null)
      setMyCustomVibe(null)
      setMyOpenToChat(false)
      setMyWomenOnlyMode(false)
      myWomenOnlyModeRef.current = false
      return null
    }

    setIsCheckedIn(true)
    setMyName(myCheckin.name)
    setMyVibe(myCheckin.vibe)
    setMyCustomVibe(myCheckin.custom_vibe)
    setMyOpenToChat(myCheckin.open_to_chat ?? false)
    const womenMode = myCheckin.women_only_mode ?? false
    setMyWomenOnlyMode(womenMode)
    myWomenOnlyModeRef.current = womenMode
    const gymId = myCheckin.gym_id

    const { data, error: dbError } = await supabase
      .from('checkins')
      .select('*')
      .eq('is_active', true)
      .eq('gym_id', gymId)
      .eq('women_only_mode', womenMode)
      .order('checked_in_at', { ascending: false })

    if (dbError) {
      setError('Could not load check-ins.')
      return gymId
    }

    setError(null)
    setCheckins(data as CheckIn[])

    const userIds = (data as CheckIn[]).map((c) => c.user_id).filter(Boolean) as string[]
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, avatar_seed, avatar_style')
        .in('id', userIds)
      const map: Record<string, { seed: string; style: AvatarStyle }> = {}
      for (const p of profiles ?? []) {
        map[p.id] = { seed: p.avatar_seed, style: (p.avatar_style as AvatarStyle) ?? 'thumbs' }
      }
      setAvatarMap(map)
    }

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
            const incoming = payload.new as CheckIn
            if (incoming.women_only_mode === myWomenOnlyModeRef.current) {
              setCheckins((prev) => [incoming, ...prev])
            }
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
          <Text style={styles.notCheckedInHeadline}>Who's here right now?</Text>
          <Text style={styles.notCheckedInSubtitle}>Check in to see who's training at your gym.</Text>
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
              {myOpenToChat ? (
                <View style={styles.opennessChip}>
                  <Text style={styles.opennessChipText}>Open to chat</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>You're first in.</Text>
            <Text style={styles.emptyHint}>Others will appear as they check in.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const time = relativeTime(item.checked_in_at)

          const avatarInfo = item.user_id ? avatarMap[item.user_id] : undefined

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => item.user_id && router.push(`/member/${item.id}`)}
              activeOpacity={0.7}
            >
              <Avatar
                seed={avatarInfo?.seed ?? item.user_id ?? item.id}
                name={item.name}
                size={44}
                avatarStyle={avatarInfo?.style ?? 'thumbs'}
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
                  <View style={styles.cardBottomRight}>
                    {item.open_to_chat ? (
                      <View style={styles.cardOpennessChip}>
                        <Text style={styles.cardOpennessChipText}>Open to chat</Text>
                      </View>
                    ) : null}
                    <Text style={styles.cardTime}>{time}</Text>
                  </View>
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
  cardBottomRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  cardOpennessChip: {
    backgroundColor: colors.statusOpen,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardOpennessChipText: { fontSize: 11, color: '#2B6B42', fontWeight: '500' },
  cardTime:      { fontSize: 12, color: colors.textSecondary, flexShrink: 0 },

  opennessChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.statusOpen,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 4,
  },
  opennessChipText: { fontSize: 12, color: '#2B6B42', fontWeight: '500' },
})
