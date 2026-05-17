import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'

type Status = 'happy_to_help' | 'need_guidance' | 'just_training'
type Goal =
  | 'Learning the basics'
  | 'Finding a training partner'
  | 'Hitting my own program'
  | 'Open to anything'

const STATUSES: { key: Status; label: string; color: string; emoji: string }[] = [
  { key: 'happy_to_help', label: 'Happy to Help', color: '#22C55E', emoji: '🟢' },
  { key: 'need_guidance',  label: 'Need Guidance',  color: '#EAB308', emoji: '🟡' },
  { key: 'just_training',  label: 'Just Training',  color: '#3B82F6', emoji: '🔵' },
]

const GOALS: Goal[] = [
  'Learning the basics',
  'Finding a training partner',
  'Hitting my own program',
  'Open to anything',
]

export default function CheckInScreen() {
  const [name, setName]       = useState('')
  const [status, setStatus]   = useState<Status | null>(null)
  const [goal, setGoal]       = useState<Goal | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const canCheckIn = name.trim().length > 0 && status !== null && goal !== null

  async function handleCheckIn() {
    if (!canCheckIn || loading) return
    setLoading(true)
    setError(null)

    const { error: dbError } = await supabase.from('checkins').insert({
      name: name.trim(),
      status,
      goal,
    })

    setLoading(false)

    if (dbError) {
      setError('Could not check in. Try again.')
      return
    }

    router.replace('/live')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Check In</Text>
        <Text style={styles.subheading}>Let others know you're here.</Text>

        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Alex"
          placeholderTextColor="#555"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="done"
          editable={!loading}
        />

        <Text style={styles.label}>Today's Status</Text>
        <View style={styles.optionGroup}>
          {STATUSES.map((s) => {
            const selected = status === s.key
            return (
              <TouchableOpacity
                key={s.key}
                style={[
                  styles.optionCard,
                  selected && { borderColor: s.color, backgroundColor: `${s.color}18` },
                ]}
                onPress={() => setStatus(s.key)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={styles.optionEmoji}>{s.emoji}</Text>
                <Text style={[styles.optionLabel, selected && { color: s.color }]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <Text style={styles.label}>Today's Goal</Text>
        <View style={styles.optionGroup}>
          {GOALS.map((g) => {
            const selected = goal === g
            return (
              <TouchableOpacity
                key={g}
                style={[styles.optionCard, selected && styles.optionCardSelected]}
                onPress={() => setGoal(g)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {g}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, (!canCheckIn || loading) && styles.buttonDisabled]}
          disabled={!canCheckIn || loading}
          onPress={handleCheckIn}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#111111" />
            : <Text style={styles.buttonText}>Check In</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111111',
  },
  scroll: {
    padding: 24,
    paddingBottom: 48,
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
    marginBottom: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 28,
  },
  optionGroup: {
    gap: 10,
    marginBottom: 28,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  optionCardSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF18',
  },
  optionEmoji: {
    fontSize: 18,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#AAAAAA',
  },
  optionLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  error: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#2A2A2A',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: 0.3,
  },
})
