import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { ChevronLeft, CheckCircle } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { colors } from '../../.claude/tokens/colors'

type Gym = {
  id: string
  name: string
  location: string
  slug: string
  is_active: boolean
}

export default function GymLandingScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()

  const [gym, setGym]           = useState<Gym | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [adding, setAdding]     = useState(false)
  const [alreadyAdded, setAlreadyAdded] = useState(false)
  const [justAdded, setJustAdded]       = useState(false)

  useEffect(() => {
    async function load() {
      const { data: gymData, error } = await supabase
        .from('gyms')
        .select('id, name, location, slug, is_active')
        .eq('slug', slug)
        .maybeSingle()

      if (error || !gymData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setGym(gymData as Gym)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: existing } = await supabase
          .from('user_gyms')
          .select('id')
          .eq('user_id', user.id)
          .eq('gym_id', gymData.id)
          .maybeSingle()

        if (existing) setAlreadyAdded(true)
      }

      setLoading(false)
    }

    load()
  }, [slug])

  async function handleAdd() {
    if (!gym || adding) return
    setAdding(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setAdding(false)
      return
    }

    await supabase
      .from('user_gyms')
      .upsert({ user_id: user.id, gym_id: gym.id }, { onConflict: 'user_id,gym_id' })

    setAdding(false)
    setJustAdded(true)

    setTimeout(() => {
      router.replace('/(tabs)')
    }, 1200)
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

  if (notFound || !gym) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <ChevronLeft size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.stateTitle}>Gym not found.</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!gym.is_active) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <ChevronLeft size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.stateTitle}>This gym is no longer active on Spottr.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ChevronLeft size={22} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.gymCard}>
          <Text style={styles.gymName}>{gym.name}</Text>
          <Text style={styles.gymLocation}>{gym.location}</Text>
        </View>

        {justAdded ? (
          <View style={styles.successWrap}>
            <CheckCircle size={28} color={colors.accent} />
            <Text style={styles.successText}>Gym added to your Spottr!</Text>
          </View>
        ) : alreadyAdded ? (
          <View style={styles.alreadyWrap}>
            <Text style={styles.alreadyText}>Already in your gym list.</Text>
            <TouchableOpacity
              style={styles.goBtn}
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.85}
            >
              <Text style={styles.goBtnText}>Go to Your Gyms</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.addHint}>
              Add this gym to your Spottr list. When you arrive, tap &quot;I&apos;m in&quot; to check in.
            </Text>
            <TouchableOpacity
              style={[styles.addBtn, adding && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={adding}
              activeOpacity={0.85}
            >
              {adding
                ? <ActivityIndicator color={colors.textPrimary} />
                : <Text style={styles.addBtnText}>Add {gym.name} to Spottr</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  container: { flex: 1, padding: 24 },
  back:      { marginBottom: 32 },
  stateTitle: { fontSize: 16, fontWeight: '500', color: colors.textSecondary, textAlign: 'center' },

  gymCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    gap: 6,
    marginBottom: 28,
  },
  gymName:     { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  gymLocation: { fontSize: 14, color: colors.textSecondary },

  addHint: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },

  successWrap: {
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  successText: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },

  alreadyWrap: { gap: 16, marginTop: 8 },
  alreadyText: { fontSize: 15, color: colors.textSecondary },
  goBtn: {
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  goBtnText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
})
