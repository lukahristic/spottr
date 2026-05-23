import { useCallback, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Avatar, AvatarStyle } from '../../components/Avatar'
import { colors } from '../../.claude/tokens/colors'

export default function ProfileScreen() {
  const [name, setName]                   = useState<string>('—')
  const [userId, setUserId]               = useState<string | null>(null)
  const [bio, setBio]                     = useState<string | null>(null)
  const [avatarSeed, setAvatarSeed]       = useState<string | null>(null)
  const [avatarStyle, setAvatarStyle]     = useState<AvatarStyle>('thumbs')
  const [activeCheckinId, setActiveCheckinId] = useState<string | null>(null)
  const [currentVibe, setCurrentVibe]         = useState<string | null>(null)
  const [currentCustomVibe, setCurrentCustomVibe] = useState<string | null>(null)
  const [openToChat, setOpenToChat]       = useState(false)
  const [womenVerified, setWomenVerified]         = useState(false)
  const [verificationRequested, setVerificationRequested] = useState(false)
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

        const [{ data: profile }, { data: checkin }] = await Promise.all([
          supabase
            .from('profiles')
            .select('bio, avatar_seed, avatar_style, women_verified, verification_requested_at')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('checkins')
            .select('id, vibe, custom_vibe, open_to_chat')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle(),
        ])

        setBio(profile?.bio ?? null)
        setAvatarSeed(profile?.avatar_seed ?? null)
        setAvatarStyle((profile?.avatar_style as AvatarStyle | null) ?? 'thumbs')
        setWomenVerified(profile?.women_verified ?? false)
        setVerificationRequested(!!profile?.verification_requested_at)

        setActiveCheckinId(checkin?.id ?? null)
        setCurrentVibe(checkin?.vibe ?? null)
        setCurrentCustomVibe(checkin?.custom_vibe ?? null)
        setOpenToChat(checkin?.open_to_chat ?? false)
      }

      refresh()
    }, [])
  )

  async function handleCheckOut() {
    if (!activeCheckinId || checkingOut) return
    setCheckingOut(true)
    await supabase
      .from('checkins')
      .update({ is_active: false })
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
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
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

  accountSection: {
    gap: 10,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },

  buttonDisabled: { opacity: 0.5 },
})
