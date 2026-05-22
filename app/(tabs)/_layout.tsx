import { useEffect, useRef, useState } from 'react'
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
import { MapPinCheck, Zap, MessageCircle, User } from 'lucide-react-native'
import { colors } from '../../.claude/tokens/colors'
import { supabase } from '../../lib/supabase'

type IconProps = { size?: number; color?: string; strokeWidth?: number }

const ACCENT   = '#DFAF3A'
const INACTIVE = '#9A9186'

const TABS: { name: string; label: string; Icon: React.ComponentType<IconProps> }[] = [
  { name: 'index',    label: 'Check In', Icon: MapPinCheck    },
  { name: 'live',     label: 'Live',     Icon: Zap            },
  { name: 'messages', label: 'Inbox',    Icon: MessageCircle  },
  { name: 'profile',  label: 'Profile',  Icon: User           },
]

function FloatingTabBar({ state, navigation, unreadCount }: BottomTabBarProps & { unreadCount: number }) {
  const insets = useSafeAreaInsets()

  const scales = useRef(TABS.map((_, i) => new Animated.Value(i === state.index ? 1 : 0.85))).current
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
          const showBadge = tab.name === 'messages' && unreadCount > 0

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
              <Animated.View style={[styles.iconWrap, { transform: [{ scale: scales[index] }] }]}>
                <tab.Icon size={20} strokeWidth={1.75} color={isFocused ? ACCENT : INACTIVE} />
                {showBadge && (
                  <View style={styles.badge} />
                )}
              </Animated.View>

              <Text style={[styles.label, { color: isFocused ? ACCENT : INACTIVE }]} numberOfLines={1}>
                {tab.label}
              </Text>

              <View
                style={[
                  styles.indicator,
                  { backgroundColor: isFocused ? ACCENT : 'transparent' },
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
  const [totalUnread, setTotalUnread] = useState(0)

  useEffect(() => {
    let cancelled = false
    let channels: ReturnType<typeof supabase.channel>[] = []

    async function fetchUnread(userId: string) {
      const { data } = await supabase
        .from('threads')
        .select('user_1, unread_count_user_1, unread_count_user_2')
        .or(`user_1.eq.${userId},user_2.eq.${userId}`)

      if (cancelled) return

      const total = (data ?? []).reduce((sum, t) => {
        const count = t.user_1 === userId ? t.unread_count_user_1 : t.unread_count_user_2
        return sum + (count ?? 0)
      }, 0)

      setTotalUnread(total)
    }

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      await fetchUnread(user.id)
      if (cancelled) return

      // Tear down any lingering channels with these names (survives hot reloads
      // because the Supabase singleton outlives React component lifecycle).
      const badgeTopics = new Set([`realtime:badge-u1-${user.id}`, `realtime:badge-u2-${user.id}`])
      await Promise.all(
        supabase.getChannels()
          .filter(ch => badgeTopics.has(ch.topic))
          .map(ch => supabase.removeChannel(ch))
      )
      if (cancelled) return

      const ch1 = supabase
        .channel('badge-u1-' + user.id)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'threads', filter: `user_1=eq.${user.id}` }, () => fetchUnread(user.id))
        .subscribe()

      const ch2 = supabase
        .channel('badge-u2-' + user.id)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'threads', filter: `user_2=eq.${user.id}` }, () => fetchUnread(user.id))
        .subscribe()

      channels = [ch1, ch2]
    }

    init()

    return () => {
      cancelled = true
      channels.forEach((ch) => supabase.removeChannel(ch))
    }
  }, [])

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} unreadCount={totalUnread} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="live" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  // Wrapper sits below screen content in normal document flow.
  // No position:absolute — so screen content never hides under the bar.
  // Background matches app so there's no colour gap beneath the pill.
  wrapper: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 6,
  },

  pill: {
    flexDirection: 'row',
    backgroundColor: '#EDEAE3',
    borderRadius: 36,
    borderWidth: 1,
    borderColor: '#D9D4CA',
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

  badge: {
    position: 'absolute',
    top: -3,
    right: -5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    // Pill background colour as border so the dot looks cut out of the icon
    borderWidth: 1.5,
    borderColor: '#EDEAE3',
  },

  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0,
    textAlign: 'center',
    alignSelf: 'stretch',
  },

  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
})
