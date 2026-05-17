import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

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
          <Text style={styles.cardTitle}>Set your status</Text>
          <Text style={styles.cardBody}>Tell others what kind of session you're having.</Text>
          <View style={styles.statusList}>
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Happy to Help</Text>
                <Text style={styles.statusHint}>Open to sharing what you know.</Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: '#EAB308' }]} />
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Need Guidance</Text>
                <Text style={styles.statusHint}>Here to learn, or just need a hand.</Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Just Training</Text>
                <Text style={styles.statusHint}>Heads down. Here for the work.</Text>
              </View>
            </View>
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
            Only visible while you're here. Leave anytime.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(onboarding)/ready')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Continue</Text>
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

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#111111' },
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
    color: '#444444',
    letterSpacing: 1.5,
  },
  skip: {
    fontSize: 14,
    color: '#444444',
  },
  heading: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    gap: 8,
  },
  cardIcon:  { fontSize: 24 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  cardBody:  { fontSize: 14, color: '#888888', lineHeight: 21 },
  statusList: { gap: 12, marginTop: 4 },
  statusRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dot:        { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  statusInfo: { flex: 1, gap: 2 },
  statusLabel: { fontSize: 14, fontWeight: '600', color: '#DDDDDD' },
  statusHint:  { fontSize: 13, color: '#666666' },
  safetyNote: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    marginBottom: 24,
  },
  safetyNoteText: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
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
