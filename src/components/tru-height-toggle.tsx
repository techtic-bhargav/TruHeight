import { FontFamilies } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const MEASUREMENT_OPTIONS = [
    { id: 'metric', label: 'Metric' },
    { id: 'imperial', label: 'Imperial' },
];

export type TruHeightToggleProps = {
    selectedOption?: 'metric' | 'imperial';
    onSelect: (optionId: 'metric' | 'imperial') => void;
};

export function TruHeightToggle({
    selectedOption = 'metric',
    onSelect,
}: TruHeightToggleProps) {
    return (
        <View style={styles.container}>
            <View style={styles.toggleContainer}>
                {MEASUREMENT_OPTIONS.map((option, index) => {
                    const isSelected = option.id === selectedOption;
                    const isFirst = index === 0;
                    const isLast = index === MEASUREMENT_OPTIONS.length - 1;

                    return (
                        <Pressable
                            key={option.id}
                            onPress={() => onSelect(option.id as 'metric' | 'imperial')}
                            style={({ pressed }) => [
                                styles.toggleSegment,
                                isFirst && styles.toggleSegmentFirst,
                                isLast && styles.toggleSegmentLast,
                                {
                                    backgroundColor: isSelected
                                        ? Colors.onboardingButton
                                        : 'transparent',
                                    transform: [{ scale: pressed ? 0.98 : 1 }],
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.toggleText,
                                    {
                                        color: isSelected
                                            ? Colors.onboardingButtonText
                                            : Colors.naturalBlack,
                                        fontFamily: FontFamilies.ownersMedium

                                    },
                                ]}
                            >
                                {option.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 208,
        height: 50,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.divider,
        borderRadius: 40,
        padding: 4,
        gap: 4,
        height: 50,
    },
    toggleSegment: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 36,
        minHeight: 34,
    },
    toggleSegmentFirst: {
        borderTopLeftRadius: 36,
        borderBottomLeftRadius: 36,
    },
    toggleSegmentLast: {
        borderTopRightRadius: 36,
        borderBottomRightRadius: 36,
    },
    toggleText: {
        fontSize: 16,
        fontFamily: FontFamilies.ownersRegular,
    },
});
