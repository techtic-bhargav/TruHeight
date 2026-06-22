import { FontFamilies } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 7;
const ITEMS_ABOVE = 3;

const HOURS = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 1;
  return {
    value: hour,
    label: hour.toString().padStart(2, "0"),
  };
});

const MINUTES = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: i.toString().padStart(2, "0"),
}));

const PERIODS = ["AM", "PM"] as const;
type Period = (typeof PERIODS)[number];

export type TruHeightSelectTimeProps = {
  value?: string;
  onChange: (value: string) => void;
};

function parseTime12h(value?: string): {
  hour: number;
  minute: number;
  period: Period;
} {
  if (!value) {
    return { hour: 9, minute: 0, period: "AM" };
  }

  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (!match) {
    return { hour: 9, minute: 0, period: "AM" };
  }

  let hour = Number(match[1]);
  let minute = Number(match[2]);
  const period = match[3].toUpperCase() as Period;

  if (Number.isNaN(hour) || hour < 1 || hour > 12) {
    hour = 9;
  }
  if (Number.isNaN(minute) || minute < 0 || minute > 59) {
    minute = 0;
  }

  return { hour, minute, period };
}

function formatTime12h(hour: number, minute: number, period: Period): string {
  const safeHour = Math.min(12, Math.max(1, Math.round(hour)));
  const safeMinute = Math.min(59, Math.max(0, Math.round(minute)));
  const minuteStr = safeMinute.toString().padStart(2, "0");
  return `${safeHour}:${minuteStr} ${period}`;
}

export function TruHeightSelectTime({
  value,
  onChange,
}: TruHeightSelectTimeProps) {
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  const periodScrollRef = useRef<ScrollView>(null);
  const isScrollingProgrammatically = useRef(false);

  const parsed = useMemo(() => parseTime12h(value), [value]);

  const [hourIndex, setHourIndex] = useState(() => {
    const idx = HOURS.findIndex((h) => h.value === parsed.hour);
    return idx >= 0 ? idx : 8; // 9 AM default
  });
  const [minuteIndex, setMinuteIndex] = useState(() =>
    Math.min(59, Math.max(0, parsed.minute)),
  );
  const [periodIndex, setPeriodIndex] = useState(() => {
    const idx = PERIODS.indexOf(parsed.period);
    return idx >= 0 ? idx : 0;
  });

  const scrollToIndex = (
    ref: React.RefObject<ScrollView | null>,
    index: number,
  ) => {
    isScrollingProgrammatically.current = true;
    ref.current?.scrollTo({
      y: index * ITEM_HEIGHT,
      animated: false,
    });
    setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, 100);
  };

  // Initial sync on mount
  useEffect(() => {
    scrollToIndex(hourScrollRef, hourIndex);
    scrollToIndex(minuteScrollRef, minuteIndex);
    scrollToIndex(periodScrollRef, periodIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync when parent value changes externally
  useEffect(() => {
    const next = parseTime12h(value);
    const foundHourIndex = HOURS.findIndex((h) => h.value === next.hour);
    const nextHourIndex = foundHourIndex >= 0 ? foundHourIndex : hourIndex;
    const nextMinuteIndex = Math.min(59, Math.max(0, next.minute));
    const nextPeriodIndex = PERIODS.indexOf(next.period);

    if (
      nextHourIndex === hourIndex &&
      nextMinuteIndex === minuteIndex &&
      nextPeriodIndex === periodIndex
    ) {
      return;
    }

    setHourIndex(nextHourIndex);
    setMinuteIndex(nextMinuteIndex);
    setPeriodIndex(nextPeriodIndex >= 0 ? nextPeriodIndex : 0);

    setTimeout(() => {
      scrollToIndex(hourScrollRef, nextHourIndex);
      scrollToIndex(minuteScrollRef, nextMinuteIndex);
      scrollToIndex(
        periodScrollRef,
        nextPeriodIndex >= 0 ? nextPeriodIndex : 0,
      );
    }, 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emitChange = (hIndex: number, mIndex: number, pIndex: number) => {
    const hour = HOURS[hIndex]?.value ?? HOURS[0].value;
    const minute = MINUTES[mIndex]?.value ?? MINUTES[0].value;
    const period = PERIODS[pIndex] ?? "AM";
    const formatted = formatTime12h(hour, minute, period);
    onChange(formatted);
  };

  const handleHourScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isScrollingProgrammatically.current) return;
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(HOURS.length - 1, index));
    if (hourIndex !== clampedIndex) setHourIndex(clampedIndex);
  };

  const handleHourScrollEnd = (
    event?: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const index =
      event != null
        ? Math.round(
            Math.max(
              0,
              Math.min(
                HOURS.length - 1,
                event.nativeEvent.contentOffset.y / ITEM_HEIGHT,
              ),
            ),
          )
        : hourIndex;
    setHourIndex(index);
    scrollToIndex(hourScrollRef, index);
    emitChange(index, minuteIndex, periodIndex);
  };

  const handleMinuteScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (isScrollingProgrammatically.current) return;
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(MINUTES.length - 1, index));
    if (minuteIndex !== clampedIndex) setMinuteIndex(clampedIndex);
  };

  const handleMinuteScrollEnd = (
    event?: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const index =
      event != null
        ? Math.round(
            Math.max(
              0,
              Math.min(
                MINUTES.length - 1,
                event.nativeEvent.contentOffset.y / ITEM_HEIGHT,
              ),
            ),
          )
        : minuteIndex;
    setMinuteIndex(index);
    scrollToIndex(minuteScrollRef, index);
    emitChange(hourIndex, index, periodIndex);
  };

  const handlePeriodScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (isScrollingProgrammatically.current) return;
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(PERIODS.length - 1, index));
    if (periodIndex !== clampedIndex) setPeriodIndex(clampedIndex);
  };

  const handlePeriodScrollEnd = (
    event?: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const index =
      event != null
        ? Math.round(
            Math.max(
              0,
              Math.min(
                PERIODS.length - 1,
                event.nativeEvent.contentOffset.y / ITEM_HEIGHT,
              ),
            ),
          )
        : periodIndex;
    setPeriodIndex(index);
    scrollToIndex(periodScrollRef, index);
    emitChange(hourIndex, minuteIndex, index);
  };

  const renderPickerColumn = (
    items: { label: string }[],
    selectedIndex: number,
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    onScrollEnd: (event?: NativeSyntheticEvent<NativeScrollEvent>) => void,
    scrollRef: React.RefObject<ScrollView | null>,
  ) => {
    return (
      <View style={styles.column}>
        <View style={styles.pickerContainer}>
          <View style={styles.selectionIndicator} pointerEvents="none">
            <View style={styles.selectionIndicatorBackground}>
              <Text
                style={[styles.pickerItemText, styles.pickerItemTextSelected]}
              >
                {items[selectedIndex]?.label}
              </Text>
            </View>
          </View>

          <ScrollView
            ref={scrollRef}
            scrollEnabled
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            onMomentumScrollEnd={(e) => onScrollEnd(e)}
            onScrollEndDrag={(e) => onScrollEnd(e)}
            scrollEventThrottle={16}
            snapToInterval={ITEM_HEIGHT}
            snapToAlignment="start"
            decelerationRate="fast"
            nestedScrollEnabled={Platform.OS === "android"}
            contentContainerStyle={styles.scrollContent}
          >
            {items.map((item, index) => {
              const isSelected = index === selectedIndex;
              const opacity = isSelected
                ? 0
                : Math.max(0.35, 1 - Math.abs(index - selectedIndex) * 0.2);

              return (
                <View key={item.label + index} style={styles.pickerItem}>
                  <Text style={[styles.pickerItemText, { opacity }]}>
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <View style={styles.pickerRow}>
          {renderPickerColumn(
            HOURS,
            hourIndex,
            handleHourScroll,
            handleHourScrollEnd,
            hourScrollRef,
          )}
          {renderPickerColumn(
            MINUTES,
            minuteIndex,
            handleMinuteScroll,
            handleMinuteScrollEnd,
            minuteScrollRef,
          )}
          {renderPickerColumn(
            PERIODS.map((p) => ({ label: p })),
            periodIndex,
            handlePeriodScroll,
            handlePeriodScrollEnd,
            periodScrollRef,
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 10,
    marginBottom: 6,
  },
  cardContainer: {
    backgroundColor: Colors.textFieldBackground,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  column: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },
  pickerContainer: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: "100%",
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
  },
  selectionIndicator: {
    position: "absolute",
    top: ITEM_HEIGHT * ITEMS_ABOVE,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    zIndex: 2,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
  selectionIndicatorBackground: {
    width: 80,
    height: 36,
    backgroundColor: Colors.brandText,
    borderRadius: 40,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingVertical: ITEM_HEIGHT * ITEMS_ABOVE,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
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
