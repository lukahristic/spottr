import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors } from '../../.claude/tokens/colors'

async function completeOnboarding() {
  await AsyncStorage.setItem('spottr_onboarding_seen', 'true')
  router.replace('/(auth)')
}

export default function HowItWorksScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.label}>HOW IT WORKS</Text>
          <TouchableOpacity onPress={completeOnboarding} activeOpacity={0.5}>
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>It starts with showing up.</Text>

        {/* Card 1 */}
        <View style={styles.card}>
          <Text style={styles.cardIcon}>📍</Text>
          <Text style={styles.cardTitle}>Check in to your gym</Text>
          <Text style={styles.cardBody}>
            Tap in when you arrive. Only members in the same gym will see you — no one outside.
          </Text>
        </View>

        {/* Card 2 */}
        <View style={styles.card}>
          <Text style={styles.cardIcon}>🎯</Text>
          <Text style={styles.cardTitle}>Set your vibe</Text>
          <Text style={styles.cardBody}>Pick a chip that matches your session. No roles, just context.</Text>
          <View style={styles.chipGrid}>
            {['Locked in', 'Finding my rhythm', 'Taking it easy', 'In between sets'].map((v) => (
              <View key={v} style={styles.chip}>
                <Text style={styles.chipText}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.togglePill} />
            <Text style={styles.toggleLabel}>Open to chat — flip this on when you're open to connecting.</Text>
          </View>
        </View>

        {/* Card 3 */}
        <View style={styles.card}>
          <Text style={styles.cardIcon}>💬</Text>
          <Text style={styles.cardTitle}>Connect naturally</Text>
          <Text style={styles.cardBody}>
            Send a short intro before walking over. One message. No pressure.
          </Text>
        </View>

        <View style={styles.safetyNote}>
          <Text style={styles.safetyNoteText}>
            Only visible while you're here.{'\n'}Leave anytime.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={completeOnboarding}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Let's go</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signInLink}
          onPress={completeOnboarding}
          activeOpacity={0.6}
        >
          <Text style={styles.signInLinkText}>
            Already have an account?{' '}
            <Text style={styles.signInHighlight}>Sign in</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, paddingBottom: 48 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  skip: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  heading: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 28,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    gap: 8,
  },
  cardIcon:  { fontSize: 24 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  cardBody:  { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipText: { fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  togglePill: {
    width: 32,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DFAF3A',
    flexShrink: 0,
  },
  toggleLabel: { fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 18 },
  safetyNote: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 0,
    padding: 14,
    marginTop: 4,
    marginBottom: 24,
  },
  safetyNoteText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#DFAF3A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
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
