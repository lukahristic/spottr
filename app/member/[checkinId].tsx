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

export default function MemberScreen() {
  const { checkinId } = useLocalSearchParams<{ checkinId: string }>()

  const [checkin, setCheckin]         = useState<CheckIn | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [alreadySent, setAlreadySent] = useState(false)
  const [sentMessage, setSentMessage] = useState<SentMessage | null>(null)
  const [loading, setLoading]         = useState(true)
  const [text, setText]               = useState('')
  const [sending, setSending]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [success, setSuccess]         = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: checkinData }, { data: { user } }] = await Promise.all([
        supabase.from('checkins').select('*').eq('id', checkinId).single(),
        supabase.auth.getUser(),
      ])

      setCheckin(checkinData as CheckIn | null)
      setCurrentUser(user)

      if (user && checkinData) {
        const { data: existing } = await supabase
          .from('messages')
          .select('id, text')
          .eq('sender_id', user.id)
          .eq('checkin_id', checkinId)
          .maybeSingle()

        if (existing) {
          setAlreadySent(true)
          setSentMessage(existing as SentMessage)
        }
      }

      setLoading(false)
    }

    load()
  }, [checkinId])

  async function handleSend() {
    if (!text.trim() || sending || !checkin || !currentUser) return
    setSending(true)
    setError(null)

    // Sender must be checked in — get their active checkin for status
    const { data: senderCheckin } = await supabase
      .from('checkins')
      .select('status')
      .eq('user_id', currentUser.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!senderCheckin) {
      setError('You need to check in first before sending a message.')
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
          ? "You've already messaged this person during this check-in."
          : 'Could not send message. Try again.'
      )
      return
    }

    setSuccess(true)
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

  const meta       = STATUS_META[checkin.status]
  const isOwnCard  = checkin.user_id === currentUser?.id
  const isInactive = !checkin.is_active
  const showForm   = !isOwnCard && !isInactive && !alreadySent && !success

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

          {(alreadySent || success) && (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>Message sent ✓</Text>
              <View style={styles.sentPreview}>
                <Text style={styles.sentText}>"{displayedSentText}"</Text>
              </View>
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
  successBox:  { gap: 12 },
  successTitle: { fontSize: 16, fontWeight: '600', color: '#22C55E' },
  sentPreview: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    padding: 14,
  },
  sentText: { fontSize: 15, color: '#AAAAAA', lineHeight: 22 },
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
})
