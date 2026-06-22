import { FontFamilies } from '@/constants/fonts';
import React, { useEffect } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text
} from 'react-native';
import { create } from 'zustand';

const TOAST_DURATION_MS = 3500;

type ToastType = 'success' | 'error';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  show: (message: string, type: ToastType) => void;
  hide: () => void;
}

const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  type: 'error',
  show: (message, type) => set({ visible: true, message, type }),
  hide: () => set({ visible: false }),
}));

export const ToastService = {
  showError: (message: string) => useToastStore.getState().show(message, 'error'),
  showSuccess: (message: string) => useToastStore.getState().show(message, 'success'),
};

export const ToastOverlay = () => {
  const { visible, message, type, hide } = useToastStore();

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(hide, TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, [visible, hide]);

  const isError = type === 'error';
  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade">
      <Pressable style={styles.backdrop} onPress={hide}>
        <Pressable
          style={[
            styles.toast,
            isError ? styles.toastError : styles.toastSuccess,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text
            style={[styles.text, isError ? styles.textError : styles.textSuccess]}
            numberOfLines={3}
          >
            {message}
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
};


const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  toast: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastError: {
    backgroundColor: '#2C2C2C',
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
  },
  toastSuccess: {
    backgroundColor: '#2C2C2C',
    borderLeftWidth: 4,
    borderLeftColor: '#198754',
  },
  text: {
    fontSize: 14,
    fontFamily: FontFamilies.ownersRegular,
  },
  textError: {
    color: '#FFFFFF',
  },
  textSuccess: {
    color: '#FFFFFF',
  },
});
