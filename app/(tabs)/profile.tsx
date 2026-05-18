import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { Thread, ThreadWithMeta, UserStatus } from '../../types/messaging'

type BlockedUser = {
  blockedUserId: string
  name: string
}

const STATUS_COLOR: Record<string, string> = {
  happy_to_help: '#22C55E',
  need_guidance:  '#EAB308',
  just_training:  '#3B82F6',
}

function formatTime(ts: string): string {
  const date = new Date(ts)
  const now  = new Date()
  const diffMs   = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)   return date.toLocaleDateString([], { weekday: 'short' })
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function ProfileScreen() {
  const [user, setUser]                       = useState<User | null>(null)
  const [threads, setThreads]                 = useState<ThreadWithMeta[]>([])
  const [activeCheckinId, setActiveCheckinId] = useState<string | null>(null)
  const [loadingThreads, setLoadingThreads]   = useState(false)
  const [checkingOut, setCheckingOut]         = useState(false)
  const [signingOut, setSigningOut]           = useState(false)
  const [blockedUsers, setBlockedUsers]       = useState<BlockedUser[]>([])
  const [unblockingId, setUnblockingId]       = useState<string | null>(null)
  const userRef = useRef<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      userRef.current = user
    })
  }, [])

  // Realtime: patch threads in state when latest_message_at / unread counts change.
  // Two channels needed because Supabase postgres_changes only supports one column filter.
  useEffect(() => {
    const userId = user?.id
    if (!userId) return

    function patchThread(updated: Thread) {
      setThreads((prev) => {
        const idx = prev.findIndex((t) => t.id === updated.id)
        if (idx === -1) return prev
        const next = [...prev]
        next[idx] = {
          ...next[idx],
          ...updated,
          unread_count: updated.user_1 === userId
            ? updated.unread_count_user_1
            : updated.unread_count_user_2,
        }
        return next.sort(
          (a, b) => new Date(b.latest_message_at).getTime() - new Date(a.latest_message_at).getTime()
        )
      })
    }

    const ch1 = supabase
      .channel('profile-threads-u1-' + userId)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'threads', filter: `user_1=eq.${userId}` },
        (payload) => { patchThread(payload.new as Thread) }
      )
      .subscribe((status, err) => {
        console.log('[Profile] threads-u1 channel:', status, err ? String(err) : '')
      })

    const ch2 = supabase
      .channel('profile-threads-u2-' + userId)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'threads', filter: `user_2=eq.${userId}` },
        (payload) => { patchThread(payload.new as Thread) }
      )
      .subscribe((status, err) => {
        console.log('[Profile] threads-u2 channel:', status, err ? String(err) : '')
      })

    return () => {
      supabase.removeChannel(ch1)
      supabase.removeChannel(ch2)
    }
  }, [user?.id])

  useFocusEffect(
    useCallback(() => {
      const userId = userRef.current?.id ?? user?.id
      if (!userId) return

      setLoadingThreads(true)
      loadThreads(userId)

      supabase
        .from('checkins')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle()
        .then(({ data }) => setActiveCheckinId(data?.id ?? null))

      loadBlockedUsers(userId)
    }, [user?.id])
  )

  async function loadThreads(userId: string) {
    // 1. Get threads
    const { data: rawThreads } = await supabase
      .from('threads')
      .select('*')
      .or(`user_1.eq.${userId},user_2.eq.${userId}`)
      .order('latest_message_at', { ascending: false })

    if (!rawThreads?.length) {
      setThreads([])
      setLoadingThreads(false)
      return
    }

    // 2. Collect other user IDs
    const otherUserIds = rawThreads.map((t: Thread) =>
      t.user_1 === userId ? t.user_2 : t.user_1
    )

    // 3. Get most recent checkins for name/status of other users
    const { data: checkins } = await supabase
      .from('checkins')
      .select('user_id, name, status, is_active')
      .in('user_id', otherUserIds)
      .order('checked_in_at', { ascending: false })

    const userInfoMap = new Map<string, { name: string; status: UserStatus | null; isActive: boolean }>()
    for (const c of checkins ?? []) {
      if (!userInfoMap.has(c.user_id)) {
        userInfoMap.set(c.user_id, { name: c.name, status: c.status, isActive: c.is_active })
      }
    }

    // 4. Get intro message for each thread (preview text)
    const threadIds = rawThreads.map((t: Thread) => t.id)
    const { data: introMsgs } = await supabase
      .from('messages')
      .select('thread_id, body')
      .in('thread_id', threadIds)
      .eq('message_type', 'intro')

    const introMap = new Map<string, string>()
    for (const m of introMsgs ?? []) {
      introMap.set(m.thread_id, m.body)
    }

    // 5. Merge into enriched threads
    const enriched: ThreadWithMeta[] = (rawThreads as Thread[]).map((t) => {
      const otherId  = t.user_1 === userId ? t.user_2 : t.user_1
      const userInfo = userInfoMap.get(otherId)
      return {
        ...t,
        other_user_id:     otherId,
        other_user_name:   userInfo?.name    ?? 'Unknown',
        other_user_status: userInfo?.status  ?? null,
        other_user_active: userInfo?.isActive ?? false,
        intro_preview:     introMap.get(t.id) ?? '',
        unread_count:      t.user_1 === userId ? t.unread_count_user_1 : t.unread_count_user_2,
      }
    })

    setThreads(enriched)
    setLoadingThreads(false)
  }

  async function loadBlockedUsers(userId: string) {
    const { data: blocks } = await supabase
      .from('blocks')
      .select('blocked_user_id')
      .eq('blocker_id', userId)

    if (!blocks?.length) {
      setBlockedUsers([])
      return
    }

    const ids = blocks.map((b) => b.blocked_user_id)
    const { data: checkins } = await supabase
      .from('checkins')
      .select('user_id, name')
      .in('user_id', ids)
      .order('checked_in_at', { ascending: false })

    const seen   = new Set<string>()
    const result: BlockedUser[] = []
    for (const c of checkins ?? []) {
      if (!seen.has(c.user_id)) {
        seen.add(c.user_id)
        result.push({ blockedUserId: c.user_id, name: c.name })
      }
    }
    for (const id of ids) {
      if (!seen.has(id)) result.push({ blockedUserId: id, name: 'Unknown' })
    }
    setBlockedUsers(result)
  }

  async function handleCheckOut() {
    if (!activeCheckinId || checkingOut) return
    setCheckingOut(true)
    await supabase
      .from('checkins')
      .update({ is_active: false })
      .eq('id', activeCheckinId)
    setCheckingOut(false)
    setActiveCheckinId(null)
    router.replace('/(tabs)')
  }

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
  }

  function handleUnblock(bu: BlockedUser) {
    if (!user || unblockingId) return
    Alert.alert(
      'Unblock this person?',
      'They will be able to see you again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            setUnblockingId(bu.blockedUserId)
            const { error } = await supabase
              .from('blocks')
              .delete()
              .eq('blocker_id', user.id)
              .eq('blocked_user_id', bu.blockedUserId)
            setUnblockingId(null)
            if (error) {
              Alert.alert('', 'Something went wrong. Try again.')
              return
            }
            setBlockedUsers((prev) => prev.filter((b) => b.blockedUserId !== bu.blockedUserId))
          },
        },
      ]
    )
  }

  const name     = user?.user_metadata?.name ?? '—'
  const email    = user?.email ?? '—'
  const initials = name !== '—'
    ? name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.heading}>Profile</Text>

        {/* Identity card */}
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.identityInfo}>
            <Text style={styles.identityName}>{name}</Text>
            <Text style={styles.identityEmail}>{email}</Text>
          </View>
        </View>

        {/* Check Out */}
        {activeCheckinId !== null && (
          <TouchableOpacity
            style={[styles.checkOutButton, checkingOut && styles.actionDisabled]}
            onPress={handleCheckOut}
            disabled={checkingOut}
            activeOpacity={0.7}
          >
            {checkingOut
              ? <ActivityIndicator color="#EAB308" />
              : <Text style={styles.checkOutText}>Check Out</Text>
            }
          </TouchableOpacity>
        )}

        {/* Threads / Messages */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>MESSAGES</Text>
          {loadingThreads && <ActivityIndicator color="#555555" size="small" />}
        </View>

        {!loadingThreads && threads.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No conversations yet.</Text>
            <Text style={styles.emptyStateHint}>
              Send an intro to someone on the live list.
            </Text>
          </View>
        )}

        {threads.map((thread) => {
          const otherInitials = thread.other_user_name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)

          return (
            <TouchableOpacity
              key={thread.id}
              style={styles.threadRow}
              onPress={() => router.push(`/conversation/${thread.id}`)}
              activeOpacity={0.7}
            >
              {/* Avatar + status dot */}
              <View style={styles.threadAvatarWrap}>
                <View style={styles.threadAvatar}>
                  <Text style={styles.threadAvatarText}>{otherInitials}</Text>
                </View>
                {thread.other_user_status && (
                  <View style={[
                    styles.threadStatusDot,
                    { backgroundColor: STATUS_COLOR[thread.other_user_status] },
                  ]} />
                )}
              </View>

              {/* Content */}
              <View style={styles.threadContent}>
                <View style={styles.threadTopRow}>
                  <Text style={styles.threadName} numberOfLines={1}>
                    {thread.other_user_name}
                  </Text>
                  <View style={styles.threadMeta}>
                    {thread.unread_count > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{thread.unread_count}</Text>
                      </View>
                    )}
                    <Text style={styles.threadTime}>
                      {formatTime(thread.latest_message_at)}
                    </Text>
                  </View>
                </View>

                <View style={styles.threadBottomRow}>
                  <Text style={styles.threadPreview} numberOfLines={1}>
                    {thread.intro_preview}
                  </Text>
                  {!thread.unlocked_at && (
                    <Text style={styles.pendingLabel}>Awaiting reply</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )
        })}

        {/* Blocked Users */}
        {blockedUsers.length > 0 && (
          <View style={styles.blockedSection}>
            <Text style={[styles.sectionLabel, styles.blockedLabel]}>BLOCKED</Text>
            {blockedUsers.map((bu) => (
              <View key={bu.blockedUserId} style={styles.blockedRow}>
                <Text style={styles.blockedName}>{bu.name}</Text>
                <TouchableOpacity
                  onPress={() => handleUnblock(bu)}
                  disabled={!!unblockingId}
                  activeOpacity={0.6}
                >
                  {unblockingId === bu.blockedUserId
                    ? <ActivityIndicator color="#555555" size="small" />
                    : <Text style={styles.unblockText}>Unblock</Text>
                  }
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          style={[styles.signOutButton, signingOut && styles.actionDisabled]}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.7}
        >
          {signingOut
            ? <ActivityIndicator color="#EF4444" />
            : <Text style={styles.signOutText}>Sign Out</Text>
          }
        </TouchableOpacity>

        {/* Debug */}
        <TouchableOpacity
          style={styles.debugLink}
          onPress={() => router.push('/debug')}
          activeOpacity={0.5}
        >
          <Text style={styles.debugLinkText}>debug</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#111111' },
  scroll: { padding: 24, paddingBottom: 48 },
  heading: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', marginBottom: 24 },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText:    { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  identityInfo:  { flex: 1, gap: 4 },
  identityName:  { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  identityEmail: { fontSize: 14, color: '#888888' },
  checkOutButton: {
    borderWidth: 1,
    borderColor: '#EAB30840',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 28,
  },
  checkOutText: { fontSize: 15, fontWeight: '600', color: '#EAB308' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#555555', letterSpacing: 1 },
  emptyState:     { gap: 4, marginBottom: 32 },
  emptyStateText: { fontSize: 15, color: '#444444', fontWeight: '500' },
  emptyStateHint: { fontSize: 13, color: '#333333' },

  // Thread rows
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    gap: 14,
  },
  threadAvatarWrap: { position: 'relative', flexShrink: 0 },
  threadAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadAvatarText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  threadStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: '#111111',
  },
  threadContent:   { flex: 1, gap: 4 },
  threadTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  threadName: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', flex: 1 },
  threadMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  unreadBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: { fontSize: 11, fontWeight: '700', color: '#111111' },
  threadTime:  { fontSize: 12, color: '#555555' },
  threadBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  threadPreview: { fontSize: 13, color: '#666666', flex: 1 },
  pendingLabel:  { fontSize: 11, color: '#3A3A3A', flexShrink: 0 },

  // Blocked
  blockedSection: { marginTop: 32, marginBottom: 8 },
  blockedLabel:   { marginBottom: 14 },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  blockedName: { fontSize: 14, color: '#666666' },
  unblockText: { fontSize: 13, color: '#555555' },

  signOutButton: {
    borderWidth: 1,
    borderColor: '#EF444440',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  actionDisabled: { opacity: 0.5 },
  signOutText:    { fontSize: 16, fontWeight: '600', color: '#EF4444' },
  debugLink:     { alignItems: 'center', marginTop: 32 },
  debugLinkText: { fontSize: 11, color: '#2A2A2A' },
})
