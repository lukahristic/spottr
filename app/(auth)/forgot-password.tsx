import { useState } from 'react'
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
import { router } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { colors } from '../../.claude/tokens/colors'

export default function ForgotPasswordScreen() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  const canSubmit = email.trim().length > 0

  async function handleSend() {
    if (!canSubmit || loading) return
    setLoading(true)

    await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: 'spottr://reset-password',
    })

    setLoading(false)
    setSent(true)
  }

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
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/sign-in')}
            style={styles.back}
          >
            <ChevronLeft size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          {sent ? (
            <View style={styles.sentWrap}>
              <Text style={styles.heading}>Check your inbox.</Text>
              <Text style={styles.subheading}>
                If an account exists for that email, we sent a password reset link. It may take a minute.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => router.replace('/(auth)/sign-in')}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>Back to sign in</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.heading}>Forgot your password?</Text>
              <Text style={styles.subheading}>
                Enter your email and we'll send a reset link.
              </Text>

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="send"
                onSubmitEditing={handleSend}
                editable={!loading}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.button, (!canSubmit || loading) && styles.buttonDisabled]}
                disabled={!canSubmit || loading}
                onPress={handleSend}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color={colors.textPrimary} />
                  : <Text style={styles.buttonText}>Send reset link</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.background },
  flex:    { flex: 1 },
  scroll:  { padding: 24, paddingBottom: 48 },
  back:    { marginBottom: 32 },
  sentWrap: { gap: 16 },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 36,
    lineHeight: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
    marginTop: 4,
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
  },
  button: {
    backgroundColor: '#DFAF3A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
})
