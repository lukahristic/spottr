import { Tabs } from 'expo-router'
import { Text } from 'react-native'

const BG = '#111111'
const ACTIVE = '#FFFFFF'
const INACTIVE = '#555555'

function TabIcon({ label, active }: { label: string; active: boolean }) {
  return (
    <Text style={{ fontSize: 20 }}>{label}</Text>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: BG,
          borderTopColor: '#222222',
          height: 64,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Check In',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="📍" active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="⚡" active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="👤" active={focused} />
          ),
        }}
      />
    </Tabs>
  )
}
