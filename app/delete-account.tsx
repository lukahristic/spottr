import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { supabase } from '../lib/supabase'
import { colors } from '../.claude/tokens/colors'

/*
 * Account deletion confirmation screen.
 *
 * Requires the user to type "DELETE" before the destructive button
 * activates. On confirm, calls the delete-account edge function,
 * which deletes profile/messages/threads/checkins/blocks/reports +
 * the auth user. The auth state change tears the session down and
 * the root layout routes back to the landing screen.
 *
 * This flow exists to satisfy App Store / Play Store self-serve
 * deletion requirements.
 */

const CONFIRM_WORD = 'DELETE'

export default function DeleteAccountScreen() {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const canDelete = confirmText.trim().toUpperCase() === CONFIRM_WORD

  async function handleDelete() {
    if (!canDelete || loading) return
    setLoading(true)
    setError(null)

    const { error: fnError } = await supabase.functions.invoke('delete-account')

    if (fnError) {
      setLoading(false)
      setError(
        "We couldn't complete the delete. Please try again, or email hello@spottr.app for help."
      )
      return
    }

    // Force a clean sign-out so the local session is cleared even if
    // the auth user was deleted server-side before the client noticed.
    await supabase.auth.signOut()

    // Loading stays true through the redirect for visual continuity.
    Alert.alert('Account deleted', 'Your account and data have been removed.')
    router.replace('/(auth)')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.back}
          disabled={loading}
        >
          <ChevronLeft size={22} color={colors.textSecondary} />
        </TouchableOpacity>

        <Text style={styles.heading}>Delete account</Text>
        <Text style={styles.body}>
          This permanently deletes your profile, messages, check-in history,
          and verification status. Your blocks and reports are removed.
        </Text>
        <Text style={styles.body}>
          <Text style={styles.bodyStrong}>This cannot be undone.</Text>
        </Text>

        <Text style={styles.label}>Type {CONFIRM_WORD} to confirm</Text>
        <TextInput
          style={styles.input}
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!loading}
          placeholder={CONFIRM_WORD}
          placeholderTextColor={colors.textSecondary}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.deleteButton, (!canDelete || loading) && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={!canDelete || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.deleteButtonText}>Delete my account</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingBottom: 48 },
  back:   { marginBottom: 32 },

  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  bodyStrong: {
    color: '#C0392B',
    fontWeight: '600',
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 24,
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 20,
    letterSpacing: 2,
  },

  error: {
    fontSize: 14,
    fontWeight: '500',
    color: '#C0392B',
    marginBottom: 12,
    lineHeight: 20,
  },

  deleteButton: {
    backgroundColor: '#C0392B',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  deleteButtonDisabled: { opacity: 0.4 },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
})
