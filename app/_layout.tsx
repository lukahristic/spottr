import { useEffect, useState } from 'react'
import { Stack, router, useSegments } from 'expo-router'
import { Session } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'

export default function RootLayout() {
  const [session, setSession]             = useState<Session | null>(null)
  const [initializing, setInit]           = useState(true)
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null)
  const segments                          = useSegments()

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
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (initializing || onboardingDone === null) return

    const inAuth       = segments[0] === '(auth)'
    const inOnboarding = segments[0] === '(onboarding)'
    const inTabs       = segments[0] === '(tabs)'

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
