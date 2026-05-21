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
import { ChevronLeft } from 'lucide-react-native'
import { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { colors } from '../../.claude/tokens/colors'
import { Avatar, AvatarStyle } from '../../components/Avatar'

type CheckIn = {
  id: string
  user_id: string
  name: string
  vibe: string
  custom_vibe?: string | null
  open_to_chat: boolean
  goal?: string | null
  is_active: boolean
}

const REPORT_REASONS = [
  'Something felt off',
  'Uncomfortable message',
  'Made me uneasy',
  'Other',
]


export default function MemberScreen() {
  const { checkinId } = useLocalSearchParams<{ checkinId: string }>()

  const [checkin, setCheckin]               = useState<CheckIn | null>(null)
  const [currentUser, setCurrentUser]       = useState<User | null>(null)
  const [existingThreadId, setExistingThreadId] = useState<string | null>(null)
  const [loading, setLoading]               = useState(true)
  const [text, setText]                     = useState('')
  const [sending, setSending]               = useState(false)
  const [error, setError]                   = useState<string | null>(null)

  const [memberBio, setMemberBio]             = useState<string | null>(null)
  const [memberAvatarSeed, setMemberAvatarSeed] = useState<string | null>(null)
  const [memberAvatarStyle, setMemberAvatarStyle] = useState<AvatarStyle>('thumbs')

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

      if (checkinData?.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('bio, avatar_seed, avatar_style')
          .eq('id', checkinData.user_id)
          .maybeSingle()
        setMemberBio(profile?.bio ?? null)
        setMemberAvatarSeed(profile?.avatar_seed ?? null)
        setMemberAvatarStyle((profile?.avatar_style as AvatarStyle | null) ?? 'thumbs')
      }

      if (user && checkinData) {
        const [u1, u2] = [user.id, checkinData.user_id].sort()

        const [{ data: existingThread }, { data: existingBlock }] = await Promise.all([
          supabase
            .from('threads')
            .select('id')
            .eq('user_1', u1)
            .eq('user_2', u2)
            .maybeSingle(),
          supabase
            .from('blocks')
            .select('id')
            .eq('blocker_id', user.id)
            .eq('blocked_user_id', checkinData.user_id)
            .maybeSingle(),
        ])

        if (existingThread) setExistingThreadId(existingThread.id)
        if (existingBlock)  setIsBlocked(true)
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
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!senderCheckin) {
      setError('Check in first, then send a message.')
      setSending(false)
      return
    }

    const [u1, u2] = [currentUser.id, checkin.user_id].sort()

    const { data: existingThread } = await supabase
      .from('threads')
      .select('id')
      .eq('user_1', u1)
      .eq('user_2', u2)
      .maybeSingle()

    if (existingThread) {
      setSending(false)
      router.replace(`/conversation/${existingThread.id}`)
      return
    }

    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .insert({
        user_1:            u1,
        user_2:            u2,
        initiated_by:      currentUser.id,
        origin_checkin_id: checkin.id,
      })
      .select('id')
      .single()

    if (threadError || !thread) {
      setError('Something went wrong. Try again.')
      setSending(false)
      return
    }

    const { error: msgError } = await supabase.from('messages').insert({
      thread_id:    thread.id,
      sender_id:    currentUser.id,
      body:         text.trim(),
      message_type: 'intro',
    })

    setSending(false)

    if (msgError) {
      setError('Something went wrong. Try again.')
      return
    }

    router.replace(`/conversation/${thread.id}`)
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
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  if (!checkin) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <ChevronLeft size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.stateTitle}>Check-in not found.</Text>
        </View>
      </SafeAreaView>
    )
  }

  const isOwnCard  = checkin.user_id === currentUser?.id
  const isInactive = !checkin.is_active
  const hasThread  = !!existingThreadId
  const showForm   = !isOwnCard && !isInactive && !hasThread && !isBlocked
  const showSafety = !isOwnCard && !isInactive

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
            <ChevronLeft size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.avatarWrap}>
            <Avatar
              seed={memberAvatarSeed ?? checkin.user_id}
              name={checkin.name}
              size={64}
              avatarStyle={memberAvatarStyle}
            />
          </View>

          <Text style={styles.memberName}>{checkin.name}</Text>

          {memberBio ? (
            <Text style={styles.memberBio}>{memberBio}</Text>
          ) : null}

          <View style={styles.vibeBadge}>
            <Text style={styles.vibeBadgeText}>{checkin.vibe}</Text>
          </View>

          {checkin.custom_vibe ? (
            <Text style={styles.memberCustomVibe}>{checkin.custom_vibe}</Text>
          ) : null}

          {checkin.open_to_chat ? (
            <View style={styles.opennessChip}>
              <Text style={styles.opennessChipText}>Open to chat</Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          {isOwnCard && (
            <Text style={styles.stateTitle}>This is your check-in.</Text>
          )}

          {!isOwnCard && isInactive && (
            <Text style={styles.stateTitle}>This person has checked out.</Text>
          )}

          {isBlocked && (
            <Text style={styles.stateTitle}>You've blocked this person.</Text>
          )}

          {!isBlocked && hasThread && (
            <View style={styles.threadBox}>
              <Text style={styles.threadBoxLabel}>You've already reached out</Text>
              <Text style={styles.threadBoxHint}>Your conversation is waiting.</Text>
              <TouchableOpacity
                style={styles.viewConvoBtn}
                onPress={() => router.replace(`/conversation/${existingThreadId}`)}
                activeOpacity={0.7}
              >
                <Text style={styles.viewConvoBtnText}>View conversation</Text>
              </TouchableOpacity>
            </View>
          )}

          {showForm && (
            <View style={styles.form}>
              <Text style={styles.formLabel}>Send an intro</Text>
              <Text style={styles.formHint}>
                One message to start things off. Keep it real.
              </Text>

              <TextInput
                style={styles.messageInput}
                placeholder="Hi! I noticed you're working on…"
                placeholderTextColor={colors.textSecondary}
                value={text}
                onChangeText={(v) => setText(v.slice(0, 150))}
                multiline
                editable={!sending}
              />
              <Text style={styles.charCount}>{text.length}/150</Text>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
                disabled={!text.trim() || sending}
                onPress={handleSend}
                activeOpacity={0.85}
              >
                {sending
                  ? <ActivityIndicator color={colors.textPrimary} />
                  : <Text style={styles.sendButtonText}>Send intro</Text>
                }
              </TouchableOpacity>
            </View>
          )}

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

                  <TextInput
                    style={styles.reportNoteInput}
                    placeholder="Anything else? (optional)"
                    placeholderTextColor={colors.textSecondary}
                    value={reportNote}
                    onChangeText={setReportNote}
                    multiline
                  />

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
                      ? <ActivityIndicator color={colors.textPrimary} size="small" />
                      : <Text style={styles.reportSubmitText}>Send report</Text>
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
                        ? <ActivityIndicator color={colors.textSecondary} size="small" />
                        : <Text style={styles.safetyLink}>Unblock</Text>
                      }
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={handleBlock} disabled={blocking} activeOpacity={0.6}>
                      {blocking
                        ? <ActivityIndicator color={colors.textSecondary} size="small" />
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
  safe:   { flex: 1, backgroundColor: colors.background },
  flex:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scroll: { padding: 24, paddingBottom: 48 },
  back:   { marginBottom: 28 },

  avatarWrap: {
    marginBottom: 16,
  },

  memberName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },

  vibeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 10,
  },
  vibeBadgeText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  memberCustomVibe: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 6,
  },

  opennessChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.statusOpen,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 8,
  },
  opennessChipText: {
    fontSize: 13,
    color: '#2B6B42',
    fontWeight: '500',
  },

  memberBio: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },

  divider:    { height: 1, backgroundColor: colors.surface, marginVertical: 28 },
  stateTitle: { fontSize: 16, fontWeight: '500', color: colors.textSecondary },

  threadBox:      { gap: 12 },
  threadBoxLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  threadBoxHint:  { fontSize: 14, color: colors.textSecondary },
  viewConvoBtn: {
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  viewConvoBtnText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },

  form:      { gap: 8 },
  formLabel: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  formHint:  { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
  messageInput: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 4,
  },
  charCount: { fontSize: 12, color: colors.textSecondary, textAlign: 'right', marginBottom: 8 },
  error:     { fontSize: 14, color: '#EF4444' },
  sendButton: {
    backgroundColor: '#DFAF3A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText:     { fontSize: 16, fontWeight: '700', color: colors.textPrimary },

  safetyLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginTop: 48,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  safetyLink:    { fontSize: 13, color: colors.textSecondary },
  safetyDivider: { fontSize: 13, color: colors.textSecondary },
  safetyState:   { marginTop: 40, gap: 8 },
  safetyStateTitle: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  safetyStateBody:  { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  reportForm: {
    marginTop: 32,
    gap: 10,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  reportFormLabel: { fontSize: 15, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
  reasonCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  reasonCardSelected: { borderColor: colors.accent },
  reasonText:         { fontSize: 14, color: colors.textSecondary },
  reasonTextSelected: { color: colors.textPrimary, fontWeight: '500' },
  reportNoteInput: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 60,
    textAlignVertical: 'top',
    marginTop: 4,
  },
  reportSubmitBtn: {
    backgroundColor: '#DFAF3A',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  reportSubmitDisabled: { opacity: 0.4 },
  reportSubmitText:     { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  cancelReport:         { alignItems: 'center', paddingVertical: 10 },
  cancelReportText:     { fontSize: 14, color: colors.textSecondary },
})
