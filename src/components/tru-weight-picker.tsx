import { FontFamilies } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';

/* ---------------- CONSTANTS ---------------- */

const ITEM_WIDTH = 8;
const SIDE_PADDING = 160;

// Metric: 1kg to 200kg with 0.1kg increments
const METRIC_MIN = 1;
const METRIC_MAX = 200;
const METRIC_STEP = 0.1;

// Imperial: 2lb to 440lb with 0.1lb increments
const IMPERIAL_MIN = 2;
const IMPERIAL_MAX = 440;
const IMPERIAL_STEP = 0.1;

/* ---------------- DATA ---------------- */

const metricValues = Array.from(
    { length: Math.round((METRIC_MAX - METRIC_MIN) / METRIC_STEP) + 1 },
    (_, i) => +(METRIC_MIN + i * METRIC_STEP).toFixed(1)
);

const imperialValues = Array.from(
    { length: Math.round((IMPERIAL_MAX - IMPERIAL_MIN) / IMPERIAL_STEP) + 1 },
    (_, i) => +(IMPERIAL_MIN + i * IMPERIAL_STEP).toFixed(1)
);

/* ---------------- TYPES ---------------- */

export type TruWeightPickerProps = {
    unit: 'metric' | 'imperial';
    selectedValue?: {
        metric?: number;
        imperial?: number;
    };
    onValueChange: (v: { metric?: number; imperial?: number }) => void;
};

/* ---------------- COMPONENT ---------------- */

export function TruWeightPicker({
    unit,
    selectedValue,
    onValueChange,
}: TruWeightPickerProps) {
    const scrollX = useRef(new Animated.Value(0)).current;
    const listRef = useRef<FlatList>(null);
    const isScrollingProgrammatically = useRef(false);
    const rafRef = useRef<number | null>(null);
    const [rulerWidth, setRulerWidth] = useState(Dimensions.get('window').width - 48); // Account for card padding

    // Get current values and initial weight based on unit
    const currentValues = unit === 'metric' ? metricValues : imperialValues;
    const getInitialWeight = () => {
        if (unit === 'metric') {
            return selectedValue?.metric ?? 45;
        } else {
            return selectedValue?.imperial ?? 100;
        }
    };

    // Ensure initial weight is a whole number if no selectedValue
    const initialWeight = getInitialWeight();
    const normalizedInitialWeight = selectedValue
        ? initialWeight
        : (unit === 'metric' ? 45 : 100);

    const [weight, setWeight] = useState(normalizedInitialWeight);
    const latestWeightRef = useRef(normalizedInitialWeight);
    const currentUnit = unit === 'metric' ? 'Kg' : 'lb';

    const updateWeightIfChanged = (nextWeight: number) => {
        if (Math.abs(nextWeight - latestWeightRef.current) > 0.05) {
            latestWeightRef.current = nextWeight;
            setWeight(nextWeight);
        }
    };

    /* ---------- UPDATE WEIGHT WHEN UNIT OR SELECTED VALUE CHANGES ---------- */
    useEffect(() => {
        latestWeightRef.current = weight;
    }, [weight]);

    useEffect(() => {
        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const newWeight = unit === 'metric'
            ? (selectedValue?.metric ?? 45)
            : (selectedValue?.imperial ?? 100);

        // Only update if the weight actually changed significantly
        if (Math.abs(newWeight - weight) > 0.05) {
            updateWeightIfChanged(newWeight);
            // Scroll to the new weight position
            if (listRef.current && rulerWidth > 0) {
                isScrollingProgrammatically.current = true;
                const index = currentValues.findIndex(v => Math.abs(v - newWeight) < 0.05);
                if (index !== -1) {
                    const scrollX = (SIDE_PADDING + index * ITEM_WIDTH) - (rulerWidth / 2);
                    listRef.current.scrollToOffset({
                        offset: Math.max(0, scrollX),
                        animated: true,
                    });
                    // Reset flag after animation
                    setTimeout(() => {
                        isScrollingProgrammatically.current = false;
                    }, 300);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unit, selectedValue?.metric, selectedValue?.imperial, rulerWidth]);

    /* ---------- INITIAL SCROLL POSITION ---------- */
    useEffect(() => {
        if (rulerWidth > 0 && listRef.current) {
            // Find the exact index for the normalized initial weight (always whole number for defaults)
            const targetWeight = normalizedInitialWeight;
            const index = currentValues.findIndex(v => Math.abs(v - targetWeight) < 0.05);

            if (index !== -1) {
                setTimeout(() => {
                    isScrollingProgrammatically.current = true;
                    const scrollX = (SIDE_PADDING + index * ITEM_WIDTH) - (rulerWidth / 2);
                    listRef.current?.scrollToOffset({
                        offset: Math.max(0, scrollX),
                        animated: false,
                    });
                    // Ensure weight is set to the exact value
                    updateWeightIfChanged(currentValues[index]);
                    setTimeout(() => {
                        isScrollingProgrammatically.current = false;
                    }, 100);
                }, 150);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rulerWidth, unit]);

    /* ---------- SCROLL HANDLER ---------- */
    const onScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        {
            useNativeDriver: true,
            listener: (e: any) => {
                // Skip if we're programmatically scrolling
                if (isScrollingProgrammatically.current) {
                    return;
                }
                const scrollOffset = e.nativeEvent.contentOffset.x;
                if (rafRef.current !== null) {
                    cancelAnimationFrame(rafRef.current);
                }
                rafRef.current = requestAnimationFrame(() => {
                    const centerPosition = rulerWidth / 2;
                    const tickPosition = scrollOffset + centerPosition - SIDE_PADDING;
                    const index = Math.round(tickPosition / ITEM_WIDTH);
                    const clamped = Math.max(
                        0,
                        Math.min(currentValues.length - 1, index)
                    );
                    const newWeight = currentValues[clamped];
                    updateWeightIfChanged(newWeight);
                });
            },
        }
    );

    /* ---------- SCROLL END HANDLER ---------- */
    const onScrollEnd = (e: any) => {
        // Skip if we're programmatically scrolling
        if (isScrollingProgrammatically.current) {
            return;
        }

        const scrollOffset = e.nativeEvent.contentOffset.x;
        const centerPosition = rulerWidth / 2;
        const tickPosition = scrollOffset + centerPosition - SIDE_PADDING;
        const index = Math.round(tickPosition / ITEM_WIDTH);
        const clamped = Math.max(0, Math.min(currentValues.length - 1, index));

        // Snap to exact position
        isScrollingProgrammatically.current = true;
        const snapScrollX = (SIDE_PADDING + clamped * ITEM_WIDTH) - (rulerWidth / 2);
        listRef.current?.scrollToOffset({
            offset: Math.max(0, snapScrollX),
            animated: true,
        });

        const newWeight = currentValues[clamped];
        updateWeightIfChanged(newWeight);

        // Reset flag after animation
        setTimeout(() => {
            isScrollingProgrammatically.current = false;
        }, 300);

        // Call onValueChange callback
        if (unit === 'metric') {
            onValueChange({ metric: newWeight });
        } else {
            onValueChange({ imperial: newWeight });
        }
    };

    /* ---------- RENDER TICK ---------- */
    const renderItem = ({ item }: any) => {
        // For imperial, major ticks are whole numbers (2, 3, 4, etc.)
        // For metric, major ticks are whole numbers (1, 2, 3, etc.)
        const isMajor = Number.isInteger(item);

        return (
            <View style={styles.tickWrap}>
                {isMajor && (
                    <View style={styles.labelContainer}>
                        <Text style={styles.label}>{item}</Text>
                    </View>
                )}
                <View
                    style={[
                        styles.tick,
                        {
                            height: isMajor ? 36 : 24,
                            width: 1.6,
                        },
                    ]}
                />
            </View>
        );
    };

    return (
        <View style={styles.screen}>
            <View style={styles.card}>

                {/* -------- VALUE -------- */}
                <Text style={styles.unit}>
                    {weight.toFixed(1)}{' '}
                    <Text style={styles.unit}>{currentUnit}</Text>
                </Text>

                {/* -------- RULER -------- */}
                <View
                    style={styles.ruler}
                    onLayout={(e) => {
                        const { width } = e.nativeEvent.layout;
                        setRulerWidth(width);
                    }}
                >
                    <Animated.FlatList
                        ref={listRef}
                        data={currentValues}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={ITEM_WIDTH}
                        decelerationRate={Platform.select({
                            ios: 0.994,
                            android: 0.985,
                            native: 0.99,
                        })}
                        bounces={false}
                        overScrollMode="never"
                        windowSize={9}
                        initialNumToRender={100}
                        maxToRenderPerBatch={80}
                        updateCellsBatchingPeriod={16}
                        removeClippedSubviews={false}
                        onScroll={onScroll}
                        onMomentumScrollEnd={onScrollEnd}
                        scrollEventThrottle={16}
                        contentContainerStyle={{
                            paddingHorizontal: SIDE_PADDING,
                        }}
                        renderItem={renderItem}
                        keyExtractor={(_, i) => i.toString()}
                        getItemLayout={(_, i) => ({
                            length: ITEM_WIDTH,
                            offset: ITEM_WIDTH * i,
                            index: i,
                        })}
                    />

                    {/* CENTER LINE */}
                    <View style={styles.centerLine} />
                </View>

                <Text style={styles.kg}>{currentUnit}</Text>
            </View>
        </View>
    );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    screen: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },

    card: {
        backgroundColor: Colors.textFieldBackground,
        borderRadius: 22,
        padding: 24,
        alignItems: 'center',
        height: 284,
    },

    unit: {
        fontSize: 40,
        fontFamily: FontFamilies.ownersMedium,
        color: Colors.naturalBlack,
        marginTop: 16,
    },

    ruler: {
        height: 80,
        width: '100%',
        marginTop: 40,
        overflow: 'visible',
    },

    tickWrap: {
        width: ITEM_WIDTH,
        alignItems: 'center',
        justifyContent: 'flex-end',
        position: 'relative',
    },

    labelContainer: {
        position: 'absolute',
        top: 0,
        left: -13.5, // Center: (35 - 8) / 2 = 13.5
        width: 35,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 20,
    },

    label: {
        fontSize: 16,
        color: Colors.naturalBlack,
        fontFamily: FontFamilies.ownersMedium,
        textAlign: 'center',
        includeFontPadding: false,
    },

    tick: {
        backgroundColor: Colors.naturalBlack,
        borderRadius: 10,
    },

    centerLine: {
        position: 'absolute',
        left: '50.5%',
        bottom: -15,
        width: 3,
        height: 65,
        // marginLeft: -0,
        backgroundColor: '#3A3A3A',
        borderRadius: 10,
    },

    kg: {
        marginTop: 20,
        fontSize: 20,
        color: Colors.naturalBlack,
        fontFamily: FontFamilies.ownersRegular,
    },
});


