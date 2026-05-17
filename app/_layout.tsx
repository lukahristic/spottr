import { useEffect, useRef, useState } from 'react'
import { Stack, router, useSegments } from 'expo-router'
import { Session } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import { supabase } from '../lib/supabase'
import { registerForPushNotificationsAsync } from '../lib/notifications'

export default function RootLayout() {
  const [session, setSession]               = useState<Session | null>(null)
  const [initializing, setInit]             = useState(true)
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null)
  const segments                            = useSegments()
  const notificationListener                = useRef<Notifications.EventSubscription | null>(null)
  const responseListener                    = useRef<Notifications.EventSubscription | null>(null)

  useEffect(() => {
    async function init() {
      const [{ data: { session } }, seen] = await Promise.all([
        supabase.auth.getSession(),
        AsyncStorage.getItem('spottr_onboarding_seen'),
      ])
      setSession(session)
      setOnboardingDone(seen === 'true')
      setInit(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) registerForPushNotificationsAsync()
    })

    // Navigate to profile inbox when user taps a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      router.replace('/(tabs)/profile')
    })

    return () => {
      subscription.unsubscribe()
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [])

  useEffect(() => {
    if (initializing || onboardingDone === null) return

    const inAuth       = segments[0] === '(auth)'
    const inOnboarding = segments[0] === '(onboarding)'

    if (session && (inAuth || inOnboarding)) {
      router.replace('/(tabs)')
      return
    }

    if (!session && !inAuth && !inOnboarding) {
      AsyncStorage.getItem('spottr_onboarding_seen').then((seen) => {
        router.replace(seen === 'true' ? '/(auth)' : '/(onboarding)')
      })
    }
  }, [session, initializing, onboardingDone, segments])

  if (initializing) return null

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="gym/[slug]" />
      <Stack.Screen name="debug" />
    </Stack>
  )
}
