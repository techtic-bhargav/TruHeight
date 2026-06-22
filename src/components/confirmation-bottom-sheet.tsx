import { TruHeightShareButton } from '@/components/tru-height-share-button';
import { FontFamilies } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type ConfirmationBottomSheetConfig = {
  title: string;
  description: string;
  buttonText: string;
  onConfirm: () => void | Promise<void>;
};

export type ConfirmationBottomSheetRef = {
  open: (config: ConfirmationBottomSheetConfig) => void;
  close: () => void;
};

export const ConfirmationBottomSheet = forwardRef<
  ConfirmationBottomSheetRef,
  object
>(function ConfirmationBottomSheet(_, ref) {
  const modalRef = useRef<BottomSheetModal>(null);
  const [config, setConfig] = useState<ConfirmationBottomSheetConfig | null>(
    null
  );

  const snapPoints = useMemo(() => ['45%'], []);

  const open = useCallback((nextConfig: ConfirmationBottomSheetConfig) => {
    setConfig(nextConfig);
    // Defer present() so React commits the config state first (fixes double-tap)
    setTimeout(() => {
      modalRef.current?.present();
    }, 0);
  }, []);

  const close = useCallback(() => {
    modalRef.current?.dismiss();
  }, []);

  useImperativeHandle(ref, () => ({ open, close }), [open, close]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handleConfirm = useCallback(() => {
    if (config?.onConfirm) {
      const result = config.onConfirm();
      if (result instanceof Promise) {
        result.finally(() => close());
      } else {
        close();
      }
    }
  }, [config, close]);

  const handleClose = useCallback(() => {
    close();
  }, [close]);

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetView style={styles.content}>
        {config && (
          <>
            <Pressable
              onPress={handleClose}
              hitSlop={12}
              style={styles.closeButton}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.description}>{config.description}</Text>
            <View style={styles.primaryButtonWrap}>
              <TruHeightShareButton
                title={config.buttonText}
                onPress={handleConfirm}
              />
            </View>
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: Colors.textFieldBorder,
  },
  sheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
  },
  closeButton: {
    position: 'absolute',
    right: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 20,
    color: Colors.naturalBlack,
    fontWeight: '300',
    paddingBottom: 10,
  },
  title: {
    fontFamily: FontFamilies.butlerBold,
    fontSize: 26,
    lineHeight: 28,
    color: Colors.naturalBlack,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  description: {
    fontFamily: FontFamilies.ownersRegular,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textFieldPlaceholder,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  primaryButtonWrap: {
    marginBottom: 30,
  },
});
