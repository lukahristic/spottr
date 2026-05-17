import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

async function completeOnboarding() {
  await AsyncStorage.setItem('spottr_onboarding_seen', 'true')
  router.replace('/(auth)')
}

export default function ReadyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <View style={styles.message}>
          <Text style={styles.set}>You're set.</Text>
          <Text style={styles.reason}>
            Now go be someone's reason to stay.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.button}
            onPress={completeOnboarding}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>I'm Ready</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInLink}
            onPress={completeOnboarding}
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
  message: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 48,
    gap: 16,
  },
  set: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  reason: {
    fontSize: 24,
    fontWeight: '500',
    color: '#666666',
    lineHeight: 32,
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
