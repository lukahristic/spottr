import { useEffect, useRef } from 'react'
import { Tabs } from 'expo-router'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'

const ACCENT   = '#FFD54A'
const INACTIVE = '#555555'

const TABS: { name: string; label: string; icon: string }[] = [
  { name: 'index',   label: 'Check In', icon: '📍' },
  { name: 'live',    label: 'Live',     icon: '⚡' },
  { name: 'profile', label: 'Profile',  icon: '👤' },
]

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()

  const scales = useRef(TABS.map((_, i) => new Animated.Value(i === state.index ? 1 : 0.85))).current
  const livePulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    scales.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: i === state.index ? 1 : 0.85,
        useNativeDriver: true,
        tension: 160,
        friction: 11,
      }).start()
    })
  }, [state.index])

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  // Bottom of the pill must clear the system gesture bar (insets.bottom)
  // plus a comfortable visual gap (16px)
  const pillBottom = insets.bottom + 16

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingBottom: pillBottom }]}
    >
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index
          const tab = TABS.find(t => t.name === route.name) ?? TABS[index]

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name)
            }
          }

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              onPress={onPress}
              activeOpacity={0.75}
            >
              <View style={styles.iconWrap}>
                <Animated.Text
                  style={[
                    styles.icon,
                    { transform: [{ scale: scales[index] }] },
                  ]}
                >
                  {tab.icon}
                </Animated.Text>
                {tab.name === 'live' && (
                  <Animated.View style={[styles.liveDot, { opacity: livePulse }]} />
                )}
              </View>

              <Text style={[styles.label, { color: isFocused ? ACCENT : INACTIVE }]}>
                {tab.label}
              </Text>

              <View
                style={[
                  styles.indicator,
                  { backgroundColor: isFocused ? '#FFFFFF' : 'transparent' },
                ]}
              />
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    />
  )
}

const styles = StyleSheet.create({
  // Wrapper sits below screen content in normal document flow.
  // No position:absolute — so screen content never hides under the bar.
  // Background matches app so there's no colour gap beneath the pill.
  wrapper: {
    backgroundColor: '#111111',
    paddingHorizontal: 20,
    paddingTop: 6,
  },

  pill: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 36,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    paddingVertical: 7,
    paddingHorizontal: 8,
    // iOS shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    // Android elevation
    elevation: 20,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 0,
    gap: 3,
  },

  iconWrap: {
    position: 'relative',
  },

  icon: {
    fontSize: 20,
  },

  liveDot: {
    position: 'absolute',
    top: -1,
    right: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },

  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
})
