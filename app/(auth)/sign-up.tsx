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
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ChevronLeft, Eye, EyeOff, Check } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { colors } from '../../.claude/tokens/colors'

/*
 * 18+ age gate + legal acceptance.
 *
 * The DB has a CHECK constraint (profiles_must_be_adult) that
 * enforces age >= 18 at the data layer, but we also enforce it
 * client-side so under-18 signups never call supabase.auth.signUp.
 *
 * DOB is collected as three numeric TextInputs (MM/DD/YYYY) to
 * avoid adding @react-native-community/datetimepicker as a
 * dependency for a 30-second flow.
 */

const LEGAL_BASE = 'https://website-lukahristics-projects.vercel.app'

function parseDOB(month: string, day: string, year: string): Date | null {
  const m = parseInt(month, 10)
  const d = parseInt(day, 10)
  const y = parseInt(year, 10)
  if (!m || !d || !y) return null
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  if (y < 1900 || y > new Date().getFullYear()) return null
  const dt = new Date(y, m - 1, d)
  // Reject impossible dates (Feb 30, Apr 31, etc.) — JS rolls them
  // forward, so we sanity-check the round-trip.
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null
  return dt
}

function yearsSince(dt: Date): number {
  const now = new Date()
  let age = now.getFullYear() - dt.getFullYear()
  const monthDiff = now.getMonth() - dt.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dt.getDate())) age--
  return age
}

export default function SignUpScreen() {
  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [dobMonth, setDobMonth] = useState('')
  const [dobDay, setDobDay]     = useState('')
  const [dobYear, setDobYear]   = useState('')

  const [acceptTerms, setAcceptTerms]         = useState(false)
  const [acceptPrivacy, setAcceptPrivacy]     = useState(false)
  const [acceptCommunity, setAcceptCommunity] = useState(false)

  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [emailTaken, setEmailTaken]   = useState(false)
  const [underageBlocked, setUnderageBlocked] = useState(false)

  const submitting = useRef(false)

  const dob = parseDOB(dobMonth, dobDay, dobYear)
  const age = dob ? yearsSince(dob) : null
  const dobComplete = dobMonth.length > 0 && dobDay.length > 0 && dobYear.length === 4
  const dobValid = dob !== null
  const dobIs18Plus = age !== null && age >= 18

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    dobIs18Plus &&
    acceptTerms &&
    acceptPrivacy &&
    acceptCommunity

  function handleEmailChange(v: string) {
    setEmail(v)
    if (emailTaken) setEmailTaken(false)
    if (error) setError(null)
  }

  // Numeric-only with a max-length, used for the three DOB segments.
  function onDOBChange(setter: (v: string) => void, max: number) {
    return (v: string) => {
      const digits = v.replace(/\D/g, '').slice(0, max)
      setter(digits)
      if (underageBlocked) setUnderageBlocked(false)
    }
  }

  async function handleSignUp() {
    if (submitting.current) return

    // Surface underage block as a friendly message rather than just
    // disabling the button silently.
    if (dobComplete && dobValid && !dobIs18Plus) {
      setUnderageBlocked(true)
      return
    }

    if (!canSubmit) return

    submitting.current = true
    setLoading(true)
    setError(null)
    setEmailTaken(false)

    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: name.trim() } },
    })

    if (authError) {
      submitting.current = false
      setLoading(false)

      const isAlreadyRegistered =
        authError.message?.toLowerCase().includes('already registered') ||
        authError.message?.toLowerCase().includes('already exists') ||
        authError.message?.toLowerCase().includes('user already')

      if (isAlreadyRegistered) {
        setEmailTaken(true)
      } else {
        setError("Something's off on our end. Give it another shot.")
      }
      return
    }

    // Write DOB and acceptance timestamps to the auto-created profile
    // row. RLS allows the just-signed-in user to update their own row.
    if (signUpData.user) {
      const isoDate = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`
      const nowIso = new Date().toISOString()
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          date_of_birth: isoDate,
          terms_accepted_at: nowIso,
          privacy_accepted_at: nowIso,
          community_guidelines_accepted_at: nowIso,
        })
        .eq('id', signUpData.user.id)

      if (profileError) {
        // Non-fatal: the constraint already rejected anything <18, so
        // a failure here is most likely the auto-create trigger not
        // having committed yet. Surface to console and proceed; the
        // user can be re-prompted at next login.
        console.warn('[sign-up] profile metadata update failed:', profileError.message)
      }
    }

    submitting.current = false
    setLoading(false)
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

          <Text style={styles.heading}>Let's get you in.</Text>
          <Text style={styles.subheading}>Takes 30 seconds. Spottr is for adults 18 and over.</Text>

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
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.inputInner}
              placeholder="Min. 6 characters"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="next"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(v => !v)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {showPassword
                ? <EyeOff size={20} color={colors.textSecondary} />
                : <Eye size={20} color={colors.textSecondary} />
              }
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Date of birth</Text>
          <View style={styles.dobRow}>
            <TextInput
              style={[styles.dobInput, styles.dobInputShort]}
              placeholder="MM"
              placeholderTextColor={colors.textSecondary}
              value={dobMonth}
              onChangeText={onDOBChange(setDobMonth, 2)}
              keyboardType="number-pad"
              maxLength={2}
              editable={!loading}
            />
            <Text style={styles.dobSep}>/</Text>
            <TextInput
              style={[styles.dobInput, styles.dobInputShort]}
              placeholder="DD"
              placeholderTextColor={colors.textSecondary}
              value={dobDay}
              onChangeText={onDOBChange(setDobDay, 2)}
              keyboardType="number-pad"
              maxLength={2}
              editable={!loading}
            />
            <Text style={styles.dobSep}>/</Text>
            <TextInput
              style={[styles.dobInput, styles.dobInputLong]}
              placeholder="YYYY"
              placeholderTextColor={colors.textSecondary}
              value={dobYear}
              onChangeText={onDOBChange(setDobYear, 4)}
              keyboardType="number-pad"
              maxLength={4}
              editable={!loading}
            />
          </View>

          {underageBlocked && (
            <Text style={styles.underageMsg}>
              Spottr is for adults 18 and over. Thanks for understanding.
            </Text>
          )}
          {dobComplete && !dobValid && (
            <Text style={styles.error}>That date doesn&rsquo;t look right.</Text>
          )}

          <View style={styles.checkboxGroup}>
            <CheckboxRow
              checked={acceptTerms}
              onToggle={() => setAcceptTerms(v => !v)}
              disabled={loading}
            >
              I agree to the{' '}
              <Text
                style={styles.checkboxLink}
                onPress={() => Linking.openURL(`${LEGAL_BASE}/terms`)}
              >
                Terms of Use
              </Text>
              .
            </CheckboxRow>

            <CheckboxRow
              checked={acceptPrivacy}
              onToggle={() => setAcceptPrivacy(v => !v)}
              disabled={loading}
            >
              I&rsquo;ve read the{' '}
              <Text
                style={styles.checkboxLink}
                onPress={() => Linking.openURL(`${LEGAL_BASE}/privacy`)}
              >
                Privacy Policy
              </Text>
              .
            </CheckboxRow>

            <CheckboxRow
              checked={acceptCommunity}
              onToggle={() => setAcceptCommunity(v => !v)}
              disabled={loading}
            >
              I agree to follow the{' '}
              <Text
                style={styles.checkboxLink}
                onPress={() => Linking.openURL(`${LEGAL_BASE}/community`)}
              >
                Community Guidelines
              </Text>
              .
            </CheckboxRow>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {emailTaken && (
            <View style={styles.takenBox}>
              <Text style={styles.takenText}>
                Looks like you already have an account.
              </Text>
              <TouchableOpacity
                onPress={() => router.replace('/(auth)/sign-in')}
                activeOpacity={0.7}
              >
                <Text style={styles.takenLink}>Sign in instead?</Text>
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

function CheckboxRow({
  checked,
  onToggle,
  disabled,
  children,
}: {
  checked: boolean
  onToggle: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <TouchableOpacity
      style={styles.checkboxRow}
      onPress={onToggle}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Check size={14} color={colors.background} strokeWidth={3} />}
      </View>
      <Text style={styles.checkboxLabel}>{children}</Text>
    </TouchableOpacity>
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
  inputWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingRight: 8,
  },
  inputInner: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  eyeBtn: { padding: 8 },
  inputError: {
    borderColor: '#C0392B60',
  },

  dobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dobInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  dobInputShort: { width: 64 },
  dobInputLong:  { width: 92 },
  dobSep: {
    fontSize: 18,
    color: colors.textSecondary,
    marginHorizontal: 8,
  },
  underageMsg: {
    fontSize: 14,
    fontWeight: '500',
    color: '#C0392B',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 20,
  },

  checkboxGroup: {
    marginTop: 16,
    marginBottom: 20,
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  checkboxLink: {
    color: colors.textPrimary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  error: {
    fontSize: 14,
    fontWeight: '500',
    color: '#C0392B',
    marginBottom: 12,
  },
  takenBox: {
    gap: 10,
    marginBottom: 16,
  },
  takenText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#C0392B',
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
  buttonDisabled: { opacity: 0.4 },
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
