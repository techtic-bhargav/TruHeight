import { FontFamilies } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import React, { useEffect, useRef, useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 7;
const ITEMS_ABOVE = 3;

/* ---------- DATA ---------- */

const metricValues = Array.from({ length: 221 }, (_, i) => (30 + i).toString());
const feetValues = Array.from({ length: 9 }, (_, i) => i.toString());
const inchesValues = Array.from({ length: 12 }, (_, i) => i.toString());

/* ---------- TYPES ---------- */

export type TruHeightPickerProps = {
    unit: 'metric' | 'imperial';
    selectedValue?: {
        metric?: number;
        imperial?: { feet: number; inches: number };
    };
    onValueChange: (v: {
        metric?: number;
        imperial?: { feet: number; inches: number };
    }) => void;
};

/* ---------- COMPONENT ---------- */

export function TruHeightPicker({
    unit,
    selectedValue,
    onValueChange,
}: TruHeightPickerProps) {
    const metricRef = useRef<ScrollView>(null);
    const feetRef = useRef<ScrollView>(null);
    const inchesRef = useRef<ScrollView>(null);

    const [metricIndex, setMetricIndex] = useState(
        metricValues.indexOf((selectedValue?.metric ?? 100).toString())
    );

    const [feetIndex, setFeetIndex] = useState(
        selectedValue?.imperial?.feet ?? 4
    );

    const [inchesIndex, setInchesIndex] = useState(
        selectedValue?.imperial?.inches ?? 0
    );

    const scrollTo = (ref: any, index: number) => {
        ref.current?.scrollTo({
            y: index * ITEM_HEIGHT,
            animated: false,
        });
    };

    useEffect(() => {
        setTimeout(() => {
            if (unit === 'metric') {
                scrollTo(metricRef, metricIndex);
            } else {
                scrollTo(feetRef, feetIndex);
                scrollTo(inchesRef, inchesIndex);
            }
        }, 50);
    }, [unit]);

    // Sync internal state when parent updates selectedValue (e.g. edit mode prefill from API)
    useEffect(() => {
        if (unit === 'metric' && selectedValue?.metric != null) {
            const i = metricValues.indexOf(selectedValue.metric.toString());
            if (i >= 0) {
                setMetricIndex(i);
                setTimeout(() => scrollTo(metricRef, i), 60);
            }
        } else if (unit === 'imperial' && selectedValue?.imperial != null) {
            const feet = Math.min(8, Math.max(0, Math.round(selectedValue.imperial.feet)));
            const inches = Math.min(11, Math.max(0, Math.round(selectedValue.imperial.inches ?? 0)));
            setFeetIndex(feet);
            setInchesIndex(inches);
            setTimeout(() => {
                scrollTo(feetRef, feet);
                scrollTo(inchesRef, inches);
            }, 60);
        }
    }, [selectedValue?.metric, selectedValue?.imperial?.feet, selectedValue?.imperial?.inches, unit]);

    /* ---------- RENDER COLUMN ---------- */

    const renderColumn = (
        values: string[],
        index: number,
        ref: any,
        onScroll: any,
        onEnd: any,
        suffix: string,
        wide = false
    ) => (
        <View style={[styles.column, wide && styles.metricColumn]}>
            <View style={styles.pickerContainer}>
                {/* CENTER PILL */}
                <View style={styles.selectionIndicator} pointerEvents="none">
                    <View style={styles.selectionPill}>
                        <Text style={styles.selectedText}>
                            {values[index]}{suffix}
                        </Text>
                    </View>
                </View>

                <ScrollView
                    ref={ref}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    onScroll={onScroll}
                    onMomentumScrollEnd={onEnd}
                    scrollEventThrottle={16}
                    nestedScrollEnabled={Platform.OS === 'android'}
                    contentContainerStyle={{
                        paddingVertical: ITEM_HEIGHT * ITEMS_ABOVE,
                    }}
                >
                    {values.map((v, i) => {
                        const opacity =
                            i === index ? 0 : Math.max(0.35, 1 - Math.abs(i - index) * 0.2);
                        return (
                            <View key={i} style={styles.item}>
                                <Text style={[styles.itemText, { opacity }]}>
                                    {v}{suffix}
                                </Text>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        </View>
    );

    /* ---------- HANDLERS ---------- */

    const onMetricEnd = () =>
        onValueChange({ metric: Number(metricValues[metricIndex]) });

    const onFeetEnd = () =>
        onValueChange({ imperial: { feet: feetIndex, inches: inchesIndex } });

    const onInchesEnd = () =>
        onValueChange({ imperial: { feet: feetIndex, inches: inchesIndex } });

    /* ---------- UI ---------- */

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                {unit === 'metric' ? (
                    renderColumn(
                        metricValues,
                        metricIndex,
                        metricRef,
                        (e: any) =>
                            setMetricIndex(
                                Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT)
                            ),
                        onMetricEnd,
                        ' cm',
                        true
                    )
                ) : (
                    <View style={styles.imperialRow}>
                        {renderColumn(
                            feetValues,
                            feetIndex,
                            feetRef,
                            (e: any) =>
                                setFeetIndex(
                                    Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT)
                                ),
                            onFeetEnd,
                            ' ft'
                        )}
                        {renderColumn(
                            inchesValues,
                            inchesIndex,
                            inchesRef,
                            (e: any) =>
                                setInchesIndex(
                                    Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT)
                                ),
                            onInchesEnd,
                            ' in'
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
    container: { marginTop: 20 },
    card: {
        backgroundColor: Colors.textFieldBackground,
        borderRadius: 20,
        paddingVertical: 20,
    },

    imperialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
    },

    column: {
        width: 110,          // 🔥 FIXED WIDTH
        alignItems: 'center',
    },

    metricColumn: {
        width: '100%',
    },

    pickerContainer: {
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
        overflow: 'hidden',
        width: '100%',
        alignItems: 'center',
    },

    selectionIndicator: {
        position: 'absolute',
        top: ITEM_HEIGHT * ITEMS_ABOVE,
        height: ITEM_HEIGHT,
        width: '100%',       // relative to column now
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },

    selectionPill: {
        backgroundColor: Colors.brandText,
        borderRadius: 40,
        paddingHorizontal: 16,   // ⬅️ increased
        height: 36,
        justifyContent: 'center',

    },

    selectedText: {
        fontFamily: FontFamilies.ownersMedium,
        fontSize: 16,
        color: Colors.naturalBlack,
    },

    item: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },

    itemText: {
        fontSize: 16,
        fontFamily: FontFamilies.ownersRegular,
        color: Colors.naturalBlack,
    },
});
