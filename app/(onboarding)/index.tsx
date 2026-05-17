import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'

export default function OnboardingWelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <View style={styles.brand}>
          <Text style={styles.logo}>SPOTTR</Text>
          <Text style={styles.headline}>
            Real people.{'\n'}Real gyms.{'\n'}Real connections.
          </Text>
          <Text style={styles.body}>
            No cold approaches. No pressure. Just real people at the same gym.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(onboarding)/how-it-works')}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInLink}
            onPress={() => router.replace('/(auth)')}
            activeOpacity={0.6}
          >
            <Text style={styles.signInLinkText}>
              Already have an account?{' '}
              <Text style={styles.signInHighlight}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#111111' },
  container: { flex: 1, padding: 28, justifyContent: 'space-between' },
  brand: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
    gap: 20,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 6,
  },
  headline: {
    fontSize: 38,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 46,
  },
  body: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  actions: {
    gap: 16,
    paddingBottom: 8,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: 0.3,
  },
  signInLink:      { alignItems: 'center' },
  signInLinkText:  { fontSize: 14, color: '#555555' },
  signInHighlight: { color: '#888888', fontWeight: '600' },
})
