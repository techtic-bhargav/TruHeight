import { FontFamilies } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type EthnicityOption = {
    id: string;
    label: string;
};

export type TruHeightEthnicitySelectorProps = {
    selectedEthnicity?: string;
    onSelect: (ethnicityId: string) => void;
    options?: EthnicityOption[];
    loading?: boolean;
};

export function TruHeightEthnicitySelector({
    selectedEthnicity,
    onSelect,
    options = [],
    loading = false,
}: TruHeightEthnicitySelectorProps) {
    const ethnicityOptions = options.length > 0 ? options : [];

    if (loading) {
        return <View style={styles.container} />;
    }

    if (ethnicityOptions.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>No options available</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {ethnicityOptions.map((option) => {
                const selected = option.id === selectedEthnicity;
                return (
                    <Pressable
                        key={option.id}
                        onPress={() => onSelect(option.id)}
                        hitSlop={8}
                        style={({ pressed }) => [
                            styles.option,
                            {
                                backgroundColor: selected ? stylesVars.selectedBackground : stylesVars.unselectedBackground,
                                transform: [{ scale: pressed ? 0.98 : 1 }],
                            },
                        ]}
                    >
                        <Text
                            style={
                                [styles.optionText,
                                {
                                    fontFamily: selected ? FontFamilies.ownersMedium : FontFamilies.ownersRegular,
                                },
                                ]
                            }
                        >
                            {option.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const stylesVars = {
    selectedBackground: Colors.brandText, // Light brown/tan background for selected
    unselectedBackground: Colors.textFieldBackground, // Light beige for unselected
    borderColor: 'rgba(71, 67, 66, 0.15)', // Subtle border
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        gap: 12,
    },
    option: {
        width: '100%',
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    optionText: {
        fontSize: 16,
        fontFamily: FontFamilies.ownersRegular,
        textAlign: 'center',
        color: Colors.naturalBlack,
    },
    emptyText: {
        fontSize: 14,
        fontFamily: FontFamilies.ownersRegular,
        textAlign: 'center',
        color: Colors.textFieldPlaceholder,
        paddingVertical: 20,
    },
});
