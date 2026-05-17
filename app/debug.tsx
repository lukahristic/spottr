import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { TouchableOpacity } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'

type Gym = {
  id: string
  name: string
  slug: string
  location: string
  is_active: boolean
}

export default function DebugScreen() {
  const [gyms, setGyms]           = useState<Gym[]>([])
  const [loading, setLoading]     = useState(true)
  const [resetting, setResetting] = useState(false)

  async function handleReset() {
    if (resetting) return
    setResetting(true)
    await AsyncStorage.removeItem('spottr_onboarding_seen')
    await supabase.auth.signOut()
  }

  useEffect(() => {
    supabase
      .from('gyms')
      .select('id, name, slug, location, is_active')
      .order('name')
      .then(({ data }) => {
        setGyms((data as Gym[]) ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>Debug</Text>

        {loading && <ActivityIndicator color="#FFFFFF" style={{ marginTop: 32 }} />}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DEV TOOLS</Text>
          <TouchableOpacity
            style={[styles.resetButton, resetting && styles.resetButtonDisabled]}
            onPress={handleReset}
            disabled={resetting}
            activeOpacity={0.7}
          >
            {resetting
              ? <ActivityIndicator color="#EAB308" size="small" />
              : <Text style={styles.resetButtonText}>Reset Onboarding</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.subheading}>Gym deep link URLs</Text>

        {gyms.map((gym) => (
          <View key={gym.id} style={styles.row}>
            <View style={styles.rowTop}>
              <Text style={styles.gymName}>{gym.name}</Text>
              {!gym.is_active && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveBadgeText}>inactive</Text>
                </View>
              )}
            </View>
            <Text style={styles.gymLocation}>{gym.location}</Text>
            <Text style={styles.url}>{`https://spottr.app/gym/${gym.slug}`}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#111111' },
  scroll:     { padding: 24, paddingBottom: 48 },
  back:       { marginBottom: 28 },
  backText:   { fontSize: 15, color: '#888888' },
  heading:    { fontSize: 32, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  subheading: { fontSize: 15, color: '#888888', marginBottom: 32 },
  row: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    gap: 4,
  },
  rowTop:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  gymName:      { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  gymLocation:  { fontSize: 13, color: '#666666' },
  url:          { fontSize: 12, color: '#3B82F6', fontFamily: 'monospace', marginTop: 4 },
  inactiveBadge: {
    borderWidth: 1,
    borderColor: '#EF444440',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  inactiveBadgeText: { fontSize: 10, color: '#EF4444', fontWeight: '600' },
  section:      { marginBottom: 32 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#444444', letterSpacing: 1.5, marginBottom: 12 },
  resetButton: {
    borderWidth: 1,
    borderColor: '#EAB30840',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetButtonDisabled: { opacity: 0.5 },
  resetButtonText: { fontSize: 15, fontWeight: '600', color: '#EAB308' },
})
