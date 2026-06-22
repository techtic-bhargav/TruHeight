import { TruHeightSelectTime } from "@/components/tru-height-select-time";
import { FontFamilies } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type TruTimePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedValue: string;
  onSelect: (value: string) => void;
};

export function TruTimePickerModal({
  visible,
  onClose,
  selectedValue,
  onSelect,
}: TruTimePickerModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close modal"
        />
        <View style={styles.modalContainer} pointerEvents="box-none">
          <View
            style={[
              styles.modalContent,
              {
                paddingBottom: Math.max(
                  insets.bottom,
                  Platform.OS === "android" ? 24 : 40,
                ),
              },
            ]}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: Colors.naturalBlack }]}>
                Set Time
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Feather name="x" size={24} color={Colors.naturalBlack} />
              </Pressable>
            </View>

            <TruHeightSelectTime value={selectedValue} onChange={onSelect} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    maxHeight: "70%",
    zIndex: 1,
  },
  modalContent: {
    backgroundColor: Colors.onboardingBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    lineHeight: 26,
    fontFamily: FontFamilies.butlerBold,
  },
});
