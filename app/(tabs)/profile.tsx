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
    router.replace('/(tabs)')
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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={() => router.push('/edit-profile')}
          activeOpacity={0.85}
        >
          <Avatar
            seed={avatarSeed ?? userId ?? 'default'}
            name={name}
            size={80}
            avatarStyle={avatarStyle}
            bg={colors.accent}
            fg={colors.textPrimary}
            photoUrl={photoUrl}
          />
        </TouchableOpacity>

        <Text style={styles.displayName}>{name}</Text>

        {/* Optional-but-encouraged nudge to add a real photo (roadmap 1.3) */}
        {!photoUrl && userId ? (
          <TouchableOpacity
            style={styles.photoNudge}
            onPress={() => router.push('/take-photo')}
            activeOpacity={0.85}
          >
            <Text style={styles.photoNudgeText}>Add a photo so people can recognize you</Text>
          </TouchableOpacity>
        ) : null}

        {bio ? (
          <Text style={styles.bio}>{bio}</Text>
        ) : (
          <TouchableOpacity onPress={() => router.push('/edit-profile')} activeOpacity={0.7}>
            <Text style={styles.bioPlaceholder}>Add a short bio</Text>
          </TouchableOpacity>
        )}

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

        {(() => {
          const stats: { label: string; value: string }[] = []
          if (showCurrentGym && currentGym)
            stats.push({ label: 'At', value: currentGym })
          if (showGymsVisited && gymsVisited > 0)
            stats.push({ label: gymsVisited === 1 ? 'Gym' : 'Gyms', value: String(gymsVisited) })
          if (showConnectionsStarted && connectionsStarted > 0)
            stats.push({ label: connectionsStarted === 1 ? 'Connection' : 'Connections', value: String(connectionsStarted) })
          if (showExperienceLevel && experienceLevel)
            stats.push({ label: 'Level', value: experienceLevel })
          if (showFitnessGoal && fitnessGoal)
            stats.push({ label: 'Goal', value: fitnessGoal })
          if (stats.length === 0) return null
          return (
            <View style={styles.statsCard}>
              {stats.map((s, i) => (
                <View key={s.label} style={[styles.statRow, i < stats.length - 1 && styles.statRowBorder]}>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={styles.statValue}>{s.value}</Text>
                </View>
              ))}
            </View>
          )
        })()}

        <View style={styles.divider} />

        <View style={styles.actionsGroup}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.7}
          >
            <Text style={styles.editBtnText}>Edit profile</Text>
          </TouchableOpacity>

          {womenVerified ? (
            <View style={styles.womenVerifiedBadge}>
              <Text style={styles.womenVerifiedText}>Women's space · Verified</Text>
            </View>
          ) : verificationRequested ? (
            <View style={styles.womenPendingBadge}>
              <Text style={styles.womenPendingText}>Women's space · Verification pending</Text>
              <TouchableOpacity
                onPress={handleCancelVerification}
                disabled={cancellingVerification}
                activeOpacity={0.6}
                style={styles.cancelVerificationBtn}
              >
                {cancellingVerification
                  ? <ActivityIndicator size="small" color={colors.textSecondary} />
                  : <Text style={styles.cancelVerificationText}>Cancel request</Text>
                }
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.womenRequestBtn, requestingVerification && styles.buttonDisabled]}
              onPress={handleRequestVerification}
              disabled={requestingVerification}
              activeOpacity={0.7}
            >
              {requestingVerification
                ? <ActivityIndicator color={colors.textPrimary} />
                : (
                  <>
                    <Text style={styles.womenRequestBtnText}>Women's space</Text>
                    <Text style={styles.womenRequestBtnHint}>A space only visible to verified women</Text>
                  </>
                )
              }
            </TouchableOpacity>
          )}

          <View style={styles.accountSection}>
            {activeCheckinId !== null && (
              <TouchableOpacity
                style={[styles.checkOutButton, checkingOut && styles.buttonDisabled]}
                onPress={handleCheckOut}
                disabled={checkingOut}
                activeOpacity={0.7}
              >
                {checkingOut
                  ? <ActivityIndicator color={colors.textPrimary} />
                  : <Text style={styles.checkOutText}>Check Out</Text>
                }
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.signOutButton, signingOut && styles.buttonDisabled]}
              onPress={handleSignOut}
              disabled={signingOut}
              activeOpacity={0.7}
            >
              {signingOut
                ? <ActivityIndicator color="#C0392B" />
                : <Text style={styles.signOutText}>Sign Out</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteAccountButton}
              onPress={() => router.push('/delete-account')}
              disabled={signingOut}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteAccountText}>Delete account</Text>
            </TouchableOpacity>
          </View>

          {/*
           * App-store reviewers look for in-app links to Privacy, Terms,
           * and a behaviour policy. We open them in the system browser
           * via Linking; no in-app webview needed.
           */}
          <View style={styles.aboutSection}>
            <Text style={styles.aboutHeading}>About</Text>
            <AboutRow label="Privacy Policy"        url={`${LEGAL_BASE}/privacy`} />
            <AboutRow label="Terms of Use"          url={`${LEGAL_BASE}/terms`} />
            <AboutRow label="Community Guidelines"  url={`${LEGAL_BASE}/community`} />
            <AboutRow label="Safety"                url={`${LEGAL_BASE}/safety`} />
            <View style={styles.aboutVersionRow}>
              <Text style={styles.aboutRowLabel}>Version</Text>
              <Text style={styles.aboutVersionText}>{APP_VERSION}</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

function AboutRow({ label, url }: { label: string; url: string }) {
  return (
    <TouchableOpacity
      style={styles.aboutRow}
      onPress={() => Linking.openURL(url)}
      activeOpacity={0.7}
    >
      <Text style={styles.aboutRowLabel}>{label}</Text>
      <ChevronRight size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },

  avatarWrap: { marginBottom: 16, marginTop: 8 },

  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },

  photoNudge: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
  },
  photoNudgeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  bio: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  bioPlaceholder: {
    fontSize: 14,
    color: colors.accent,
    textAlign: 'center',
    marginBottom: 12,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  vibeChip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  vibeChipText:  { fontSize: 13, color: colors.textSecondary },
  opennessChip: {
    backgroundColor: colors.statusOpen,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  opennessChipText: { fontSize: 13, color: '#2B6B42', fontWeight: '500' },

  statsCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginTop: 16,
    overflow: 'hidden',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  statRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: colors.surface,
    marginVertical: 24,
  },

  actionsGroup: { gap: 10, alignSelf: 'stretch' },

  editBtn: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editBtnText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },

  womenRequestBtn: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  womenRequestBtnText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  womenRequestBtnHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  womenVerifiedBadge: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  womenVerifiedText: { fontSize: 15, fontWeight: '600', color: '#2B6B42' },
  womenPendingBadge: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  womenPendingText: { fontSize: 15, color: colors.textSecondary },
  cancelVerificationBtn: { marginTop: 6 },
  cancelVerificationText: { fontSize: 12, color: '#C0392B', textAlign: 'center' },

  checkOutButton: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkOutText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },

  signOutButton: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: '#C0392B' },

  deleteAccountButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  deleteAccountText: {
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },

  aboutSection: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  aboutHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  aboutVersionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  aboutRowLabel: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  aboutVersionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  accountSection: {
    gap: 10,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },

  buttonDisabled: { opacity: 0.5 },
})
