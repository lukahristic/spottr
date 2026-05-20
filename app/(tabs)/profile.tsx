import { useCallback, useEffect, useRef, useState } from 'react'
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
import { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/Avatar'
import { dicebearUrl } from '../../lib/avatar'
import { colors } from '../../.claude/tokens/colors'

export default function ProfileScreen() {
  const [user, setUser]                       = useState<User | null>(null)
  const [activeCheckinId, setActiveCheckinId] = useState<string | null>(null)
  const [currentVibe, setCurrentVibe]         = useState<string | null>(null)
  const [checkingOut, setCheckingOut]         = useState(false)
  const [signingOut, setSigningOut]           = useState(false)
  const [avatarUri, setAvatarUri]             = useState<string | undefined>(undefined)
  const userRef = useRef<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      userRef.current = user
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_seed')
          .eq('id', user.id)
          .single()
        if (data?.avatar_seed) setAvatarUri(dicebearUrl(data.avatar_seed))
      }
    })
  }, [])

  useFocusEffect(
    useCallback(() => {
      const userId = userRef.current?.id ?? user?.id
      if (!userId) return

      supabase
        .from('checkins')
        .select('id, vibe')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle()
        .then(
          ({ data }) => {
            setActiveCheckinId(data?.id ?? null)
            setCurrentVibe(data?.vibe ?? null)
          },
          () => {
            setActiveCheckinId(null)
            setCurrentVibe(null)
          },
        )
    }, [user?.id])
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

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
  }

  const name = user?.user_metadata?.name ?? '—'

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.headerName}>{name}</Text>

        <View style={styles.avatarWrap}>
          <Avatar
            seed={user?.id ?? 'default'}
            name={name}
            size={80}
            bg={colors.accent}
            fg={colors.textPrimary}
            uri={avatarUri}
          />
        </View>

        <Text style={styles.displayName}>{name}</Text>

        {currentVibe && (
          <View style={styles.vibeChip}>
            <Text style={styles.vibeChipText}>{currentVibe}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.actionsGroup}>
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

  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 40,
  },

  avatarWrap: { marginBottom: 16 },

  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },

  vibeChip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  vibeChipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: colors.surface,
    marginVertical: 24,
  },

  actionsGroup: { gap: 10, alignSelf: 'stretch' },

  checkOutButton: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  signOutButton: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C0392B',
  },

  buttonDisabled: { opacity: 0.5 },
})
