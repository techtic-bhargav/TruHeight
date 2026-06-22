import { FontFamilies } from '@/constants/fonts';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type UnitType = 'metric' | 'imperial';

export type TruHeightMetricProps = {
  unit: UnitType;
  onUnitChange: (unit: UnitType) => void;
};

export function TruHeightMetric({ unit, onUnitChange }: TruHeightMetricProps) {
  return (
    <View style={styles.unitToggle}>
      <Pressable
        onPress={() => onUnitChange('metric')}
        style={({ pressed }) => [
          styles.toggleOption,
          unit === 'metric' && styles.toggleOptionActive,
          pressed && { opacity: 0.8 },
        ]}
      >
        <Text
          style={[
            styles.toggleText,
            unit === 'metric' && styles.toggleTextActive,
          ]}
        >
          Metric
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onUnitChange('imperial')}
        style={({ pressed }) => [
          styles.toggleOption,
          unit === 'imperial' && styles.toggleOptionActive,
          pressed && { opacity: 0.8 },
        ]}
      >
        <Text
          style={[
            styles.toggleText,
            unit === 'imperial' && styles.toggleTextActive,
          ]}
        >
          Imperial
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(71, 67, 66, 0.2)',
    borderRadius: 25,
    padding: 4,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOptionActive: {
    backgroundColor: '#474342',
  },
  toggleText: {
    fontSize: 16,
    fontFamily: FontFamilies.ownersMedium,
    color: '#464543',
  },
  toggleTextActive: {
    fontSize: 16,
    fontFamily: FontFamilies.ownersMedium,
    color: '#FFFFFF',
  },
});
