import { TruHeightButton } from '@/components/tru-height-button';
import { FontFamilies } from '@/constants/fonts';
import { Images } from '@/constants/images';
import { Colors } from '@/constants/theme';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

const TINT_COLOR = Colors.naturalBlack;

function useIsOffline() {
  const [isOffline, setIsOffline] = useState(false);

  const update = useCallback((state: NetInfoState | null) => {
    setIsOffline(state?.isConnected === false);
  }, []);

  useEffect(() => {
    NetInfo.fetch().then(update);
    const unsubscribe = NetInfo.addEventListener(update);
    return () => unsubscribe();
  }, [update]);

  return { isOffline, update };
}

export function NoConnectionOverlay() {
  const { isOffline, update } = useIsOffline();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    const state = await NetInfo.fetch();
    setRetrying(false);
    update(state);
  }, [update]);

  if (!isOffline) return null;

  return (
    <Modal visible transparent statusBarTranslucent animationType="fade">
      <View style={styles.container}>
        <Image
          source={Images.noWifi}
          style={[styles.icon, { tintColor: TINT_COLOR }]}
          contentFit="contain"
        />
        <Text style={styles.title}>No internet connection</Text>
        <Text style={styles.message}>
          Please check your connection and try again.
        </Text>
        <View style={styles.buttonWrap}>
          <TruHeightButton
            title={retrying ? 'Checking…' : 'Retry'}
            onPress={handleRetry}
            disabled={retrying}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontFamily: FontFamilies.ownersMedium,
    fontSize: 20,
    color: Colors.titleBlack,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: FontFamilies.ownersRegular,
    fontSize: 16,
    color: Colors.onboardingTextSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonWrap: {
    width: '100%',
    maxWidth: 280,
  },
});
