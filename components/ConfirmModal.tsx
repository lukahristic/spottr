import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { colors } from '../.claude/tokens/colors'

type Props = {
  visible: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  destructive?: boolean
}

/**
 * In-app confirmation modal. Replaces native Alert.alert for actions that
 * deserve a warmer, on-brand prompt. Matches the modal look used elsewhere
 * (dark overlay + surface card). Confirm button disables and shows a spinner
 * while `loading`, so callers don't need their own double-tap guard in the UI.
 */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Not yet',
  onConfirm,
  onCancel,
  loading = false,
  destructive = false,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={[styles.confirmBtn, destructive && styles.confirmBtnDestructive, loading && styles.btnDisabled]}
            onPress={onConfirm}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={destructive ? '#C0392B' : colors.textPrimary} />
              : <Text style={[styles.confirmText, destructive && styles.confirmTextDestructive]}>{confirmLabel}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel} disabled={loading} activeOpacity={0.7} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>{cancelLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 8,
  },
  confirmBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  confirmBtnDestructive: {
    backgroundColor: 'transparent',
    borderColor: '#C0392B',
  },
  btnDisabled: { opacity: 0.6 },
  confirmText: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  confirmTextDestructive: { color: '#C0392B' },
  cancelBtn: { paddingVertical: 10, alignItems: 'center' },
  cancelText: { fontSize: 14, color: colors.textSecondary },
})
