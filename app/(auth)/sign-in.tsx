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

export default function SignInScreen() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const canSubmit = email.trim().length > 0 && password.length > 0

  async function handleSignIn() {
    if (!canSubmit || loading) return
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    setLoading(false)

    if (authError) {
      const isCredentialsError =
        authError.message?.toLowerCase().includes('invalid login') ||
        authError.message?.toLowerCase().includes('invalid credentials')
      setError(
        isCredentialsError
          ? "Hmm, that didn't work. Double-check and try again."
          : "Something's off on our end. Give it another shot."
      )
      return
    }
    // onAuthStateChange in root layout handles redirect
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
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)')} style={styles.back}>
            <ChevronLeft size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.heading}>Good to see you.</Text>
          <Text style={styles.subheading}>Pick up where you left off.</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Your password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
            editable={!loading}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, (!canSubmit || loading) && styles.buttonDisabled]}
            disabled={!canSubmit || loading}
            onPress={handleSignIn}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={colors.textPrimary} />
              : <Text style={styles.buttonText}>Let me in</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchLink}
            onPress={() => router.replace('/(auth)/sign-up')}
            disabled={loading}
          >
            <Text style={styles.switchText}>
              Don't have an account?{' '}
              <Text style={styles.switchHighlight}>Join us</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: colors.background },
  flex:  { flex: 1 },
  scroll: { padding: 24, paddingBottom: 48 },
  back:  { marginBottom: 32 },
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
  error: {
    fontSize: 14,
    fontWeight: '500',
    color: '#C0392B',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#DFAF3A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  switchLink:      { alignItems: 'center' },
  switchText:      { fontSize: 14, color: colors.textSecondary },
  switchHighlight: { color: colors.textPrimary, fontWeight: '600' },
})
