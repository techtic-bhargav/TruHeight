import { FontFamilies } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

export type TruHeightShareButtonProps = {
  title?: string;
} & Pick<TouchableOpacityProps, "onPress" | "disabled" | "accessibilityRole">;

export function TruHeightShareButton({
  title = "Share on Social",
  onPress,
  disabled,
  accessibilityRole = "button",
}: TruHeightShareButtonProps) {
  const backgroundColor = disabled ? Colors.divider : Colors.brandText;
  const textColor = Colors.onboardingButtonText;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor, opacity: disabled ? 0.7 : 1 }]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      activeOpacity={0.85}
    >
      <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 40,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 52,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
    fontFamily: FontFamilies.ownersMedium,
  },
});
