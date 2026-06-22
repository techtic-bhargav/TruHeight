import { FontFamilies } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import type { TimezoneOption } from "@/utils/timezone";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type TruTimezonePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedValue: string;
  timezones: TimezoneOption[];
  onSelect: (option: TimezoneOption) => void;
};

export function TruTimezonePickerModal({
  visible,
  onClose,
  selectedValue,
  timezones,
  onSelect,
}: TruTimezonePickerModalProps) {
  const insets = useSafeAreaInsets();

  const handleSelect = (item: TimezoneOption) => {
    onSelect(item);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={styles.modalContainer}
          onPress={(e) => e.stopPropagation()}
        >
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
                Select Time Zone
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Feather name="x" size={24} color={Colors.naturalBlack} />
              </Pressable>
            </View>

            <FlatList
              data={timezones}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected = item.label === selectedValue;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                      pressed && styles.optionRowPressed,
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: isSelected
                            ? Colors.onboardingButtonText
                            : Colors.naturalBlack,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {item.label}
                    </Text>
                    {isSelected ? (
                      <Feather
                        name="check"
                        size={20}
                        color={Colors.onboardingButtonText}
                      />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Pressable>
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
  list: {
    maxHeight: 400,
  },
  listContent: {
    paddingBottom: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.textFieldBackground,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  optionRowSelected: {
    backgroundColor: Colors.onboardingButton,
  },
  optionRowPressed: {
    opacity: 0.85,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamilies.ownersMedium,
    marginRight: 12,
  },
});
