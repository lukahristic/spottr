import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { supabase } from './supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function registerForPushNotificationsAsync(): Promise<void> {
  if (!Device.isDevice) {
    console.log('[PushToken] simulator — skipping')
    return
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  console.log('[PushToken] permission status:', existing)
  let finalStatus = existing

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
    console.log('[PushToken] after request:', finalStatus)
  }

  if (finalStatus !== 'granted') {
    console.log('[PushToken] permission denied — aborting')
    return
  }

  // projectId is required in production builds (Expo SDK 49+).
  // Without it, getExpoPushTokenAsync throws and the token is never saved.
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined
  if (!projectId) {
    console.log('[PushToken] no EAS projectId in app.json extra.eas — cannot register in production')
    return
  }

  let token: string
  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId })
    token = result.data
    console.log('[PushToken] token:', token)
  } catch (err) {
    console.log('[PushToken] getExpoPushTokenAsync failed:', String(err))
    return
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.log('[PushToken] no authenticated user — skipping save')
    return
  }
  console.log('[PushToken] saving for user:', user.id)

  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      { user_id: user.id, token, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.log('[PushToken] upsert failed:', error.code, error.message)
  } else {
    console.log('[PushToken] saved successfully')
  }
}
