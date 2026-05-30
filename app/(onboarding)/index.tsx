import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { colors } from '../../.claude/tokens/colors'

export default function OnboardingWelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <View style={styles.brand}>
          <Image
            source={require('../../assets/spottr_logo.png')}
            style={styles.logo}
          />
          <Text style={styles.headline}>
            Real people.{'\n'}Real gyms.
          </Text>
          <Text style={styles.body}>
            Your gym. The people already there.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(onboarding)/how-it-works')}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>I'm in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInLink}
            onPress={() => router.replace('/(auth)')}
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
  brand: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
    gap: 20,
  },
  logo: {
    width: 180,
    height: 80,
    resizeMode: 'contain',
  },
  headline: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 42,
  },
  body: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  actions: {
    gap: 16,
    paddingBottom: 8,
  },
  button: {
    backgroundColor: '#DFAF3A',
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
