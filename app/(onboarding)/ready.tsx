import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors } from '../../.claude/tokens/colors'

async function completeOnboarding(destination: '/(auth)/sign-up' | '/(auth)/sign-in' = '/(auth)/sign-up') {
  await AsyncStorage.setItem('spottr_onboarding_seen', 'true')
  router.replace(destination)
}

export default function ReadyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <View style={styles.message}>
          <Text style={styles.set}>You're all set.</Text>
          <Text style={styles.reason}>
            A familiar face can change a workout.
          </Text>
          <Text style={styles.warmNote}>Everyone starts somewhere.</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => completeOnboarding('/(auth)/sign-up')}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>I'm Ready</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInLink}
            onPress={() => completeOnboarding('/(auth)/sign-in')}
            activeOpacity={0.6}
          >
            <Text style={styles.signInLinkText}>
              Already have an account?{' '}
              <Text style={styles.signInHighlight}>Sign in</Text>
            </Text>
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
  set: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  reason: {
    fontSize: 22,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 30,
  },
  warmNote: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  actions: {
    gap: 16,
    paddingBottom: 8,
  },
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
  signInLink:      { alignItems: 'center' },
  signInLinkText:  { fontSize: 14, color: colors.textSecondary },
  signInHighlight: { color: colors.textPrimary, fontWeight: '600' },
})
