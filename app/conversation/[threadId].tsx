import { useCallback, useEffect, useRef, useState } from 'react'
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
  Modal,
  Alert,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
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

const REPORT_REASONS = [
  'Something felt off',
  'Uncomfortable message',
  'Made me uneasy',
  'Other',
]

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

  const [currentUser, setCurrentUser]   = useState<User | null>(null)
  const [thread, setThread]             = useState<Thread | null>(null)
  const [otherUser, setOtherUser]       = useState<OtherUser | null>(null)
  const [messages, setMessages]         = useState<Message[]>([])
  const [loading, setLoading]           = useState(true)
  const [isBlocked, setIsBlocked]       = useState(false)
  const [iBlockedThem, setIBlockedThem] = useState(false)
  const [replyText, setReplyText]       = useState('')
  const [sending, setSending]           = useState(false)
  const [error, setError]               = useState<string | null>(null)

  // Safety
  const [blocking, setBlocking]               = useState(false)
  const [showSafetySheet, setShowSafetySheet] = useState(false)
  const [showReportForm, setShowReportForm]   = useState(false)
  const [reportReason, setReportReason]       = useState<string | null>(null)
  const [reportNote, setReportNote]           = useState('')
  const [reporting, setReporting]             = useState(false)
  const [reportDone, setReportDone]           = useState(false)

  const flatListRef    = useRef<FlatList>(null)
  const currentUserRef = useRef<User | null>(null)
  const threadRef      = useRef<Thread | null>(null)
  const otherIdRef     = useRef<string | null>(null)

  // Data load — runs once per threadId (no subscription here)
  useEffect(() => {
    async function boot() {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('[Conv] auth ready, userId:', user?.id ?? 'none')
      setCurrentUser(user)
      currentUserRef.current = user
      if (user) await loadAll(user.id)
    }
    boot()
  }, [threadId])

  // Subscription — re-establishes every time the screen is focused.
  // Uses a deferred cleanup closure to avoid the async race where the
  // blur fires while auth.getUser() is still pending, leaving channels
  // array empty and no subscription ever created.
  useFocusEffect(
    useCallback(() => {
      let blurred = false
      let cleanup: (() => void) | null = null

      async function subscribe() {
        const { data: { user } } = await supabase.auth.getUser()
        if (blurred || !user) return

        console.log('[Conv] subscribing realtime for thread:', threadId)

        const msgCh = supabase
          .channel('messages-thread-' + threadId)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
            (payload) => {
              const incoming = payload.new as Message
              console.log('[RT] message received:', incoming.id)
              setMessages((prev) => {
                if (prev.some((m) => m.id === incoming.id)) return prev
                return [...prev, incoming]
              })
              const u = currentUserRef.current
              const t = threadRef.current
              if (u && t) markRead(u.id, t)
              setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50)
            }
          )
          .subscribe((status, err) => {
            console.log('[RT] messages channel:', status, err ? String(err) : '')
          })

        const threadCh = supabase
          .channel('thread-update-' + threadId)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'threads', filter: `id=eq.${threadId}` },
            (payload) => {
              const updated = payload.new as Thread
              setThread(updated)
              threadRef.current = updated
            }
          )
          .subscribe((status, err) => {
            console.log('[RT] thread channel:', status, err ? String(err) : '')
          })

        // If blur fired while channels were being created, remove them immediately.
        if (blurred) {
          supabase.removeChannel(msgCh)
          supabase.removeChannel(threadCh)
          return
        }

        cleanup = () => {
          console.log('[Conv] blur: removing channels for thread:', threadId)
          supabase.removeChannel(msgCh)
          supabase.removeChannel(threadCh)
        }
      }

      subscribe()

      return () => {
        blurred = true
        cleanup?.()
      }
    }, [threadId])
  )

  async function loadAll(userId: string) {
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
    otherIdRef.current = otherId

    if (!otherId) {
      setLoading(false)
      return
    }

    const [{ data: checkins }, { data: msgs }, { data: myBlock }, { data: theirBlock }] =
      await Promise.all([
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
          .eq('blocker_id', userId)
          .eq('blocked_user_id', otherId)
          .maybeSingle(),
        supabase
          .from('blocks')
          .select('id')
          .eq('blocker_id', otherId)
          .eq('blocked_user_id', userId)
          .maybeSingle(),
      ])

    if (checkins?.[0]) {
      setOtherUser({ name: checkins[0].name, status: checkins[0].status, isActive: checkins[0].is_active })
    }

    setMessages((msgs as Message[]) ?? [])
    const iBlocked    = !!myBlock
    const theyBlocked = !!theirBlock
    setIBlockedThem(iBlocked)
    setIsBlocked(iBlocked || theyBlocked)
    setLoading(false)

    if (!(iBlocked || theyBlocked)) {
      markRead(userId, threadData as Thread)
    }
  }

  async function markRead(userId: string, t: Thread) {
    const isUser1 = t.user_1 === userId
    await supabase
      .from('threads')
      .update(isUser1 ? { unread_count_user_1: 0 } : { unread_count_user_2: 0 })
      .eq('id', t.id)
  }

  function handleBlock() {
    const otherId = otherIdRef.current
    if (!currentUser || !otherId || blocking) return
    setShowSafetySheet(false)
    const name = otherUser?.name ?? 'this person'
    Alert.alert(
      `Block ${name}?`,
      "You won't see each other on the live list.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            setBlocking(true)
            const { error: dbError } = await supabase.from('blocks').insert({
              blocker_id:      currentUser.id,
              blocked_user_id: otherId,
            })
            setBlocking(false)
            if (dbError) {
              Alert.alert('', 'Something went wrong. Try again.')
              return
            }
            setIBlockedThem(true)
            setIsBlocked(true)
            router.back()
          },
        },
      ]
    )
  }

  function handleUnblock() {
    const otherId = otherIdRef.current
    if (!currentUser || !otherId) return
    setShowSafetySheet(false)
    Alert.alert(
      'Unblock this person?',
      "They'll be able to see you again.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            const { error: dbError } = await supabase
              .from('blocks')
              .delete()
              .eq('blocker_id', currentUser.id)
              .eq('blocked_user_id', otherId)
            if (dbError) {
              Alert.alert('', 'Something went wrong. Try again.')
              return
            }
            setIBlockedThem(false)
            setIsBlocked(false)
          },
        },
      ]
    )
  }

  async function handleReportSubmit() {
    const otherId = otherIdRef.current
    if (!reportReason || reporting || !currentUser || !otherId) return
    setReporting(true)
    const { error: dbError } = await supabase.from('reports').insert({
      reporter_id:      currentUser.id,
      reported_user_id: otherId,
      checkin_id:       threadRef.current?.origin_checkin_id ?? null,
      reason:           reportReason,
      note:             reportNote.trim() || null,
    })
    setReporting(false)
    if (dbError) {
      Alert.alert('', 'Something went wrong. Try again.')
      return
    }
    setReportDone(true)
  }

  async function handleReply() {
    if (!replyText.trim() || sending || !thread || !currentUser) return
    setSending(true)
    setError(null)

    console.log('[handleReply] insert attempt', {
      thread_id: thread.id, sender_id: currentUser.id,
      thread_user_1: thread.user_1, thread_user_2: thread.user_2,
      unlocked_at: thread.unlocked_at,
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
      error: dbError
        ? { message: dbError.message, code: dbError.code, details: dbError.details, hint: dbError.hint }
        : null,
    })

    setSending(false)
    if (dbError) { setError('Something went wrong. Try again.'); return }
    setReplyText('')
  }

  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100)
    }
  }, [loading])

  // ─── Render helpers ────────────────────────────────────────────────────────

  function renderHeader(showSafety = true) {
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
        {showSafety && (
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() => setShowSafetySheet(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.moreBtnText}>···</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  function renderSafetySheet() {
    return (
      <Modal
        visible={showSafetySheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSafetySheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowSafetySheet(false)}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            {iBlockedThem ? (
              <TouchableOpacity style={styles.sheetItem} onPress={handleUnblock} activeOpacity={0.7}>
                <Text style={styles.sheetItemText}>Unblock</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.sheetItem} onPress={handleBlock} activeOpacity={0.7}>
                <Text style={[styles.sheetItemText, styles.sheetItemDestructive]}>
                  Block {otherUser?.name ?? 'this person'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => {
                setShowSafetySheet(false)
                setTimeout(() => setShowReportForm(true), 320)
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetItemText}>
                Report {otherUser?.name ?? 'this person'}
              </Text>
            </TouchableOpacity>

            <View style={styles.sheetDivider} />

            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => setShowSafetySheet(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    )
  }

  function renderReportForm() {
    return (
      <Modal
        visible={showReportForm}
        transparent={false}
        animationType="slide"
        onRequestClose={() => {
          setShowReportForm(false)
          setReportDone(false)
          setReportReason(null)
          setReportNote('')
        }}
      >
        <SafeAreaView style={styles.reportSafe}>
          {reportDone ? (
            <View style={styles.reportDoneWrap}>
              <Text style={styles.reportDoneTitle}>Report received.</Text>
              <Text style={styles.reportDoneBody}>
                Thank you for helping keep this space safe.
              </Text>
              <TouchableOpacity
                style={styles.reportDoneBtn}
                onPress={() => {
                  setShowReportForm(false)
                  setReportDone(false)
                  setReportReason(null)
                  setReportNote('')
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.reportDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.reportScroll}
            >
              <View style={styles.reportHeader}>
                <Text style={styles.reportTitle}>What happened?</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowReportForm(false)
                    setReportReason(null)
                    setReportNote('')
                  }}
                  activeOpacity={0.6}
                >
                  <Text style={styles.reportClose}>Cancel</Text>
                </TouchableOpacity>
              </View>

              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonCard, reportReason === reason && styles.reasonCardSelected]}
                  onPress={() => setReportReason(reason)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.reasonText, reportReason === reason && styles.reasonTextSelected]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={styles.reportNoteWrapper}>
                <TextInput
                  style={styles.reportNoteInput}
                  placeholder="Anything else? (optional)"
                  placeholderTextColor="#444444"
                  value={reportNote}
                  onChangeText={setReportNote}
                  multiline
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.reportSubmitBtn,
                  (!reportReason || reporting) && styles.reportSubmitDisabled,
                ]}
                disabled={!reportReason || reporting}
                onPress={handleReportSubmit}
                activeOpacity={0.85}
              >
                {reporting
                  ? <ActivityIndicator color="#111111" size="small" />
                  : <Text style={styles.reportSubmitText}>Send Report</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    )
  }

  function renderMessage({ item }: { item: Message }) {
    const isOwn   = item.sender_id === currentUser?.id
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

  // ─── Render ────────────────────────────────────────────────────────────────

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
        {renderHeader(false)}
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
        {renderHeader(false)}
        <View style={styles.center}>
          {iBlockedThem ? (
            <>
              <Text style={styles.stateMsg}>You've blocked this person.</Text>
              <Text style={styles.stateMsgSub}>Unblock to continue the conversation.</Text>
              <TouchableOpacity style={styles.unblockBtn} onPress={handleUnblock} activeOpacity={0.7}>
                <Text style={styles.unblockBtnText}>Unblock</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.stateMsg}>This conversation is unavailable.</Text>
          )}
        </View>
      </SafeAreaView>
    )
  }

  const isInitiator = thread.initiated_by === currentUser?.id
  const isUnlocked  = !!thread.unlocked_at

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

        <View style={styles.inputArea}>
          {isUnlocked ? (
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
            <View style={styles.lockState}>
              <Text style={styles.lockStateText}>Waiting for their reply…</Text>
            </View>
          ) : (
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

      {renderSafetySheet()}
      {renderReportForm()}
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
  moreBtn:     { paddingVertical: 4, paddingHorizontal: 2 },
  moreBtnText: { fontSize: 22, color: '#555555', letterSpacing: 2 },

  // Blocked state unblock button
  unblockBtn: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF30',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  unblockBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },

  // Messages
  messageList: { padding: 20, paddingBottom: 8, gap: 4 },

  bubbleWrap: { marginBottom: 16, maxWidth: '80%' },
  bubbleWrapOwn:   { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleWrapOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },

  introLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  introLabelOwn:   { color: '#3A4A3A' },
  introLabelOther: { color: '#444444' },

  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleOwn:   { backgroundColor: '#1E2A1E', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderBottomLeftRadius: 4 },
  bubbleIntroOwn:   { borderWidth: 1, borderColor: '#22C55E20' },
  bubbleIntroOther: { borderColor: '#333333' },
  bubbleText:      { fontSize: 15, lineHeight: 22 },
  bubbleTextOwn:   { color: '#DDDDDD' },
  bubbleTextOther: { color: '#CCCCCC' },
  bubbleTime:      { fontSize: 11, marginTop: 4 },
  bubbleTimeOwn:   { color: '#3A4A3A' },
  bubbleTimeOther: { color: '#444444' },

  // Input area
  inputArea: { borderTopWidth: 1, borderTopColor: '#1A1A1A', padding: 16, gap: 8 },
  replyRow:  { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
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
  lockState:     { paddingVertical: 14, alignItems: 'center' },
  lockStateText: { fontSize: 14, color: '#3A3A3A' },
  unlockPrompt:      { gap: 10 },
  unlockPromptLabel: { fontSize: 13, color: '#555555', textAlign: 'center' },

  error: { fontSize: 13, color: '#EF4444', textAlign: 'center' },

  // Safety action sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: '#000000AA',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333333',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetItem: { paddingVertical: 18, paddingHorizontal: 24 },
  sheetItemText:        { fontSize: 16, color: '#CCCCCC', textAlign: 'center' },
  sheetItemDestructive: { color: '#EF4444' },
  sheetDivider:         { height: 1, backgroundColor: '#2A2A2A', marginHorizontal: 24, marginVertical: 4 },
  sheetCancelText:      { fontSize: 16, fontWeight: '600', color: '#555555', textAlign: 'center' },

  // Report form (full-screen modal)
  reportSafe:  { flex: 1, backgroundColor: '#111111' },
  reportScroll: { padding: 24, paddingBottom: 48 },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  reportTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  reportClose: { fontSize: 15, color: '#555555' },

  reportDoneWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  reportDoneTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  reportDoneBody:  { fontSize: 15, color: '#555555', textAlign: 'center', lineHeight: 22 },
  reportDoneBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  reportDoneBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },

  reasonCard:         { borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 8 },
  reasonCardSelected: { borderColor: '#FFFFFF', backgroundColor: '#FFFFFF0D' },
  reasonText:         { fontSize: 14, color: '#555555' },
  reasonTextSelected: { color: '#FFFFFF', fontWeight: '500' },

  reportNoteWrapper: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  reportNoteInput: { fontSize: 14, color: '#AAAAAA', minHeight: 56, textAlignVertical: 'top' },

  reportSubmitBtn:      { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  reportSubmitDisabled: { backgroundColor: '#2A2A2A' },
  reportSubmitText:     { fontSize: 15, fontWeight: '700', color: '#111111' },
})
