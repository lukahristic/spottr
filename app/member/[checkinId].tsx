import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

type CheckIn = {
  id: string
  user_id: string
  name: string
  status: 'happy_to_help' | 'need_guidance' | 'just_training'
  goal: string
  is_active: boolean
}

type SentMessage = {
  id: string
  text: string
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  happy_to_help: { label: 'Happy to Help', color: '#22C55E' },
  need_guidance:  { label: 'Need Guidance',  color: '#EAB308' },
  just_training:  { label: 'Just Training',  color: '#3B82F6' },
}

const SENT_LINES = [
  "Intro sent. Give it time — there's no need to rush.",
  "Message sent. Let the moment unfold naturally.",
  "Intro sent. The next step is theirs.",
  "Message sent. No need to force what comes next.",
  "Intro sent. If the connection feels right, it'll happen.",
  "Message sent. Sometimes the best connections start quietly.",
]

const REPORT_REASONS = [
  'Something felt off',
  'Uncomfortable message',
  'Made me uneasy',
  'Other',
]

export default function MemberScreen() {
  const { checkinId } = useLocalSearchParams<{ checkinId: string }>()

  const [checkin, setCheckin]         = useState<CheckIn | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [alreadySent, setAlreadySent] = useState(false)
  const [sentMessage, setSentMessage] = useState<SentMessage | null>(null)
  const [loading, setLoading]         = useState(true)
  const [sentLine]                    = useState(() => SENT_LINES[Math.floor(Math.random() * SENT_LINES.length)])
  const [text, setText]               = useState('')
  const [sending, setSending]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [success, setSuccess]         = useState(false)

  // Safety
  const [isBlocked, setIsBlocked]           = useState(false)
  const [blocking, setBlocking]             = useState(false)
  const [unblocking, setUnblocking]         = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportReason, setReportReason]     = useState<string | null>(null)
  const [reportNote, setReportNote]         = useState('')
  const [reporting, setReporting]           = useState(false)
  const [reportDone, setReportDone]         = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: checkinData }, { data: { user } }] = await Promise.all([
        supabase.from('checkins').select('*').eq('id', checkinId).single(),
        supabase.auth.getUser(),
      ])

      setCheckin(checkinData as CheckIn | null)
      setCurrentUser(user)

      if (user && checkinData) {
        const [{ data: existing }, { data: existingBlock }] = await Promise.all([
          supabase
            .from('messages')
            .select('id, text')
            .eq('sender_id', user.id)
            .eq('checkin_id', checkinId)
            .maybeSingle(),
          supabase
            .from('blocks')
            .select('id')
            .eq('blocker_id', user.id)
            .eq('blocked_user_id', checkinData.user_id)
            .maybeSingle(),
        ])

        if (existing) {
          setAlreadySent(true)
          setSentMessage(existing as SentMessage)
        }
        if (existingBlock) setIsBlocked(true)
      }

      setLoading(false)
    }

    load()
  }, [checkinId])

  async function handleSend() {
    if (!text.trim() || sending || !checkin || !currentUser) return
    setSending(true)
    setError(null)

    const { data: senderCheckin } = await supabase
      .from('checkins')
      .select('status')
      .eq('user_id', currentUser.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!senderCheckin) {
      setError('Check in first, then send a message.')
      setSending(false)
      return
    }

    const { error: dbError } = await supabase.from('messages').insert({
      sender_id:     currentUser.id,
      receiver_id:   checkin.user_id,
      checkin_id:    checkin.id,
      sender_name:   currentUser.user_metadata?.name ?? 'Unknown',
      sender_status: senderCheckin.status,
      text:          text.trim(),
    })

    setSending(false)

    if (dbError) {
      setError(
        dbError.code === '23505'
          ? "You've already reached out during this check-in."
          : 'Something went wrong. Try again.'
      )
      return
    }

    setSuccess(true)
  }

  function handleBlock() {
    if (!checkin || !currentUser || blocking) return
    Alert.alert(
      `Block ${checkin.name}?`,
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
              blocked_user_id: checkin.user_id,
            })
            setBlocking(false)
            if (dbError) {
              Alert.alert('', "Couldn't block. Try again.")
              return
            }
            setIsBlocked(true)
          },
        },
      ]
    )
  }

  function handleUnblock() {
    if (!checkin || !currentUser || unblocking) return
    Alert.alert(
      'Unblock this person?',
      'They will be able to see you again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            setUnblocking(true)
            const { error: dbError } = await supabase
              .from('blocks')
              .delete()
              .eq('blocker_id', currentUser.id)
              .eq('blocked_user_id', checkin.user_id)
            setUnblocking(false)
            if (dbError) {
              Alert.alert('', 'Something went wrong. Try again.')
              return
            }
            setIsBlocked(false)
          },
        },
      ]
    )
  }

  async function handleReport() {
    if (!reportReason || reporting || !checkin || !currentUser) return
    setReporting(true)
    const { error: dbError } = await supabase.from('reports').insert({
      reporter_id:      currentUser.id,
      reported_user_id: checkin.user_id,
      checkin_id:       checkin.id,
      reason:           reportReason,
      note:             reportNote.trim() || null,
    })
    setReporting(false)
    if (dbError) {
      Alert.alert('', "Couldn't send report. Try again.")
      return
    }
    setShowReportForm(false)
    setReportDone(true)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#FFFFFF" size="large" />
        </View>
      </SafeAreaView>
    )
  }

  if (!checkin) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.stateTitle}>Check-in not found.</Text>
        </View>
      </SafeAreaView>
    )
  }

  const meta              = STATUS_META[checkin.status]
  const isOwnCard         = checkin.user_id === currentUser?.id
  const isInactive        = !checkin.is_active
  const showForm          = !isOwnCard && !isInactive && !alreadySent && !success && !isBlocked
  const showSafety        = !isOwnCard && !isInactive
  const displayedSentText = success ? text.trim() : sentMessage?.text ?? ''

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Profile header */}
          <View style={styles.profileHeader}>
            <Text style={styles.memberName}>{checkin.name}</Text>
            <View style={[styles.statusBadge, { borderColor: `${meta.color}50` }]}>
              <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
              <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>
          <Text style={styles.memberGoal}>{checkin.goal}</Text>

          <View style={styles.divider} />

          {/* States */}
          {isOwnCard && (
            <Text style={styles.stateTitle}>This is your check-in.</Text>
          )}

          {!isOwnCard && isInactive && (
            <Text style={styles.stateTitle}>This person has checked out.</Text>
          )}

          {isBlocked && (
            <Text style={styles.stateTitle}>You've blocked this person.</Text>
          )}

          {!isBlocked && (alreadySent || success) && (
            <View style={styles.sentBox}>
              <Text style={styles.sentLabel}>YOUR INTRO</Text>
              <View style={styles.messageBubble}>
                <Text style={styles.messageBubbleText}>{displayedSentText}</Text>
              </View>
              <Text style={styles.sentNotice}>{sentLine}</Text>
              <Text style={styles.nextStepHint}>
                If they reply, you'll see it in your Profile tab.
              </Text>
              <TouchableOpacity
                style={styles.backToLiveBtn}
                onPress={() => router.replace('/(tabs)/live')}
                activeOpacity={0.7}
              >
                <Text style={styles.backToLiveBtnText}>Back to Live</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Message form */}
          {showForm && (
            <View style={styles.form}>
              <Text style={styles.formLabel}>Send an intro message</Text>
              <Text style={styles.formHint}>
                Keep it friendly. One message per check-in.
              </Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Hi! I noticed you're working on…"
                  placeholderTextColor="#555"
                  value={text}
                  onChangeText={(v) => setText(v.slice(0, 150))}
                  multiline
                  editable={!sending}
                />
                <Text style={[
                  styles.charCount,
                  text.length >= 130 && styles.charCountWarn,
                ]}>
                  {text.length}/150
                </Text>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
                disabled={!text.trim() || sending}
                onPress={handleSend}
                activeOpacity={0.85}
              >
                {sending
                  ? <ActivityIndicator color="#111111" />
                  : <Text style={styles.sendButtonText}>Send Message</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {/* Safety section */}
          {showSafety && (
            <>
              {reportDone ? (
                <View style={styles.safetyState}>
                  <Text style={styles.safetyStateTitle}>Report received.</Text>
                  <Text style={styles.safetyStateBody}>
                    Thank you for helping keep this space safe.
                  </Text>
                </View>
              ) : showReportForm ? (
                <View style={styles.reportForm}>
                  <Text style={styles.reportFormLabel}>What happened?</Text>

                  {REPORT_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        styles.reasonCard,
                        reportReason === reason && styles.reasonCardSelected,
                      ]}
                      onPress={() => setReportReason(reason)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.reasonText,
                        reportReason === reason && styles.reasonTextSelected,
                      ]}>
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
                    onPress={handleReport}
                    activeOpacity={0.85}
                  >
                    {reporting
                      ? <ActivityIndicator color="#111111" size="small" />
                      : <Text style={styles.reportSubmitText}>Send Report</Text>
                    }
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelReport}
                    onPress={() => { setShowReportForm(false); setReportReason(null); setReportNote('') }}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.cancelReportText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.safetyLinks}>
                  {isBlocked ? (
                    <TouchableOpacity onPress={handleUnblock} disabled={unblocking} activeOpacity={0.6}>
                      {unblocking
                        ? <ActivityIndicator color="#3A3A3A" size="small" />
                        : <Text style={styles.safetyLink}>Unblock</Text>
                      }
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={handleBlock} disabled={blocking} activeOpacity={0.6}>
                      {blocking
                        ? <ActivityIndicator color="#3A3A3A" size="small" />
                        : <Text style={styles.safetyLink}>Block</Text>
                      }
                    </TouchableOpacity>
                  )}
                  <Text style={styles.safetyDivider}>·</Text>
                  <TouchableOpacity onPress={() => setShowReportForm(true)} activeOpacity={0.6}>
                    <Text style={styles.safetyLink}>Report</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#111111' },
  flex:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scroll: { padding: 24, paddingBottom: 48 },
  back:     { marginBottom: 28 },
  backText: { fontSize: 15, color: '#888888' },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  memberName:  { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  statusDot:   { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 13, fontWeight: '600' },
  memberGoal:  { fontSize: 15, color: '#888888' },
  divider:     { height: 1, backgroundColor: '#2A2A2A', marginVertical: 28 },
  stateTitle:  { fontSize: 16, fontWeight: '500', color: '#666666' },
  sentBox: { gap: 20 },
  sentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#444444',
    letterSpacing: 1,
  },
  messageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1A2A1A',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '88%',
  },
  messageBubbleText: {
    fontSize: 15,
    color: '#CCCCCC',
    lineHeight: 22,
  },
  sentNotice: {
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 24,
  },
  nextStepHint: {
    fontSize: 13,
    color: '#3A3A3A',
    textAlign: 'center',
  },
  backToLiveBtn: {
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  backToLiveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },
  form:      { gap: 8 },
  formLabel: { fontSize: 17, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 },
  formHint:  { fontSize: 13, color: '#666666', marginBottom: 12 },
  inputWrapper: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  messageInput: {
    fontSize: 15,
    color: '#FFFFFF',
    minHeight: 88,
    textAlignVertical: 'top',
  },
  charCount:     { fontSize: 12, color: '#555555', textAlign: 'right', marginTop: 6 },
  charCountWarn: { color: '#EAB308' },
  error: { fontSize: 14, color: '#EF4444' },
  sendButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  sendButtonDisabled: { backgroundColor: '#2A2A2A' },
  sendButtonText: { fontSize: 16, fontWeight: '700', color: '#111111', letterSpacing: 0.3 },

  // Safety
  safetyLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginTop: 48,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  safetyLink:    { fontSize: 13, color: '#3A3A3A' },
  safetyDivider: { fontSize: 13, color: '#2A2A2A' },
  safetyState: {
    marginTop: 40,
    gap: 8,
  },
  safetyStateTitle: { fontSize: 16, fontWeight: '600', color: '#555555' },
  safetyStateBody:  { fontSize: 13, color: '#3A3A3A', lineHeight: 20 },
  reportForm: {
    marginTop: 32,
    gap: 10,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  reportFormLabel: { fontSize: 15, fontWeight: '600', color: '#888888', marginBottom: 4 },
  reasonCard: {
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  reasonCardSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF0D',
  },
  reasonText:         { fontSize: 14, color: '#555555' },
  reasonTextSelected: { color: '#FFFFFF', fontWeight: '500' },
  reportNoteWrapper: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  reportNoteInput: {
    fontSize: 14,
    color: '#AAAAAA',
    minHeight: 56,
    textAlignVertical: 'top',
  },
  reportSubmitBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  reportSubmitDisabled: { backgroundColor: '#2A2A2A' },
  reportSubmitText: { fontSize: 15, fontWeight: '700', color: '#111111' },
  cancelReport:     { alignItems: 'center', paddingVertical: 10 },
  cancelReportText: { fontSize: 14, color: '#3A3A3A' },
})
