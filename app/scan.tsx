import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { ChevronLeft } from 'lucide-react-native'
import { colors } from '../.claude/tokens/colors'

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const scannedRef = useRef(false)

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission()
    }
  }, [permission])

  function handleBarCodeScanned({ data }: { data: string }) {
    if (scannedRef.current) return
    scannedRef.current = true
    setScanned(true)

    // Expect format: spottr://gym/[slug]
    const match = data.match(/^spottr:\/\/gym\/([a-z0-9\-]+)$/)
    if (match) {
      const slug = match[1]
      router.replace(`/gym/${slug}`)
    } else {
      // Not a Spottr gym QR — reset after a moment
      setTimeout(() => {
        scannedRef.current = false
        setScanned(false)
      }, 2000)
    }
  }

  if (!permission) return null

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionWrap}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <ChevronLeft size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.permissionTitle}>Camera access needed</Text>
          <Text style={styles.permissionBody}>
            Spottr needs camera access to scan your gym&apos;s QR code.
          </Text>
          {permission.canAskAgain ? (
            <TouchableOpacity style={styles.btn} onPress={requestPermission} activeOpacity={0.85}>
              <Text style={styles.btnText}>Allow camera</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btn} onPress={() => Linking.openSettings()} activeOpacity={0.85}>
              <Text style={styles.btnText}>Open Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Gym QR</Text>
        <View style={styles.backBtn} />
      </View>

      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Viewfinder overlay */}
        <View style={styles.overlay}>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          {scanned && !scannedRef.current && (
            <View style={styles.invalidWrap}>
              <Text style={styles.invalidText}>Not a Spottr QR — try again</Text>
            </View>
          )}
        </View>
      </CameraView>

      <View style={styles.hint}>
        <Text style={styles.hintText}>Point at your gym&apos;s Spottr QR code</Text>
      </View>
    </SafeAreaView>
  )
}

const CORNER = 24
const BORDER = 3

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },

  permissionWrap: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 32,
    gap: 16,
  },
  back: { marginBottom: 8 },
  permissionTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  permissionBody: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  backBtn: { width: 32 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },

  camera: { flex: 1 },

  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  viewfinder: {
    width: 240,
    height: 240,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: colors.accent,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER, borderBottomRightRadius: 4 },

  invalidWrap: {
    marginTop: 24,
    backgroundColor: 'rgba(239,68,68,0.85)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  invalidText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  hint: {
    paddingVertical: 20,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  hintText: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
})
