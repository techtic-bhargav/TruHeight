import { FontFamilies } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ImagePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectGallery: () => void;
  onSelectCamera: () => void;
};

export function TruImagePickerModal({
  visible,
  onClose,
  onSelectGallery,
  onSelectCamera,
}: ImagePickerModalProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 40) }]}>
            <View style={styles.header}>
              <Text style={styles.title}>Choose Photo</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Feather name="x" size={24} color={Colors.naturalBlack} />
              </Pressable>
            </View>

            <View style={styles.optionsContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.optionButton,
                  pressed && styles.optionButtonPressed,
                ]}
                onPress={onSelectGallery}
              >
                <View style={styles.optionIconContainer}>
                  <Feather name="image" size={28} color={Colors.naturalBlack} />
                </View>
                <Text style={styles.optionText}>Choose from Gallery</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.optionButton,
                  pressed && styles.optionButtonPressed,
                ]}
                onPress={onSelectCamera}
              >
                <View style={styles.optionIconContainer}>
                  <Feather name="camera" size={28} color={Colors.naturalBlack} />
                </View>
                <Text style={styles.optionText}>Take a Photo</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: Colors.onboardingBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 24,
    // paddingBottom will be set dynamically based on safe area insets
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    lineHeight: 26,
    fontFamily: FontFamilies.butlerBold,
    color: Colors.naturalBlack,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.textFieldBackground,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 16,
  },
  optionButtonPressed: {
    opacity: 0.8,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.onboardingBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 16,
    fontFamily: FontFamilies.ownersBold,
    color: Colors.naturalBlack,
  },
});
