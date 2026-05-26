import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { colors } from '../../.claude/tokens/colors'

/*
 * "Early days" onboarding screen.
 *
 * Sits between how-it-works and ready. Its job is to set expectations
 * BEFORE the first check-in: the first few times will be quiet, and
 * that's normal. Without this primer, users interpret an empty list
 * as a broken product and uninstall.
 *
 * Roadmap item 1.5. Intentionally not skippable — the founder pattern
 * we're guarding against is treating empty as failure.
 */
export default function EarlyDaysScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <View style={styles.message}>
          <Text style={styles.label}>ONE MORE THING</Text>
          <Text style={styles.heading}>You're early.</Text>
          <Text style={styles.body}>
            Spottr is new at most gyms. The first few times you check in, it
            might be quiet — that's how every gym starts on here.
          </Text>
          <Text style={styles.body}>
            When that happens, invite one person you've seen at your gym.
            That's the move.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(onboarding)/ready')}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Got it</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 28, justifyContent: 'space-between' },
  message: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 48,
    gap: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heading: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  body: {
    fontSize: 17,
    color: colors.textSecondary,
    lineHeight: 26,
  },
  actions:    { gap: 16, paddingBottom: 8 },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
})
