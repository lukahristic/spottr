import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Alert, Platform } from 'react-native'
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

/*
 * Show a friendly explanation before firing the OS push permission
 * prompt for the first time.
 *
 * iOS only gives you ONE shot at the system prompt for the lifetime
 * of the install — if a user dismisses it, they have to dig into
 * Settings to re-enable. So we explain why we're asking first and
 * only fire the OS prompt when the user opts in.
 *
 * Returns the permission status the user ended up in.
 */
async function requestWithPrimer(): Promise<Notifications.PermissionStatus> {
  const proceed = await new Promise<boolean>((resolve) => {
    Alert.alert(
      'Stay in the loop',
      "We'll let you know when someone replies to your intro, or when a friend checks in at your gym. You can turn this off anytime in your device settings.",
      [
        { text: 'Not now',  style: 'cancel',     onPress: () => resolve(false) },
        { text: 'Continue', style: 'default',    onPress: () => resolve(true)  },
      ],
      { cancelable: false }
    )
  })
  if (!proceed) return 'undetermined' as Notifications.PermissionStatus
  const { status } = await Notifications.requestPermissionsAsync()
  return status
}

export async function registerForPushNotificationsAsync(): Promise<void> {
  if (!Device.isDevice) return

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing

  if (existing === 'undetermined') {
    // First-time ask: show our primer before the OS prompt fires.
    finalStatus = await requestWithPrimer()
  } else if (existing !== 'granted') {
    // Already denied — don't keep nagging. The user can re-enable
    // from Settings; the next launch will pick that up automatically.
    return
  }

  if (finalStatus !== 'granted') return

  // projectId is required in production builds (Expo SDK 49+).
  // Without it, getExpoPushTokenAsync throws and the token is never saved.
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined
  if (!projectId) return

  let token: string
  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId })
    token = result.data
  } catch {
    return
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('push_tokens')
    .upsert(
      { user_id: user.id, token, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
}
