import { useCallback, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { colors } from '../../.claude/tokens/colors'
import type { Thread } from '../../types/messaging'

type ConversationItem = {
  threadId: string
  otherUserId: string
  otherUserName: string
  preview: string
  timestamp: string
  unreadCount: number
}

function formatTime(ts: string): string {
  const date = new Date(ts)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' })
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      load()
    }, [])
  )

  async function load() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: threads } = await supabase
      .from('threads')
      .select('*')
      .or(`user_1.eq.${user.id},user_2.eq.${user.id}`)
      .order('latest_message_at', { ascending: false })

    if (!threads || threads.length === 0) {
      setConversations([])
      setLoading(false)
      return
    }

    const threadList = threads as Thread[]
    const otherUserIds = threadList.map((t) => (t.user_1 === user.id ? t.user_2 : t.user_1))
    const threadIds = threadList.map((t) => t.id)

    const [{ data: checkins }, { data: messages }] = await Promise.all([
      supabase
        .from('checkins')
        .select('user_id, name')
        .in('user_id', otherUserIds)
        .order('checked_in_at', { ascending: false }),
      supabase
        .from('messages')
        .select('thread_id, body')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: false }),
    ])

    const nameMap: Record<string, string> = {}
    for (const c of checkins ?? []) {
      if (!nameMap[c.user_id]) nameMap[c.user_id] = c.name
    }

    const previewMap: Record<string, string> = {}
    for (const m of messages ?? []) {
      if (!previewMap[m.thread_id]) previewMap[m.thread_id] = m.body
    }

    const items: ConversationItem[] = threadList.map((t) => {
      const otherId = t.user_1 === user.id ? t.user_2 : t.user_1
      const unread = t.user_1 === user.id ? t.unread_count_user_1 : t.unread_count_user_2
      return {
        threadId: t.id,
        otherUserId: otherId,
        otherUserName: nameMap[otherId] ?? 'Someone',
        preview: previewMap[t.id] ?? '',
        timestamp: t.latest_message_at,
        unreadCount: unread ?? 0,
      }
    })

    setConversations(items)
    setLoading(false)
  }

  function renderCard({ item }: { item: ConversationItem }) {
    const hasUnread = item.unreadCount > 0
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/conversation/${item.threadId}`)}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(item.otherUserName)}</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <Text style={styles.cardName} numberOfLines={1}>{item.otherUserName}</Text>
            <Text style={styles.cardTime}>{formatTime(item.timestamp)}</Text>
          </View>
          <View style={styles.cardBottom}>
            <Text style={styles.cardPreview} numberOfLines={1}>{item.preview}</Text>
            {hasUnread && <View style={styles.unreadDot} />}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.heading}>Messages</Text>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyHeadline}>No conversations yet.</Text>
          <Text style={styles.emptySubtitle}>
            Send an intro to someone at the gym to get started.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.threadId}
          renderItem={renderCard}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyHeadline: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 8,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  cardContent: { flex: 1, gap: 3 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  cardTime: {
    fontSize: 12,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardPreview: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    flexShrink: 0,
  },
})
