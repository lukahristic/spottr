import { useCallback, useEffect, useState } from 'react'
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

type Message = {
  id: string
  sender_name: string
  sender_status: 'happy_to_help' | 'need_guidance' | 'just_training'
  text: string
  created_at: string
}

type BlockedUser = {
  blockedUserId: string
  name: string
}

const STATUS_COLOR: Record<string, string> = {
  happy_to_help: '#22C55E',
  need_guidance:  '#EAB308',
  just_training:  '#3B82F6',
}

export default function ProfileScreen() {
  const [user, setUser]                     = useState<User | null>(null)
  const [messages, setMessages]             = useState<Message[]>([])
  const [activeCheckinId, setActiveCheckinId] = useState<string | null>(null)
  const [loadingMsgs, setLoadingMsgs]       = useState(false)
  const [checkingOut, setCheckingOut]       = useState(false)
  const [signingOut, setSigningOut]         = useState(false)
  const [blockedUsers, setBlockedUsers]     = useState<BlockedUser[]>([])
  const [unblockingId, setUnblockingId]     = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return

      setLoadingMsgs(true)

      supabase
        .from('messages')
        .select('id, sender_name, sender_status, text, created_at')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setMessages((data as Message[]) ?? [])
          setLoadingMsgs(false)
        })

      supabase
        .from('checkins')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()
        .then(({ data }) => {
          setActiveCheckinId(data?.id ?? null)
        })

      // Fetch blocked users + resolve their names from checkins
      ;(async () => {
        const { data: blocks } = await supabase
          .from('blocks')
          .select('blocked_user_id')
          .eq('blocker_id', user.id)

        if (!blocks || blocks.length === 0) {
          setBlockedUsers([])
          return
        }

        const ids = blocks.map((b) => b.blocked_user_id)

        const { data: checkins } = await supabase
          .from('checkins')
          .select('user_id, name')
          .in('user_id', ids)
          .order('checked_in_at', { ascending: false })

        const seen = new Set<string>()
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
      })()
    }, [user?.id])
  )

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

        {/* Check Out — only shown when active check-in exists */}
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

        {/* Inbox */}
        <View style={styles.inboxHeader}>
          <Text style={styles.sectionLabel}>INBOX</Text>
          {loadingMsgs && <ActivityIndicator color="#555555" size="small" />}
        </View>

        {!loadingMsgs && messages.length === 0 && (
          <View style={styles.inboxEmpty}>
            <Text style={styles.inboxEmptyText}>No messages yet.</Text>
            <Text style={styles.inboxEmptyHint}>
              When someone reaches out, it'll appear here.
            </Text>
          </View>
        )}

        {messages.map((msg) => (
          <View key={msg.id} style={styles.messageCard}>
            <View style={styles.messageTop}>
              <View style={[styles.senderDot, { backgroundColor: STATUS_COLOR[msg.sender_status] }]} />
              <Text style={styles.senderName}>{msg.sender_name}</Text>
            </View>
            <Text style={styles.messageText}>{msg.text}</Text>
          </View>
        ))}

        {/* Blocked Users — hidden when list is empty */}
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

        {/* Debug — hidden link */}
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
  inboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionLabel:   { fontSize: 12, fontWeight: '700', color: '#555555', letterSpacing: 1 },
  inboxEmpty:     { gap: 4, marginBottom: 32 },
  inboxEmptyText: { fontSize: 15, color: '#444444', fontWeight: '500' },
  inboxEmptyHint: { fontSize: 13, color: '#333333' },
  messageCard: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  messageTop:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  senderDot:   { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  senderName:  { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  messageText: { fontSize: 14, color: '#AAAAAA', lineHeight: 20 },
  signOutButton: {
    borderWidth: 1,
    borderColor: '#EF444440',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  actionDisabled: { opacity: 0.5 },
  signOutText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
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
  blockedName:  { fontSize: 14, color: '#666666' },
  unblockText:  { fontSize: 13, color: '#555555' },
  debugLink:     { alignItems: 'center', marginTop: 32 },
  debugLinkText: { fontSize: 11, color: '#2A2A2A' },
})
