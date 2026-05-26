import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { supabase } from '../lib/supabase'
import { Avatar, AvatarStyle } from '../components/Avatar'
import { colors } from '../.claude/tokens/colors'

// Personas tier removed 2026-05-27 (roadmap 7.1). Was gated behind email
// verification as a "premium" feature with no actual monetization. Existing
// users with personas selected continue to render — Avatar.tsx still
// supports the URL — they just can't pick it again. The `personas` value
// is intentionally kept in AvatarStyle for backwards compatibility.
const STYLES: { key: AvatarStyle; label: string; premium?: boolean }[] = [
  { key: 'thumbs',            label: 'Thumbs'    },
  { key: 'avataaars-neutral', label: 'Avataaars' },
]

const EXPERIENCE_LEVELS = [
  'New to this',
  'Getting the hang of it',
  'Pretty consistent',
  'Been at it for years',
]

const FITNESS_GOALS = [
  'Build strength',
  'Cardio & endurance',
  'Lose weight',
  'Stay active',
  'Train for a sport',
]

const GRID_COUNT = 9
const { width: SCREEN_WIDTH } = Dimensions.get('window')
// 24px padding each side, 8px gap × 2 between 3 columns
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 48 - 16) / 3)

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 14)
}

function generateSeeds(): string[] {
  return Array.from({ length: GRID_COUNT }, randomSeed)
}

export default function EditProfileScreen() {
  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [userId, setUserId]               = useState<string | null>(null)

  const [name, setName]                   = useState('')
  const [bio, setBio]                     = useState('')
  const [avatarStyle, setAvatarStyle]     = useState<AvatarStyle>('thumbs')
  const [selectedSeed, setSelectedSeed]   = useState('')
  const [gridSeeds, setGridSeeds]         = useState<string[]>([])

  const [email, setEmail]                 = useState('')
  const [emailConfirmed, setEmailConfirmed] = useState(false)
  const [newEmail, setNewEmail]           = useState('')
  const [emailSaving, setEmailSaving]     = useState(false)
  const [emailSaveMsg, setEmailSaveMsg]   = useState<string | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)
  const [showChangeEmail, setShowChangeEmail] = useState(false)

  const [showGymsVisited, setShowGymsVisited]               = useState(true)
  const [showConnectionsStarted, setShowConnectionsStarted] = useState(true)
  const [showCurrentGym, setShowCurrentGym]                 = useState(false)
  const [showExperienceLevel, setShowExperienceLevel]       = useState(true)
  const [showFitnessGoal, setShowFitnessGoal]               = useState(true)

  // Notification preferences (separate from privacy — concerns delivery, not visibility).
  const [notifyGymActivity, setNotifyGymActivity] = useState(true)

  const [experienceLevel, setExperienceLevel] = useState<string | null>(null)
  const [fitnessGoal, setFitnessGoal]         = useState<string | null>(null)

  useEffect(() => {
    async function boot() {
      const [{ data: { user } }] = await Promise.all([supabase.auth.getUser()])
      if (!user) { setLoading(false); return }

      setUserId(user.id)
      setName(user.user_metadata?.name ?? '')
      setEmail(user.email ?? '')
      setEmailConfirmed(!!user.email_confirmed_at)

      const { data: profile } = await supabase
        .from('profiles')
        .select('bio, avatar_seed, avatar_style, show_gyms_visited, show_connections_started, show_current_gym, show_experience_level, show_fitness_goal, experience_level, fitness_goal, notify_gym_activity')
        .eq('id', user.id)
        .maybeSingle()

      setBio(profile?.bio ?? '')
      setAvatarStyle((profile?.avatar_style as AvatarStyle | null) ?? 'thumbs')
      setSelectedSeed(profile?.avatar_seed ?? randomSeed())
      setGridSeeds(generateSeeds())

      setShowGymsVisited(profile?.show_gyms_visited ?? true)
      setShowConnectionsStarted(profile?.show_connections_started ?? true)
      setShowCurrentGym(profile?.show_current_gym ?? false)
      setShowExperienceLevel(profile?.show_experience_level ?? true)
      setShowFitnessGoal(profile?.show_fitness_goal ?? true)
      setNotifyGymActivity(profile?.notify_gym_activity ?? true)

      setExperienceLevel(profile?.experience_level ?? null)
      setFitnessGoal(profile?.fitness_goal ?? null)

      setLoading(false)
    }
    boot()
  }, [])

  function handleStyleSwitch(s: AvatarStyle) {
    setAvatarStyle(s)
  }

  async function handleEmailUpdate() {
    const trimmed = newEmail.trim().toLowerCase()
    if (!trimmed || emailSaving) return
    setEmailSaving(true)
    setEmailSaveMsg(null)

    const { error } = await supabase.auth.updateUser({ email: trimmed })
    setEmailSaving(false)

    if (error) {
      setEmailSaveMsg("Couldn't update email. Try again.")
    } else {
      setEmailSaveMsg('Check your new inbox to confirm the change.')
      setNewEmail('')
    }
  }

  async function handleResendVerification() {
    if (!email) return
    await supabase.auth.resend({ type: 'signup', email })
    setVerificationSent(true)
  }

  function handleShuffle() {
    const next = generateSeeds()
    setGridSeeds(next)
    // keep current selection unless it was in the old grid (it may have been from profile)
  }

  async function savePrivacyField(field: string, value: boolean) {
    if (!userId) return
    await supabase.from('profiles').update({ [field]: value }).eq('id', userId)
  }

  async function handleSave() {
    if (!userId || saving) return
    const trimmed = name.trim()
    if (!trimmed) { setError('Name is required.'); return }

    setSaving(true)
    setError(null)

    const [authRes, profileRes] = await Promise.all([
      supabase.auth.updateUser({ data: { name: trimmed } }),
      supabase
        .from('profiles')
        .update({
          name:             trimmed,
          bio:              bio.trim() || null,
          avatar_seed:      selectedSeed,
          avatar_style:     avatarStyle,
          experience_level: experienceLevel,
          fitness_goal:     fitnessGoal,
        })
        .eq('id', userId),
    ])

    setSaving(false)

    if (authRes.error || profileRes.error) {
      setError('Something went wrong. Try again.')
      return
    }

    router.back()
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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <ChevronLeft size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.heading}>Edit profile</Text>
          <View style={styles.backBtn} />
        </View>

        {/* Avatar preview */}
        <View style={styles.previewWrap}>
          <Avatar
            seed={selectedSeed}
            name={name || 'You'}
            size={88}
            avatarStyle={avatarStyle}
            bg={colors.surface}
            fg={colors.textPrimary}
          />
        </View>

        {/* Style chips */}
        <Text style={styles.sectionLabel}>Avatar style</Text>
        <View style={styles.styleRow}>
          {STYLES.map((s) => {
            const isSelected = avatarStyle === s.key
            return (
              <TouchableOpacity
                key={s.key}
                style={[styles.styleChip, isSelected && styles.styleChipSelected]}
                onPress={() => handleStyleSwitch(s.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.styleChipText, isSelected && styles.styleChipTextSelected]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
        {/* Avatar grid */}
        <View style={styles.grid}>
          {gridSeeds.map((seed) => (
            <TouchableOpacity
              key={seed}
              style={[
                styles.gridCell,
                { width: CELL_SIZE, height: CELL_SIZE },
                selectedSeed === seed && styles.gridCellSelected,
              ]}
              onPress={() => setSelectedSeed(seed)}
              activeOpacity={0.75}
            >
              <Avatar
                seed={seed}
                name={name || 'You'}
                size={CELL_SIZE - 16}
                avatarStyle={avatarStyle}
                bg={colors.background}
                fg={colors.textPrimary}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.shuffleBtn} onPress={handleShuffle} activeOpacity={0.7}>
          <Text style={styles.shuffleBtnText}>Shuffle</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Name */}
        <Text style={styles.sectionLabel}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(t) => setName(t.slice(0, 50))}
          placeholder="Your name"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="done"
          autoCorrect={false}
        />

        {/* Bio */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>About you</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={(t) => setBio(t.slice(0, 100))}
          placeholder="What brings you to the gym?"
          placeholderTextColor={colors.textSecondary}
          multiline
          returnKeyType="done"
          blurOnSubmit
        />
        <Text style={styles.charCount}>{bio.length}/100</Text>

        {/* Experience level */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Experience level</Text>
        <View style={styles.chipRow}>
          {EXPERIENCE_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.chip, experienceLevel === level && styles.chipSelected]}
              onPress={() => setExperienceLevel(experienceLevel === level ? null : level)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, experienceLevel === level && styles.chipTextSelected]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fitness goal */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Fitness goal</Text>
        <View style={styles.chipRow}>
          {FITNESS_GOALS.map((goal) => (
            <TouchableOpacity
              key={goal}
              style={[styles.chip, fitnessGoal === goal && styles.chipSelected]}
              onPress={() => setFitnessGoal(fitnessGoal === goal ? null : goal)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, fitnessGoal === goal && styles.chipTextSelected]}>
                {goal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Email */}
        <Text style={styles.sectionLabel}>Email</Text>
        <View style={styles.emailCurrentRow}>
          <Text style={styles.emailCurrentText}>{email}</Text>
          {!emailConfirmed && (
            <View style={styles.unverifiedBadge}>
              <Text style={styles.unverifiedBadgeText}>Not verified</Text>
            </View>
          )}
        </View>

        {!emailConfirmed && (
          verificationSent ? (
            <Text style={styles.verificationSentMsg}>
              Verification sent. Check your inbox when you're ready.
            </Text>
          ) : (
            <TouchableOpacity
              style={styles.verifyEmailBtn}
              onPress={handleResendVerification}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>Verify email</Text>
            </TouchableOpacity>
          )
        )}

        <TouchableOpacity
          style={styles.changeEmailLink}
          onPress={() => { setShowChangeEmail(v => !v); setEmailSaveMsg(null) }}
          activeOpacity={0.7}
        >
          <Text style={styles.changeEmailLinkText}>
            {showChangeEmail ? 'Cancel' : 'Change email'}
          </Text>
        </TouchableOpacity>

        {showChangeEmail && (
          <>
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              value={newEmail}
              onChangeText={(v) => { setNewEmail(v); setEmailSaveMsg(null) }}
              placeholder="New email address"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="done"
            />
            {emailSaveMsg ? (
              <Text style={[styles.charCount, { color: emailSaveMsg.startsWith('Check') ? colors.accent : '#C0392B' }]}>
                {emailSaveMsg}
              </Text>
            ) : null}
            <TouchableOpacity
              style={[styles.updateEmailBtn, (!newEmail.trim() || emailSaving) && styles.saveBtnDisabled]}
              disabled={!newEmail.trim() || emailSaving}
              onPress={handleEmailUpdate}
              activeOpacity={0.85}
            >
              {emailSaving
                ? <ActivityIndicator color={colors.textPrimary} />
                : <Text style={styles.saveBtnText}>Update email</Text>
              }
            </TouchableOpacity>
          </>
        )}

        <View style={styles.divider} />

        {/* Privacy */}
        <Text style={styles.sectionLabel}>What others can see on your profile</Text>
        {([
          { field: 'show_gyms_visited',        label: 'Gyms visited',          value: showGymsVisited,        set: setShowGymsVisited },
          { field: 'show_connections_started',  label: 'Connections started',   value: showConnectionsStarted, set: setShowConnectionsStarted },
          { field: 'show_current_gym',          label: 'Current gym',           value: showCurrentGym,         set: setShowCurrentGym },
          { field: 'show_experience_level',     label: 'Experience level',      value: showExperienceLevel,    set: setShowExperienceLevel },
          { field: 'show_fitness_goal',         label: 'Fitness goal',          value: showFitnessGoal,        set: setShowFitnessGoal },
        ] as { field: string; label: string; value: boolean; set: (v: boolean) => void }[]).map((item) => (
          <View key={item.field} style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>{item.label}</Text>
            <Switch
              value={item.value}
              onValueChange={(v) => {
                item.set(v)
                savePrivacyField(item.field, v)
              }}
              trackColor={{ false: '#C8C2BB', true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        ))}

        <View style={styles.divider} />

        {/* Notifications */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.privacyRow}>
          <View style={{ flex: 1, gap: 2, paddingRight: 12 }}>
            <Text style={styles.privacyLabel}>Activity at my gyms</Text>
            <Text style={styles.privacyHint}>Get a quiet ping when someone checks in at a gym in your list.</Text>
          </View>
          <Switch
            value={notifyGymActivity}
            onValueChange={(v) => {
              setNotifyGymActivity(v)
              savePrivacyField('notify_gym_activity', v)
            }}
            trackColor={{ false: '#C8C2BB', true: colors.accent }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.divider} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          disabled={saving}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color={colors.textPrimary} />
            : <Text style={styles.saveBtnText}>Save</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 24, paddingBottom: 48 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backBtn: { width: 32 },
  heading: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },

  previewWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
  },

  styleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  styleChip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  styleChipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  styleChipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  styleChipTextSelected: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  emailCurrentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emailCurrentText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  unverifiedBadge: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  unverifiedBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  updateEmailBtn: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  verifyEmailBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  verificationSentMsg: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  changeEmailLink: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  changeEmailLinkText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  gridCell: {
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gridCellSelected: {
    borderColor: colors.accent,
  },

  shuffleBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: 4,
  },
  shuffleBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  divider: {
    height: 1,
    backgroundColor: colors.surface,
    marginVertical: 24,
  },

  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 4,
  },

  error: {
    fontSize: 14,
    color: '#C0392B',
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: colors.textPrimary,
    fontWeight: '600',
  },

  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  privacyLabel: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  privacyHint: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
})
