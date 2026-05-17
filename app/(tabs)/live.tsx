import { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'

type CheckIn = {
  id: string
  name: string
  status: 'happy_to_help' | 'need_guidance' | 'just_training'
  goal: string
  checked_in_at: string
  is_active: boolean
}

const STATUS_META: Record<CheckIn['status'], { label: string; color: string }> = {
  happy_to_help: { label: 'Happy to Help', color: '#22C55E' },
  need_guidance:  { label: 'Need Guidance',  color: '#EAB308' },
  just_training:  { label: 'Just Training',  color: '#3B82F6' },
}

export default function LiveListScreen() {
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    async function fetchCheckins() {
      const { data, error: dbError } = await supabase
        .from('checkins')
        .select('*')
        .eq('is_active', true)
        .order('checked_in_at', { ascending: false })

      setLoading(false)

      if (dbError) {
        setError('Could not load check-ins.')
        return
      }

      setCheckins(data as CheckIn[])
    }

    fetchCheckins()

    const channel = supabase
      .channel('checkins-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'checkins' },
        (payload) => {
          setCheckins((prev) => [payload.new as CheckIn, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#FFFFFF" size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={checkins}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Live</Text>
            <Text style={styles.subheading}>Members at your gym right now.</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>⚡</Text>
            <Text style={styles.emptyText}>No one checked in yet.</Text>
            <Text style={styles.emptyHint}>Check in first to see who's here.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = STATUS_META[item.status]
          return (
            <View style={styles.card}>
              <View style={[styles.dot, { backgroundColor: meta.color }]} />
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardGoal}>{item.goal}</Text>
              </View>
              <View style={[styles.badge, { borderColor: `${meta.color}60` }]}>
                <Text style={[styles.badgeText, { color: meta.color }]}>
                  {meta.label}
                </Text>
              </View>
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111111',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 24,
    paddingBottom: 48,
    flexGrow: 1,
  },
  header: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 15,
    color: '#888888',
  },
  error: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyHint: {
    fontSize: 14,
    color: '#555555',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 14,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardGoal: {
    fontSize: 13,
    color: '#888888',
  },
  badge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
})
