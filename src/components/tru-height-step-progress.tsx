import { FontFamilies } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

export type TruHeightStepProgressProps = {
  currentStep: number;
  totalSteps: number;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  activeColor?: string;
  inactiveColor?: string;
};

export function TruHeightStepProgress({
  currentStep,
  totalSteps,
  style,
  labelStyle,
  activeColor = Colors.naturalBlack,
  inactiveColor = 'rgba(224, 185, 151, 0.55)',
}: TruHeightStepProgressProps) {
  const safeTotal = Math.max(1, Math.floor(totalSteps));
  const safeCurrent = Math.min(safeTotal, Math.max(1, Math.floor(currentStep)));

  const steps = useMemo(
    () => Array.from({ length: safeTotal }, (_, i) => i + 1),
    [safeTotal]
  );

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, { color: Colors.textFieldPlaceholder }, labelStyle]}>
        Step {safeCurrent} of {safeTotal}
      </Text>

      <View style={styles.barRow}>
        {steps.map((s) => {
          const isActive = s <= safeCurrent;
          return (
            <View
              key={s}
              style={[
                styles.bar,
                { backgroundColor: isActive ? activeColor : inactiveColor },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontFamily: FontFamilies.ownersRegular,
    marginBottom: 10,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 6,
  },
});

