import { FontFamilies } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type SubscriptionType = 'monthly' | 'lifetime';

interface TruSubscriptionToggleProps {
    selected: SubscriptionType;
    onSelect: (type: SubscriptionType) => void;
    monthlyLabel?: string;
    lifetimeLabel?: string;
}

/** Leaderboard-only: use leftValue/rightValue so onSelect receives "child" | "parent" */
interface LeaderboardToggleProps {
    selected: 'child' | 'parent';
    onSelect: (type: 'child' | 'parent') => void;
    leftLabel?: string;
    rightLabel?: string;
}

function isLeaderboardProps(
    p: TruSubscriptionToggleProps | LeaderboardToggleProps
): p is LeaderboardToggleProps {
    return 'leftLabel' in p || 'rightLabel' in p || p.selected === 'child' || p.selected === 'parent';
}

export const TruSubscriptionToggle: React.FC<TruSubscriptionToggleProps | LeaderboardToggleProps> = (props) => {
    if (isLeaderboardProps(props)) {
        const { selected, onSelect, leftLabel = 'Child', rightLabel = 'Parent' } = props;
        return (
            <View style={styles.container}>
                <Pressable
                    onPress={() => onSelect('child')}
                    style={[styles.option, styles.leftOption, selected === 'child' && styles.optionSelected]}
                >
                    <Text style={styles.optionText}>{leftLabel}</Text>
                </Pressable>
                <Pressable
                    onPress={() => onSelect('parent')}
                    style={[styles.option, styles.rightOption, selected === 'parent' && styles.optionSelected]}
                >
                    <Text style={styles.optionText}>{rightLabel}</Text>
                </Pressable>
            </View>
        );
    }
    const { selected, onSelect, monthlyLabel = 'Monthly', lifetimeLabel = 'Lifetime' } = props;
    return (
        <View style={styles.container}>
            <Pressable
                onPress={() => onSelect('monthly')}
                style={[styles.option, styles.leftOption, selected === 'monthly' && styles.optionSelected]}
            >
                <Text style={styles.optionText}>{monthlyLabel}</Text>
            </Pressable>
            <Pressable
                onPress={() => onSelect('lifetime')}
                style={[styles.option, styles.rightOption, selected === 'lifetime' && styles.optionSelected]}
            >
                <Text style={styles.optionText}>{lifetimeLabel}</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: Colors.onboardingBackground,
        borderRadius: 40,
        padding: 4,
        gap: 4,
    },
    option: {
        flex: 1,
        paddingVertical: 9,
        paddingHorizontal: 16,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    leftOption: {
        borderTopLeftRadius: 40,
        borderBottomLeftRadius: 40,
    },
    rightOption: {
        borderTopRightRadius: 40,
        borderBottomRightRadius: 40,
    },
    optionSelected: {
        backgroundColor: Colors.brandText,
    },
    optionText: {
        fontSize: 16,
        fontFamily: FontFamilies.ownersMedium,
        color: Colors.naturalBlack,
    },

});
