import { FontFamilies } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type OptionItem = {
    id: string;
    label: string;
    emoji: string;
    description?: string;
};

export type TruHeightOptionSelectorProps = {
    options: OptionItem[];
    selectedOption?: string;
    onSelect: (optionId: string) => void;
    description?: string;
};

export function TruHeightOptionSelector({
    options,
    selectedOption,
    onSelect,
    description,
}: TruHeightOptionSelectorProps) {
    return (
        <View style={styles.container}>

            <View style={styles.optionsContainer}>
                {options.map((option) => {
                    const selected = option.id === selectedOption;
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
                            <View style={styles.optionContent}>
                                <Text style={styles.emoji}>{option.emoji}</Text>
                                <View style={styles.textContainer}>
                                    <Text
                                        style={[
                                            styles.optionText,
                                            {
                                                fontFamily: selected ? FontFamilies.ownersMedium : FontFamilies.ownersRegular,
                                            },
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                    {option.description && (
                                        <Text style={styles.optionDescription}>
                                            {option.description}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <View style={styles.radioContainer}>
                                <View
                                    style={[
                                        styles.radioOuter,
                                        {
                                            borderColor: selected ? Colors.naturalBlack : stylesVars.radioBorder,
                                        },
                                    ]}
                                >
                                    {selected && <View style={styles.radioInner} />}
                                </View>
                            </View>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const stylesVars = {
    selectedBackground: Colors.brandText, // Light brown/tan background for selected
    unselectedBackground: Colors.textFieldBackground, // White background for unselected
    radioBorder: 'rgba(71, 67, 66, 0.3)',
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        fontFamily: FontFamilies.ownersRegular,
        color: Colors.textFieldPlaceholder,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    optionsContainer: {
        width: '100%',
        gap: 12,
    },
    option: {
        width: '100%',
        borderRadius: 56,
        paddingVertical: 16,
        paddingHorizontal: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 72,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    emoji: {
        fontSize: 32,
    },
    textContainer: {
        flex: 1,
        gap: 4,
    },
    optionText: {
        fontSize: 16,
        fontFamily: FontFamilies.ownersRegular,
        color: Colors.naturalBlack,
    },
    optionDescription: {
        fontSize: 14,
        fontFamily: FontFamilies.ownersRegular,
        color: Colors.naturalBlack,
        lineHeight: 18,
    },
    radioContainer: {
        marginLeft: 12,
    },
    radioOuter: {
        width: 16.67,
        height: 16.67,
        borderRadius: 11,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 6,
        backgroundColor: Colors.naturalBlack,
    },
});
