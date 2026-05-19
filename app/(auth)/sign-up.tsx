import { useRef, useState } from 'react'
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

export default function SignUpScreen() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [emailTaken, setEmailTaken] = useState(false)

  // Ref guard prevents double-submission even before React re-renders
  const submitting = useRef(false)

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6

  function handleEmailChange(v: string) {
    setEmail(v)
    if (emailTaken) setEmailTaken(false)
    if (error) setError(null)
  }

  async function handleSignUp() {
    if (!canSubmit || submitting.current) return

    submitting.current = true
    setLoading(true)
    setError(null)
    setEmailTaken(false)

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: name.trim() } },
    })

    submitting.current = false
    setLoading(false)

    if (authError) {
      const isAlreadyRegistered =
        authError.message?.toLowerCase().includes('already registered') ||
        authError.message?.toLowerCase().includes('already exists') ||
        authError.message?.toLowerCase().includes('user already')

      if (isAlreadyRegistered) {
        setEmailTaken(true)
      } else {
        setError('Something went wrong. Try again.')
      }
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
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <ChevronLeft size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.heading}>Let's get you in.</Text>
          <Text style={styles.subheading}>Takes 30 seconds. No gym experience required.</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
            editable={!loading}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, emailTaken && styles.inputError]}
            placeholder="you@example.com"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={handleEmailChange}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Min. 6 characters"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
            editable={!loading}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {emailTaken && (
            <View style={styles.takenBox}>
              <Text style={styles.takenText}>
                This email already has an account.
              </Text>
              <TouchableOpacity
                onPress={() => router.replace('/(auth)/sign-in')}
                activeOpacity={0.7}
              >
                <Text style={styles.takenLink}>Sign in instead →</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, (!canSubmit || loading) && styles.buttonDisabled]}
            disabled={!canSubmit || loading}
            onPress={handleSignUp}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={colors.textPrimary} />
              : <Text style={styles.buttonText}>I'm in</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchLink}
            onPress={() => router.replace('/(auth)/sign-in')}
            disabled={loading}
          >
            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text style={styles.switchHighlight}>Sign in</Text>
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
  back:     { marginBottom: 32 },
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
  inputError: {
    borderColor: '#EF444460',
  },
  error: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 12,
  },
  takenBox: {
    gap: 10,
    marginBottom: 16,
  },
  takenText: {
    fontSize: 14,
    color: '#EF4444',
    lineHeight: 20,
  },
  takenLink: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#DFAF3A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  buttonDisabled: { backgroundColor: colors.surface },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2B2B2B',
    letterSpacing: 0.3,
  },
  switchLink:      { alignItems: 'center' },
  switchText:      { fontSize: 14, color: colors.textSecondary },
  switchHighlight: { color: colors.textPrimary, fontWeight: '600' },
})
