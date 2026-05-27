import { useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { X, RotateCcw, Check, RefreshCw } from 'lucide-react-native'
import { colors } from '../.claude/tokens/colors'
import { uploadProfilePhoto } from '../lib/photo'

/*
 * Take-photo screen.
 *
 * Camera-only flow per the brand thesis: real selfie taken now, not a
 * curated profile pic, not an AI-generated face. No gallery pick.
 *
 * Permission denial is a real path: if the user declines camera access,
 * we route them back with a friendly note. They can always come back
 * later — denying isn't permanent.
 *
 * Roadmap item 1.3.
 */
export default function TakePhotoScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const cameraRef = useRef<CameraView>(null)
  const [facing, setFacing] = useState<'front' | 'back'>('front')
  const [previewUri, setPreviewUri] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [uploading, setUploading] = useState(false)

  // ─── Permission states ─────────────────────────────────────────────────────

  if (!permission) {
    // Initial mount before useCameraPermissions resolves.
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    )
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permWrap}>
          <Text style={styles.permHeading}>Take a quick selfie?</Text>
          <Text style={styles.permBody}>
            A real photo helps people recognize you at the gym. We only use it on your profile — it&apos;s never shared off Spottr.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={async () => {
              const result = await requestPermission()
              if (!result.granted) {
                Alert.alert(
                  'Camera off',
                  'You can turn camera access back on in Settings whenever you want.',
                  [{ text: 'OK' }]
                )
              }
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Allow camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.skipBtnText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  async function handleCapture() {
    if (capturing || !cameraRef.current) return
    setCapturing(true)
    try {
      // quality 0.7 keeps file size well under our 2MB cap while preserving
      // recognizability. base64 false because we upload via fetch → blob.
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      })
      if (photo?.uri) setPreviewUri(photo.uri)
    } catch {
      Alert.alert('That didn\'t work', 'Try the shutter again.')
    } finally {
      setCapturing(false)
    }
  }

  async function handleSave() {
    if (!previewUri || uploading) return
    setUploading(true)
    const result = await uploadProfilePhoto(previewUri)
    setUploading(false)

    if ('error' in result) {
      Alert.alert('Upload failed', result.error)
      return
    }
    router.back()
  }

  function handleRetake() {
    setPreviewUri(null)
  }

  function handleFlip() {
    setFacing((f) => (f === 'front' ? 'back' : 'front'))
  }

  // ─── Preview state (after capture, before save) ───────────────────────────

  if (previewUri) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.previewWrap}>
          <Image source={{ uri: previewUri }} style={styles.previewImage} />

          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color="#FFFFFF" size="large" />
              <Text style={styles.uploadingText}>Saving…</Text>
            </View>
          )}

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleRetake}
              disabled={uploading}
              activeOpacity={0.7}
            >
              <RefreshCw size={18} color={colors.textPrimary} />
              <Text style={styles.secondaryBtnText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, styles.primaryBtnInline, uploading && styles.btnDisabled]}
              onPress={handleSave}
              disabled={uploading}
              activeOpacity={0.85}
            >
              <Check size={18} color={colors.textPrimary} />
              <Text style={styles.primaryBtnText}>Use this</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // ─── Live camera state ─────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.cameraWrap}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing} mode="picture" />

        {/* Top bar: close */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Bottom bar: flip + shutter */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleFlip}
            activeOpacity={0.7}
          >
            <RotateCcw size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shutter}
            onPress={handleCapture}
            disabled={capturing}
            activeOpacity={0.8}
          >
            {capturing ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </TouchableOpacity>

          <View style={styles.iconBtn} />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Permission screen
  permWrap: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 28,
    justifyContent: 'center',
    gap: 16,
  },
  permHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  permBody: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  // Buttons
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryBtnInline: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  skipBtnText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  btnDisabled: { opacity: 0.5 },

  // Live camera
  cameraWrap: { flex: 1 },
  camera:     { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },

  // Preview
  previewWrap:  { flex: 1, backgroundColor: '#000' },
  previewImage: { flex: 1, resizeMode: 'cover' },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 28,
    backgroundColor: colors.background,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})
