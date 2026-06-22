import { FontFamilies } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

export type TruHeightDropdownTextFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  onPress?: () => void;
  /** Override input container style (e.g. backgroundColor for pill look) */
  inputStyle?: ViewStyle;
};

export function TruHeightDropdownTextField({
  label,
  value,
  placeholder,
  onPress,
  inputStyle,
}: TruHeightDropdownTextFieldProps) {
  const display = value || placeholder || "";
  const isPlaceholder = !value;

  return (
    <View style={styles.dropdownField}>
      <Text
        style={[styles.dropdownLabel, { color: Colors.textFieldPlaceholder }]}
      >
        {label}
      </Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.dropdownInput,
          {
            borderColor: Colors.textFieldBorder,
            opacity: pressed ? 0.92 : 1,
          },
          inputStyle,
        ]}
      >
        <Text
          style={[
            styles.dropdownValue,
            {
              color: isPlaceholder
                ? Colors.textFieldPlaceholder
                : Colors.naturalBlack,
            },
          ]}
          numberOfLines={1}
        >
          {display}
        </Text>
        <MaterialIcons
          name="keyboard-arrow-down"
          size={24}
          color={Colors.textFieldPlaceholder}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownField: {
    width: "100%",
  },
  dropdownLabel: {
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 10,
    fontFamily: FontFamilies.ownersRegular,
  },
  dropdownInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 50,
  },
  dropdownValue: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamilies.ownersRegular,
    marginRight: 8,
  },
});
