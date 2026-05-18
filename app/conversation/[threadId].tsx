import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { Thread, Message, UserStatus } from '../../types/messaging'

type OtherUser = {
  name: string
  status: UserStatus | null
  isActive: boolean
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  happy_to_help: { label: 'Happy to Help', color: '#22C55E' },
  need_guidance:  { label: 'Need Guidance',  color: '#EAB308' },
  just_training:  { label: 'Just Training',  color: '#3B82F6' },
}

function formatTime(ts: string): string {
  const date = new Date(ts)
  const now   = new Date()
  const diffMs   = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)   return date.toLocaleDateString([], { weekday: 'short' })
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function ConversationScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>()

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [thread, setThread]           = useState<Thread | null>(null)
  const [otherUser, setOtherUser]     = useState<OtherUser | null>(null)
  const [messages, setMessages]       = useState<Message[]>([])
  const [loading, setLoading]         = useState(true)
  const [isBlocked, setIsBlocked]     = useState(false)
  const [replyText, setReplyText]     = useState('')
  const [sending, setSending]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const flatListRef   = useRef<FlatList>(null)
  const currentUserRef = useRef<User | null>(null)
  const threadRef      = useRef<Thread | null>(null)

  useEffect(() => {
    let cancelled = false

    async function boot() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      setCurrentUser(user)
      currentUserRef.current = user
      if (user) await loadAll(user.id)
    }

    boot()

    const msgChannel = supabase
      .channel('messages-thread-' + threadId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
        (payload) => {
          if (cancelled) return
          const incoming = payload.new as Message
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev
            return [...prev, incoming]
          })
          const user = currentUserRef.current
          const t    = threadRef.current
          if (user && t) markRead(user.id, t)
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50)
        }
      )
      .subscribe()

    const threadChannel = supabase
      .channel('thread-update-' + threadId)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'threads', filter: `id=eq.${threadId}` },
        (payload) => {
          if (cancelled) return
          const updated = payload.new as Thread
          setThread(updated)
          threadRef.current = updated
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(threadChannel)
    }
  }, [threadId])

  async function loadAll(userId: string) {
    // Load thread
    const { data: threadData } = await supabase
      .from('threads')
      .select('*')
      .eq('id', threadId)
      .single()

    if (!threadData) {
      setLoading(false)
      return
    }

    setThread(threadData as Thread)
    threadRef.current = threadData as Thread

    const otherId = threadData.user_1 === userId ? threadData.user_2 : threadData.user_1

    if (!otherId) {
      // Other user was deleted
      setLoading(false)
      return
    }

    // Parallel: other user info, messages, block check
    const [{ data: checkins }, { data: msgs }, { data: blockCheck }] = await Promise.all([
      supabase
        .from('checkins')
        .select('name, status, is_active')
        .eq('user_id', otherId)
        .order('checked_in_at', { ascending: false })
        .limit(1),
      supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true }),
      supabase
        .from('blocks')
        .select('id')
        .or(
          `and(blocker_id.eq.${userId},blocked_user_id.eq.${otherId}),` +
          `and(blocker_id.eq.${otherId},blocked_user_id.eq.${userId})`
        )
        .maybeSingle(),
    ])

    if (checkins?.[0]) {
      setOtherUser({
        name:     checkins[0].name,
        status:   checkins[0].status,
        isActive: checkins[0].is_active,
      })
    }

    setMessages((msgs as Message[]) ?? [])
    setIsBlocked(!!blockCheck)
    setLoading(false)

    // Mark thread as read
    markRead(userId, threadData as Thread)
  }

  async function markRead(userId: string, t: Thread) {
    const isUser1 = t.user_1 === userId
    await supabase
      .from('threads')
      .update(isUser1 ? { unread_count_user_1: 0 } : { unread_count_user_2: 0 })
      .eq('id', t.id)
  }

  async function handleReply() {
    if (!replyText.trim() || sending || !thread || !currentUser) return
    setSending(true)
    setError(null)

    console.log('[handleReply] insert attempt', {
      thread_id:    thread.id,
      sender_id:    currentUser.id,
      message_type: 'reply',
      thread_user_1: thread.user_1,
      thread_user_2: thread.user_2,
      unlocked_at:   thread.unlocked_at,
    })

    const { data: insertedMsg, error: dbError } = await supabase
      .from('messages')
      .insert({
        thread_id:    thread.id,
        sender_id:    currentUser.id,
        body:         replyText.trim(),
        message_type: 'reply',
      })
      .select('id')
      .single()

    console.log('[handleReply] result', {
      insertedMsg,
      error: dbError ? {
        message: dbError.message,
        code:    dbError.code,
        details: dbError.details,
        hint:    dbError.hint,
      } : null,
    })

    setSending(false)

    if (dbError) {
      setError('Something went wrong. Try again.')
      return
    }

    setReplyText('')
  }

  // Scroll to bottom after initial load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100)
    }
  }, [loading])

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#FFFFFF" size="large" />
        </View>
      </SafeAreaView>
    )
  }

  if (!thread) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.stateMsg}>Conversation not found.</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!thread.user_1 || !thread.user_2) {
    return (
      <SafeAreaView style={styles.safe}>
        {renderHeader()}
        <View style={styles.center}>
          <Text style={styles.stateMsg}>This conversation is no longer available.</Text>
          <Text style={styles.stateMsgSub}>The other account was deleted.</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (isBlocked) {
    return (
      <SafeAreaView style={styles.safe}>
        {renderHeader()}
        <View style={styles.center}>
          <Text style={styles.stateMsg}>This conversation is unavailable.</Text>
        </View>
      </SafeAreaView>
    )
  }

  const isInitiator = thread.initiated_by === currentUser?.id
  const isUnlocked  = !!thread.unlocked_at

  function renderHeader() {
    const statusMeta = otherUser?.status ? STATUS_META[otherUser.status] : null
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName} numberOfLines={1}>
            {otherUser?.name ?? 'Unknown'}
          </Text>
          {statusMeta && otherUser?.isActive && (
            <View style={styles.headerStatus}>
              <View style={[styles.headerStatusDot, { backgroundColor: statusMeta.color }]} />
              <Text style={[styles.headerStatusLabel, { color: statusMeta.color }]}>
                {statusMeta.label}
              </Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  function renderMessage({ item }: { item: Message }) {
    const isOwn  = item.sender_id === currentUser?.id
    const isIntro = item.message_type === 'intro'

    return (
      <View style={[styles.bubbleWrap, isOwn ? styles.bubbleWrapOwn : styles.bubbleWrapOther]}>
        {isIntro && (
          <Text style={[styles.introLabel, isOwn ? styles.introLabelOwn : styles.introLabelOther]}>
            INTRO
          </Text>
        )}
        <View style={[
          styles.bubble,
          isOwn  ? styles.bubbleOwn  : styles.bubbleOther,
          isIntro && (isOwn ? styles.bubbleIntroOwn : styles.bubbleIntroOther),
        ]}>
          <Text style={[styles.bubbleText, isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther]}>
            {item.body}
          </Text>
        </View>
        <Text style={[styles.bubbleTime, isOwn ? styles.bubbleTimeOwn : styles.bubbleTimeOther]}>
          {formatTime(item.created_at)}
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        {renderHeader()}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input / lock state */}
        <View style={styles.inputArea}>
          {isUnlocked ? (
            // Both parties can reply freely
            <View style={styles.replyRow}>
              <TextInput
                style={styles.replyInput}
                placeholder="Reply…"
                placeholderTextColor="#444444"
                value={replyText}
                onChangeText={(v) => setReplyText(v.slice(0, 300))}
                multiline
                editable={!sending}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!replyText.trim() || sending) && styles.sendBtnDisabled]}
                disabled={!replyText.trim() || sending}
                onPress={handleReply}
                activeOpacity={0.85}
              >
                {sending
                  ? <ActivityIndicator color="#111111" size="small" />
                  : <Text style={styles.sendBtnText}>Send</Text>
                }
              </TouchableOpacity>
            </View>
          ) : isInitiator ? (
            // Sender waiting for reply
            <View style={styles.lockState}>
              <Text style={styles.lockStateText}>Waiting for their reply…</Text>
            </View>
          ) : (
            // Recipient — reply to unlock
            <View style={styles.unlockPrompt}>
              <Text style={styles.unlockPromptLabel}>Reply to start the conversation</Text>
              <View style={styles.replyRow}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Write a reply…"
                  placeholderTextColor="#444444"
                  value={replyText}
                  onChangeText={(v) => setReplyText(v.slice(0, 300))}
                  multiline
                  editable={!sending}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, (!replyText.trim() || sending) && styles.sendBtnDisabled]}
                  disabled={!replyText.trim() || sending}
                  onPress={handleReply}
                  activeOpacity={0.85}
                >
                  {sending
                    ? <ActivityIndicator color="#111111" size="small" />
                    : <Text style={styles.sendBtnText}>Send</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: '#111111' },
  flex:  { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  stateMsg:    { fontSize: 16, fontWeight: '500', color: '#666666', textAlign: 'center' },
  stateMsgSub: { fontSize: 13, color: '#444444', textAlign: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    gap: 14,
  },
  backBtn:  { paddingVertical: 2 },
  backText: { fontSize: 15, color: '#888888' },
  headerCenter: { flex: 1, gap: 2 },
  headerName:   { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  headerStatus: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerStatusDot:   { width: 7, height: 7, borderRadius: 3.5 },
  headerStatusLabel: { fontSize: 12, fontWeight: '500' },

  // Messages
  messageList: { padding: 20, paddingBottom: 8, gap: 4 },

  bubbleWrap: { marginBottom: 16, maxWidth: '80%' },
  bubbleWrapOwn:   { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleWrapOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },

  introLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  introLabelOwn:   { color: '#3A4A3A' },
  introLabelOther: { color: '#444444' },

  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOwn: {
    backgroundColor: '#1E2A1E',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderBottomLeftRadius: 4,
  },
  bubbleIntroOwn: {
    borderWidth: 1,
    borderColor: '#22C55E20',
  },
  bubbleIntroOther: {
    borderColor: '#333333',
  },
  bubbleText:      { fontSize: 15, lineHeight: 22 },
  bubbleTextOwn:   { color: '#DDDDDD' },
  bubbleTextOther: { color: '#CCCCCC' },

  bubbleTime:      { fontSize: 11, marginTop: 4 },
  bubbleTimeOwn:   { color: '#3A4A3A' },
  bubbleTimeOther: { color: '#444444' },

  // Input area
  inputArea: {
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    padding: 16,
    gap: 8,
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#FFFFFF',
    maxHeight: 96,
    textAlignVertical: 'top',
  },
  sendBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: '#2A2A2A' },
  sendBtnText: { fontSize: 14, fontWeight: '700', color: '#111111' },

  // Lock states
  lockState: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  lockStateText: { fontSize: 14, color: '#3A3A3A' },

  unlockPrompt: { gap: 10 },
  unlockPromptLabel: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
  },

  error: { fontSize: 13, color: '#EF4444', textAlign: 'center' },
})
