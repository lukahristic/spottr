import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>Profile</Text>
        <Text style={styles.subheading}>Your gym identity.</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={styles.emptyText}>Profile coming soon.</Text>
          <Text style={styles.emptyHint}>Sign in to set up your profile.</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#111111',
  },
  container: {
    flex: 1,
    padding: 24,
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
    marginBottom: 40,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 80,
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
})
