import { Colors } from '@/constants/theme';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  View,
} from 'react-native';
import { create } from 'zustand';

const LOADER_COLOR = Colors.onboardingButton;
const LOADER_OVERLAY_COLOR = '#FFFFFF';

// --- Loader Component ---
export type LoadingProps = {
  fullScreen?: boolean;
  size?: 'small' | 'large';
};

export const Loader = ({
  fullScreen = false,
  size = 'large',
}: LoadingProps) => (
  <View style={fullScreen ? styles.fullScreen : styles.inline}>
    <ActivityIndicator size={size} color={LOADER_COLOR} />
  </View>
);

// --- LoaderService Singleton ---
const useLoaderStore = create<{ visible: boolean; show: () => void; hide: () => void }>(
  (set) => ({
    visible: false,
    show: () => set({ visible: true }),
    hide: () => set({ visible: false }),
  })
);

export const LoaderService = {
  show: () => useLoaderStore.getState().show(),
  hide: () => useLoaderStore.getState().hide(),
};

// --- LoaderOverlay ---
export const LoaderOverlay = () => {
  const visible = useLoaderStore((s) => s.visible);
  if (!visible) return null;

  return (
    <Modal visible transparent statusBarTranslucent animationType="fade">
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color={LOADER_OVERLAY_COLOR} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  overlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
