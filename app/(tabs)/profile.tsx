import { useCallback, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native'
import Constants from 'expo-constants'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { Avatar, AvatarStyle } from '../../components/Avatar'
import { colors } from '../../.claude/tokens/colors'

const LEGAL_BASE = 'https://website-lukahristics-projects.vercel.app'
const APP_VERSION = Constants.expoConfig?.version ?? '—'

export default function ProfileScreen() {
  const [name, setName]                   = useState<string>('—')
  const [userId, setUserId]               = useState<string | null>(null)
  const [bio, setBio]                     = useState<string | null>(null)
  const [avatarSeed, setAvatarSeed]       = useState<string | null>(null)
  const [avatarStyle, setAvatarStyle]     = useState<AvatarStyle>('thumbs')
  const [photoUrl, setPhotoUrl]           = useState<string | null>(null)
  const [activeCheckinId, setActiveCheckinId] = useState<string | null>(null)
  const [currentVibe, setCurrentVibe]         = useState<string | null>(null)
  const [currentCustomVibe, setCurrentCustomVibe] = useState<string | null>(null)
  const [openToChat, setOpenToChat]       = useState(false)
  const [womenVerified, setWomenVerified]         = useState(false)
  const [verificationRequested, setVerificationRequested] = useState(false)

  const [showGymsVisited, setShowGymsVisited]               = useState(false)
  const [showConnectionsStarted, setShowConnectionsStarted] = useState(false)
  const [showCurrentGym, setShowCurrentGym]                 = useState(false)
  const [showExperienceLevel, setShowExperienceLevel]       = useState(false)
  const [showFitnessGoal, setShowFitnessGoal]               = useState(false)

  const [gymsVisited, setGymsVisited]               = useState(0)
  const [connectionsStarted, setConnectionsStarted] = useState(0)
  const [currentGym, setCurrentGym]                 = useState<string | null>(null)
  const [experienceLevel, setExperienceLevel]       = useState<string | null>(null)
  const [fitnessGoal, setFitnessGoal]               = useState<string | null>(null)
  const [requestingVerification, setRequestingVerification] = useState(false)
  const [cancellingVerification, setCancellingVerification] = useState(false)
  const [checkingOut, setCheckingOut]     = useState(false)
  const [signingOut, setSigningOut]       = useState(false)

  useFocusEffect(
    useCallback(() => {
      async function refresh() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setName(user.user_metadata?.name ?? '—')
        setUserId(user.id)

        const [
          { data: profile },
          { data: checkin },
          { count: gymsCount },
          { count: connsCount },
        ] = await Promise.all([
          supabase
            .from('profiles')
            .select('bio, avatar_seed, avatar_style, women_verified, verification_requested_at, show_gyms_visited, show_connections_started, show_current_gym, show_experience_level, show_fitness_goal, experience_level, fitness_goal, photo_url')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('checkins')
            .select('id, vibe, custom_vibe, open_to_chat, gyms(name)')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle(),
          supabase
            .from('user_gyms')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('threads')
            .select('*', { count: 'exact', head: true })
            .eq('initiated_by', user.id),
        ])

        setBio(profile?.bio ?? null)
        setAvatarSeed(profile?.avatar_seed ?? null)
        setAvatarStyle((profile?.avatar_style as AvatarStyle | null) ?? 'thumbs')
        setPhotoUrl(profile?.photo_url ?? null)
        setWomenVerified(profile?.women_verified ?? false)
        setVerificationRequested(!!profile?.verification_requested_at)

        setShowGymsVisited(profile?.show_gyms_visited ?? false)
        setShowConnectionsStarted(profile?.show_connections_started ?? false)
        setShowCurrentGym(profile?.show_current_gym ?? false)
        setShowExperienceLevel(profile?.show_experience_level ?? false)
        setShowFitnessGoal(profile?.show_fitness_goal ?? false)

        setGymsVisited(gymsCount ?? 0)
        setConnectionsStarted(connsCount ?? 0)
        setExperienceLevel(profile?.experience_level ?? null)
        setFitnessGoal(profile?.fitness_goal ?? null)

        const checkinTyped = checkin as { id: string; vibe: string; custom_vibe: string | null; open_to_chat: boolean; gyms: { name: string } | null } | null
        setActiveCheckinId(checkinTyped?.id ?? null)
        setCurrentVibe(checkinTyped?.vibe ?? null)
        setCurrentCustomVibe(checkinTyped?.custom_vibe ?? null)
        setOpenToChat(checkinTyped?.open_to_chat ?? false)
        setCurrentGym(checkinTyped?.gyms?.name ?? null)
      }

      refresh()
    }, [])
  )

  async function handleCheckOut() {
    if (!activeCheckinId || checkingOut) return
    setCheckingOut(true)
    await supabase
      .from('checkins')
      .update({ is_active: false, checked_out_at: new Date().toISOString() })
      .eq('id', activeCheckinId)
    setCheckingOut(false)
    setActiveCheckinId(null)
    setCurrentVibe(null)
    router.replace('/(tabs)/live')
  }

  async function handleRequestVerification() {
    if (!userId || requestingVerification || verificationRequested) return
    setRequestingVerification(true)
    await supabase
      .from('profiles')
      .update({ verification_requested_at: new Date().toISOString() })
      .eq('id', userId)
    setRequestingVerification(false)
    setVerificationRequested(true)
  }

  async function handleCancelVerification() {
    if (!userId || cancellingVerification) return
    setCancellingVerification(true)
    await supabase
      .from('profiles')
      .update({ verification_requested_at: null })
      .eq('id', userId)
    setCancellingVerification(false)
    setVerificationRequested(false)
  }

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
  }

  const vibeDisplay = currentCustomVibe || currentVibe

  const sessionStats: { label: string; value: string }[] = []
  if (showCurrentGym && currentGym)
    sessionStats.push({ label: 'At', value: currentGym })
  if (showExperienceLevel && experienceLevel)
    sessionStats.push({ label: 'Level', value: experienceLevel })
  if (showFitnessGoal && fitnessGoal)
    sessionStats.push({ label: 'Goal', value: fitnessGoal })

  const activityStats: { label: string; value: string }[] = []
  if (showGymsVisited && gymsVisited > 0)
    activityStats.push({ label: gymsVisited === 1 ? 'Gym' : 'Gyms visited', value: String(gymsVisited) })
  if (showConnectionsStarted && connectionsStarted > 0)
    activityStats.push({ label: connectionsStarted === 1 ? 'Connection' : 'Connections', value: String(connectionsStarted) })

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.85}
            style={styles.avatarWrap}
          >
            <Avatar
              seed={avatarSeed ?? userId ?? 'default'}
              name={name}
              size={88}
              avatarStyle={avatarStyle}
              bg={colors.accent}
              fg={colors.textPrimary}
              photoUrl={photoUrl}
            />
          </TouchableOpacity>

          <Text style={styles.displayName}>{name}</Text>

          {bio ? (
            <Text style={styles.bio}>{bio}</Text>
          ) : (
            <TouchableOpacity onPress={() => router.push('/edit-profile')} activeOpacity={0.7}>
              <Text style={styles.bioPlaceholder}>Add a short bio</Text>
            </TouchableOpacity>
          )}

          {!photoUrl && userId ? (
            <TouchableOpacity
              style={styles.photoNudge}
              onPress={() => router.push('/take-photo')}
              activeOpacity={0.85}
            >
              <Text style={styles.photoNudgeText}>Add a photo so people can recognize you</Text>
            </TouchableOpacity>
          ) : null}

          {vibeDisplay ? (
            <View style={styles.statusRow}>
              <View style={styles.vibeChip}>
                <Text style={styles.vibeChipText}>{vibeDisplay}</Text>
              </View>
              {openToChat && (
                <View style={styles.opennessChip}>
                  <Text style={styles.opennessChipText}>Open to chat</Text>
                </View>
              )}
            </View>
          ) : null}
        </View>

        {activeCheckinId !== null && (
          <View style={styles.section}>
            <SectionHeader label="Session" />
            <View style={styles.card}>
              {sessionStats.map((s) => (
                <Row
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  divider
                />
              ))}
              <Row
                label={checkingOut ? '' : 'Check out'}
                onPress={handleCheckOut}
                disabled={checkingOut}
                destructive
                trailing={checkingOut ? <ActivityIndicator color="#C0392B" /> : undefined}
              />
            </View>
          </View>
        )}

        {activityStats.length > 0 && (
          <View style={styles.section}>
            <SectionHeader label="Activity" />
            <View style={styles.card}>
              {activityStats.map((s, i) => (
                <Row
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  divider={i < activityStats.length - 1}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <SectionHeader label="Profile" />
          <View style={styles.card}>
            <Row
              label="Edit profile"
              onPress={() => router.push('/edit-profile')}
              chevron
              divider
            />
            {womenVerified ? (
              <Row label="Women's space" value="Verified" valueAccent />
            ) : verificationRequested ? (
              <Row
                label="Women's space"
                value={cancellingVerification ? '' : 'Cancel request'}
                onPress={handleCancelVerification}
                disabled={cancellingVerification}
                valueDestructive
                trailing={cancellingVerification ? <ActivityIndicator size="small" color={colors.textSecondary} /> : undefined}
                subtitle="Verification pending"
              />
            ) : (
              <Row
                label="Women's space"
                subtitle="A space only visible to verified women"
                onPress={handleRequestVerification}
                disabled={requestingVerification}
                chevron={!requestingVerification}
                trailing={requestingVerification ? <ActivityIndicator size="small" color={colors.textSecondary} /> : undefined}
              />
            )}
          </View>
        </View>

        {/*
         * App-store reviewers look for in-app links to Privacy, Terms,
         * and a behaviour policy. We open them in the system browser
         * via Linking; no in-app webview needed.
         */}
        <View style={styles.section}>
          <SectionHeader label="About" />
          <View style={styles.card}>
            <Row label="Privacy Policy"       onPress={() => Linking.openURL(`${LEGAL_BASE}/privacy`)}   chevron divider />
            <Row label="Terms of Use"         onPress={() => Linking.openURL(`${LEGAL_BASE}/terms`)}     chevron divider />
            <Row label="Community Guidelines" onPress={() => Linking.openURL(`${LEGAL_BASE}/community`)} chevron divider />
            <Row label="Safety"               onPress={() => Linking.openURL(`${LEGAL_BASE}/safety`)}    chevron divider />
            <Row label="Version" value={APP_VERSION} />
          </View>
        </View>

        <View style={styles.accountSection}>
          <SectionHeader label="Account" />
          <View style={styles.card}>
            <Row
              label={signingOut ? '' : 'Sign out'}
              onPress={handleSignOut}
              disabled={signingOut}
              destructive
              trailing={signingOut ? <ActivityIndicator color="#C0392B" /> : undefined}
            />
          </View>

          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={() => router.push('/delete-account')}
            disabled={signingOut}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteAccountText}>Delete account</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionHeader}>{label}</Text>
}

type RowProps = {
  label: string
  subtitle?: string
  value?: string
  onPress?: () => void
  disabled?: boolean
  chevron?: boolean
  divider?: boolean
  destructive?: boolean
  valueAccent?: boolean
  valueDestructive?: boolean
  trailing?: React.ReactNode
}

function Row({
  label, subtitle, value, onPress, disabled,
  chevron, divider, destructive, valueAccent, valueDestructive, trailing,
}: RowProps) {
  const content = (
    <View style={[styles.row, divider && styles.rowDivider]}>
      <View style={styles.rowLeft}>
        <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.rowRight}>
        {trailing}
        {!trailing && value ? (
          <Text
            style={[
              styles.rowValue,
              valueAccent && styles.rowValueAccent,
              valueDestructive && styles.rowValueDestructive,
            ]}
          >
            {value}
          </Text>
        ) : null}
        {chevron ? <ChevronRight size={18} color={colors.textSecondary} /> : null}
      </View>
    </View>
  )
  if (!onPress) return content
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={disabled ? styles.rowDisabled : undefined}
    >
      {content}
    </TouchableOpacity>
  )
}

const SECTION_GAP = 28

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 48,
  },

  header: {
    alignItems: 'center',
    marginBottom: SECTION_GAP,
  },
  avatarWrap: { marginBottom: 14, marginTop: 4 },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  bio: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  bioPlaceholder: {
    fontSize: 14,
    color: colors.accent,
    textAlign: 'center',
  },
  photoNudge: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12,
  },
  photoNudgeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  vibeChip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  vibeChipText: { fontSize: 13, color: colors.textSecondary },
  opennessChip: {
    backgroundColor: colors.statusOpen,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  opennessChipText: { fontSize: 13, color: '#2B6B42', fontWeight: '500' },

  section: { marginBottom: SECTION_GAP },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingHorizontal: 4,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  rowDisabled: { opacity: 0.5 },
  rowLeft: { flex: 1, paddingRight: 12 },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowLabelDestructive: { color: '#C0392B' },
  rowSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  rowValueAccent: { color: '#2B6B42', fontWeight: '600' },
  rowValueDestructive: { color: '#C0392B' },

  accountSection: { marginBottom: SECTION_GAP },
  deleteAccountButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteAccountText: {
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
})
