import { FontFamilies } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import React, { useRef, useState } from 'react';
import {
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';


const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 7; // 3 above + 1 selected + 3 below
const ITEMS_ABOVE = 3;


const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Year range: current year back to 100 years (no restriction in picker; validation on Next)
const getYears = (_profileType?: 'child' | 'self') => {
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 100;
    const maxYear = currentYear;

    return Array.from(
        { length: maxYear - minYear + 1 },
        (_, i) => (minYear + i).toString()
    );
};

export type TruHeightDatePickerProps = {
    selectedDate?: Date;
    onDateChange: (date: Date) => void;
    minDate?: Date;
    maxDate?: Date;
    profileType?: 'child' | 'self';
};

export function TruHeightDatePicker({
    selectedDate = new Date(),
    onDateChange,
    minDate,
    maxDate,
    profileType,
}: TruHeightDatePickerProps) {
    const monthScrollRef = useRef<ScrollView>(null);
    const dayScrollRef = useRef<ScrollView>(null);
    const yearScrollRef = useRef<ScrollView>(null);

    const years = getYears(profileType);
    const minYear = years.length > 0 ? parseInt(years[0], 10) : new Date().getFullYear() - 21;
    const maxYear = years.length > 0 ? parseInt(years[years.length - 1], 10) : new Date().getFullYear() - 2;

    const [selectedMonth, setSelectedMonth] = useState(selectedDate.getMonth());
    const [selectedDay, setSelectedDay] = useState(selectedDate.getDate());
    const [selectedYear, setSelectedYear] = useState(() =>
        Math.min(maxYear, Math.max(minYear, selectedDate.getFullYear()))
    );

    const handleMonthScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        const newMonth = Math.max(0, Math.min(11, index));
        setSelectedMonth(newMonth);
    };

    const handleMonthScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        const newMonth = Math.max(0, Math.min(11, index));
        setSelectedMonth(newMonth);
        updateDate(newMonth, selectedDay, selectedYear);
    };

    const handleDayScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const newDay = Math.max(1, Math.min(daysInMonth, index + 1));
        setSelectedDay(newDay);
    };

    const handleDayScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const newDay = Math.max(1, Math.min(daysInMonth, index + 1));
        setSelectedDay(newDay);
        updateDate(selectedMonth, newDay, selectedYear);
    };

    const handleYearScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(years.length - 1, index));
        const newYear = parseInt(years[clampedIndex] || years[0]);
        setSelectedYear(newYear);
    };

    const handleYearScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(years.length - 1, index));
        const newYear = parseInt(years[clampedIndex] || years[0]);
        setSelectedYear(newYear);
        updateDate(selectedMonth, selectedDay, newYear);
    };

    const updateDate = (month: number, day: number, year: number) => {
        // Get the maximum days in the selected month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const validDay = Math.min(day, daysInMonth);

        const newDate = new Date(year, month, validDay);

        // Validate against min/max dates if provided
        if (minDate && newDate < minDate) {
            return;
        }
        if (maxDate && newDate > maxDate) {
            return;
        }

        onDateChange(newDate);
    };

    const scrollToMonth = (month: number) => {
        monthScrollRef.current?.scrollTo({
            y: month * ITEM_HEIGHT,
            animated: true,
        });
    };

    const scrollToDay = (day: number) => {
        dayScrollRef.current?.scrollTo({
            y: (day - 1) * ITEM_HEIGHT,
            animated: true,
        });
    };

    const scrollToYear = (year: number) => {
        const yearIndex = years.indexOf(year.toString());
        if (yearIndex !== -1) {
            yearScrollRef.current?.scrollTo({
                y: yearIndex * ITEM_HEIGHT,
                animated: true,
            });
        }
    };

    React.useEffect(() => {
        // Scroll to selected values on mount
        scrollToMonth(selectedMonth);
        scrollToDay(selectedDay);
        scrollToYear(selectedYear);
    }, []);

    // Update day when month or year changes
    React.useEffect(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        if (selectedDay > daysInMonth) {
            const newDay = daysInMonth;
            setSelectedDay(newDay);
            updateDate(selectedMonth, newDay, selectedYear);
            scrollToDay(newDay);
        }
    }, [selectedMonth, selectedYear]);

    const renderPickerColumn = (
        items: string[],
        selectedIndex: number,
        onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
        onScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
        scrollRef: React.RefObject<ScrollView>,
        label: string
    ) => {
        return (
            <View style={styles.column}>
                <Text style={styles.columnHeader}>{label}</Text>
                <View style={styles.pickerContainer}>
                    {/* Fixed Selection Indicator Overlay - Sticky Background */}
                    <View style={styles.selectionIndicator} pointerEvents="none">
                        <View style={styles.selectionIndicatorBackground}>
                            <Text
                                style={[
                                    styles.pickerItemText,
                                    styles.pickerItemTextSelected,
                                ]}
                            >
                                {items[selectedIndex]}
                            </Text>
                        </View>
                    </View>

                    {/* Scrollable Content */}
                    <ScrollView
                        ref={scrollRef}
                        showsVerticalScrollIndicator={false}
                        onScroll={onScroll}
                        onMomentumScrollEnd={onScrollEnd}
                        scrollEventThrottle={16}
                        snapToInterval={ITEM_HEIGHT}
                        decelerationRate="fast"
                        contentContainerStyle={styles.scrollContent}
                    >
                        {items.map((item, index) => {
                            const isSelected = index === selectedIndex;
                            const distance = Math.abs(index - selectedIndex);
                            const opacity = isSelected ? 0 : Math.max(0.4, 1.0 - (distance * 0.2));

                            return (
                                <View
                                    key={index}
                                    style={styles.pickerItem}
                                >
                                    <View style={styles.pickerItemContent}>
                                        <Text
                                            style={[
                                                styles.pickerItemText,
                                                { opacity },
                                            ]}
                                        >
                                            {item}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        );
    };

    // Get valid days for selected month/year
    const daysInSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const validDays = Array.from({ length: daysInSelectedMonth }, (_, i) => (i + 1).toString());

    // Ensure selectedDay is within valid range
    const currentSelectedDay = Math.min(selectedDay, daysInSelectedMonth);
    const currentSelectedDayIndex = currentSelectedDay - 1;

    return (
        <View style={styles.container}>
            <View style={styles.cardContainer}>
                <View style={styles.pickerRow}>
                    {renderPickerColumn(
                        MONTHS,
                        selectedMonth,
                        handleMonthScroll,
                        handleMonthScrollEnd,
                        monthScrollRef as React.RefObject<import('react-native').ScrollView>,
                        'Month'
                    )}
                    {renderPickerColumn(
                        validDays,
                        currentSelectedDayIndex,
                        handleDayScroll,
                        handleDayScrollEnd,
                        dayScrollRef as React.RefObject<import('react-native').ScrollView>,
                        'Day'
                    )}
                    {renderPickerColumn(
                        years,
                        years.indexOf(selectedYear.toString()),
                        handleYearScroll,
                        handleYearScrollEnd,
                        yearScrollRef as React.RefObject<import('react-native').ScrollView>,
                        'Year'
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginTop: 20,
        marginBottom: 18,
    },
    cardContainer: {
        backgroundColor: Colors.textFieldBackground,
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 12,
    },
    pickerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    column: {
        flex: 1,
        alignItems: 'center',
    },
    columnHeader: {
        fontSize: 16,
        fontFamily: FontFamilies.ownersMedium,
        color: Colors.naturalBlack,
        marginBottom: 10,
        marginTop: 10,
    },
    pickerContainer: {
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    selectionIndicator: {
        position: 'absolute',
        top: ITEM_HEIGHT * ITEMS_ABOVE,
        left: 0,
        right: 0,
        height: ITEM_HEIGHT,
        zIndex: 2,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
    },
    selectionIndicatorBackground: {
        width: 80,
        height: 43,
        backgroundColor: Colors.brandText,
        borderRadius: 40,
        paddingHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingVertical: ITEM_HEIGHT * ITEMS_ABOVE,
    },
    pickerItem: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    pickerItemContent: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 10,
    },
    pickerItemText: {
        fontSize: 16,
        fontFamily: FontFamilies.ownersRegular,
        color: Colors.naturalBlack,
    },
    pickerItemTextSelected: {
        fontSize: 16,
        fontFamily: FontFamilies.ownersMedium,
        color: Colors.naturalBlack,
    },
});