import { Share, Platform } from 'react-native'

/*
 * Open the native share sheet with a gym-specific invite.
 *
 * Recipient taps the spottr://gym/[slug] deep link → app opens → that gym
 * is auto-added to their Your Gyms list. (Or, if they don't have Spottr
 * installed, the link is the URL we'll point at App/Play Store later.)
 *
 * Uses the React Native built-in Share — no extra dependency, no native
 * code change needed. Works in Expo Go and any prebuilt client.
 *
 * Returns true if the user shared/sent, false if they dismissed or errored.
 * Callers don't need to show a confirmation either way: the OS share sheet
 * is its own feedback.
 */
export async function shareGymInvite(opts: {
  gymName: string
  gymSlug: string | null
}): Promise<boolean> {
  const { gymName, gymSlug } = opts

  // Defensive: if a gym doesn't have a slug yet, there's nothing useful
  // to share. Callers should hide the invite button in this case, but
  // we double-check here.
  if (!gymSlug) return false

  const url = `spottr://gym/${gymSlug}`
  const message = `I'm on Spottr at ${gymName}. Add this gym: ${url}`

  try {
    const result = await Share.share(
      Platform.OS === 'ios'
        ? { message, url }   // iOS: separate URL field renders a nicer preview
        : { message }        // Android: URL goes inside the message string
    )
    return result.action === Share.sharedAction
  } catch {
    // Share.share throws on cancellation on some platforms; treat as a non-event.
    return false
  }
}
