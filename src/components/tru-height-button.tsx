import { FontFamilies } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

export type TruHeightButtonProps = {
  title?: string;
} & Pick<TouchableOpacityProps, 'onPress' | 'disabled' | 'accessibilityRole'>;

export function TruHeightButton({
  title = "Let's Start",
  onPress,
  disabled,
  accessibilityRole = 'button',
}: TruHeightButtonProps) {
  const backgroundColor = disabled ? Colors.divider : Colors.onboardingButton;
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
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 52,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
    fontFamily: FontFamilies.ownersMedium,
  },
});

