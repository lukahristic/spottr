import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Stack, router, useSegments } from 'expo-router'
import { Session } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import { supabase } from '../lib/supabase'
import { registerForPushNotificationsAsync } from '../lib/notifications'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errStyles.wrap}>
          <Text style={errStyles.title}>Something went wrong.</Text>
          <Text style={errStyles.body}>Close and reopen the app to continue.</Text>
        </View>
      )
    }
    return this.props.children
  }
}

const errStyles = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF8F4', padding: 32, gap: 12 },
  title: { fontSize: 17, fontWeight: '600', color: '#2B2B2B', textAlign: 'center' },
  body:  { fontSize: 14, color: '#7A746D', textAlign: 'center' },
})

export default function RootLayout() {
  const [session, setSession]               = useState<Session | null>(null)
  const [initializing, setInit]             = useState(true)
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null)
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const segments                            = useSegments()
  const notificationListener                = useRef<Notifications.EventSubscription | null>(null)
  const responseListener                    = useRef<Notifications.EventSubscription | null>(null)

  useEffect(() => {
    async function init() {
      const [{ data: { session }, error }, seen] = await Promise.all([
        supabase.auth.getSession(),
        AsyncStorage.getItem('spottr_onboarding_seen'),
      ])
      if (error) {
        await supabase.auth.signOut()
        setSession(null)
      } else {
        setSession(session)
      }
      setOnboardingDone(seen === 'true')
      setInit(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
        setSession(session)
        return
      }
      if (event === 'USER_UPDATED') {
        setPasswordRecovery(false)
      }
      // TOKEN_REFRESHED failure causes a SIGNED_OUT event — session will be null
      setSession(session)
      // Only register on sign-in and initial session load.
      // TOKEN_REFRESHED fires every ~60 min and does not need a new token.
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        registerForPushNotificationsAsync()
      }
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

    if (passwordRecovery) {
      router.replace('/(auth)/reset-password')
      return
    }

    if (session && (inAuth || inOnboarding)) {
      router.replace('/(tabs)')
      return
    }

    if (!session && !inAuth && !inOnboarding) {
      AsyncStorage.getItem('spottr_onboarding_seen').then((seen) => {
        router.replace(seen === 'true' ? '/(auth)' : '/(onboarding)')
      })
    }
  }, [session, initializing, onboardingDone, segments, passwordRecovery])

  if (initializing) return null

  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="gym/[slug]" />
        <Stack.Screen name="scan" />
        <Stack.Screen name="edit-profile" />
      </Stack>
    </ErrorBoundary>
  )
}
