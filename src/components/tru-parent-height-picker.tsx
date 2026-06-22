import { FontFamilies } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import React, { useRef, useState } from "react";
import {
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5; // 2 above + 1 selected + 2 below
const ITEMS_ABOVE = 2;

// Generate metric values (cm) - typically 30cm to 250cm
const getMetricValues = () => {
  return Array.from({ length: 221 }, (_, i) => (30 + i).toString());
};

// Generate feet values (0 to 8 feet)
const getFeetValues = () => {
  return Array.from({ length: 9 }, (_, i) => i.toString());
};

// Generate inches values (0 to 11 inches)
const getInchesValues = () => {
  return Array.from({ length: 12 }, (_, i) => i.toString());
};

export type ParentHeightValue = {
  metric?: number;
  imperial?: { feet: number; inches: number };
};

export type TruParentHeightPickerProps = {
  unit: "metric" | "imperial";
  dadHeight?: ParentHeightValue;
  motherHeight?: ParentHeightValue;
  onDadHeightChange: (value: ParentHeightValue) => void;
  onMotherHeightChange: (value: ParentHeightValue) => void;
};

export function TruParentHeightPicker({
  unit,
  dadHeight,
  motherHeight,
  onDadHeightChange,
  onMotherHeightChange,
}: TruParentHeightPickerProps) {
  const dadMetricScrollRef = useRef<ScrollView>(null);
  const dadFeetScrollRef = useRef<ScrollView>(null);
  const dadInchesScrollRef = useRef<ScrollView>(null);
  const motherMetricScrollRef = useRef<ScrollView>(null);
  const motherFeetScrollRef = useRef<ScrollView>(null);
  const motherInchesScrollRef = useRef<ScrollView>(null);
  const isScrollingProgrammatically = useRef(false);

  const metricValues = getMetricValues();
  const feetValues = getFeetValues();
  const inchesValues = getInchesValues();

  const [dadMetricIndex, setDadMetricIndex] = useState<number>(
    metricValues.indexOf((dadHeight?.metric ?? 164).toString()),
  );
  const [dadFeetIndex, setDadFeetIndex] = useState<number>(
    dadHeight?.imperial?.feet ?? 5,
  );
  const [dadInchesIndex, setDadInchesIndex] = useState<number>(
    dadHeight?.imperial?.inches ?? 5,
  );
  const [motherMetricIndex, setMotherMetricIndex] = useState<number>(
    metricValues.indexOf((motherHeight?.metric ?? 159).toString()),
  );
  const [motherFeetIndex, setMotherFeetIndex] = useState<number>(
    motherHeight?.imperial?.feet ?? 5,
  );
  const [motherInchesIndex, setMotherInchesIndex] = useState<number>(
    motherHeight?.imperial?.inches ?? 3,
  );

  const handleDadMetricScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (isScrollingProgrammatically.current) return;
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(metricValues.length - 1, index));
    if (dadMetricIndex !== clampedIndex) {
      setDadMetricIndex(clampedIndex);
    }
  };

  const handleDadMetricScrollEnd = () => {
    const newValue = parseInt(metricValues[dadMetricIndex] || "164");
    if (unit === "metric") {
      onDadHeightChange({ metric: newValue });
    }
  };

  const handleMotherMetricScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (isScrollingProgrammatically.current) return;
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(metricValues.length - 1, index));
    if (motherMetricIndex !== clampedIndex) {
      setMotherMetricIndex(clampedIndex);
    }
  };

  const handleMotherMetricScrollEnd = () => {
    const newValue = parseInt(metricValues[motherMetricIndex] || "159");
    if (unit === "metric") {
      onMotherHeightChange({ metric: newValue });
    }
  };

  const handleDadFeetScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (isScrollingProgrammatically.current) return;
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const newFeet = Math.max(0, Math.min(8, index));
    if (dadFeetIndex !== newFeet) {
      setDadFeetIndex(newFeet);
    }
  };

  const handleDadFeetScrollEnd = () => {
    if (unit === "imperial") {
      onDadHeightChange({
        imperial: { feet: dadFeetIndex, inches: dadInchesIndex },
      });
    }
  };

  const handleDadInchesScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (isScrollingProgrammatically.current) return;
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const newInches = Math.max(0, Math.min(11, index));
    if (dadInchesIndex !== newInches) {
      setDadInchesIndex(newInches);
    }
  };

  const handleDadInchesScrollEnd = () => {
    if (unit === "imperial") {
      onDadHeightChange({
        imperial: { feet: dadFeetIndex, inches: dadInchesIndex },
      });
    }
  };

  const handleMotherFeetScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (isScrollingProgrammatically.current) return;
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const newFeet = Math.max(0, Math.min(8, index));
    if (motherFeetIndex !== newFeet) {
      setMotherFeetIndex(newFeet);
    }
  };

  const handleMotherFeetScrollEnd = () => {
    if (unit === "imperial") {
      onMotherHeightChange({
        imperial: { feet: motherFeetIndex, inches: motherInchesIndex },
      });
    }
  };

  const handleMotherInchesScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (isScrollingProgrammatically.current) return;
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const newInches = Math.max(0, Math.min(11, index));
    if (motherInchesIndex !== newInches) {
      setMotherInchesIndex(newInches);
    }
  };

  const handleMotherInchesScrollEnd = () => {
    if (unit === "imperial") {
      onMotherHeightChange({
        imperial: { feet: motherFeetIndex, inches: motherInchesIndex },
      });
    }
  };

  const scrollToIndex = (ref: any, index: number) => {
    isScrollingProgrammatically.current = true;
    ref.current?.scrollTo({
      y: index * ITEM_HEIGHT,
      animated: false,
    });
    setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, 100);
  };

  React.useEffect(() => {
    if (unit === "metric") {
      const dadIndex = metricValues.indexOf(
        (dadHeight?.metric ?? 164).toString(),
      );
      const motherIndex = metricValues.indexOf(
        (motherHeight?.metric ?? 159).toString(),
      );
      if (dadIndex !== -1 && dadMetricIndex !== dadIndex)
        setDadMetricIndex(dadIndex);
      if (motherIndex !== -1 && motherMetricIndex !== motherIndex)
        setMotherMetricIndex(motherIndex);
      if (dadIndex !== -1 || motherIndex !== -1) {
        setTimeout(() => {
          if (dadIndex !== -1) scrollToIndex(dadMetricScrollRef, dadIndex);
          if (motherIndex !== -1)
            scrollToIndex(motherMetricScrollRef, motherIndex);
        }, 60);
      }
    } else {
      const dadFeetValue = dadHeight?.imperial?.feet ?? 5;
      const dadInchesValue = dadHeight?.imperial?.inches ?? 5;
      const motherFeetValue = motherHeight?.imperial?.feet ?? 5;
      const motherInchesValue = motherHeight?.imperial?.inches ?? 3;
      if (dadFeetIndex !== dadFeetValue) setDadFeetIndex(dadFeetValue);
      if (dadInchesIndex !== dadInchesValue) setDadInchesIndex(dadInchesValue);
      if (motherFeetIndex !== motherFeetValue)
        setMotherFeetIndex(motherFeetValue);
      if (motherInchesIndex !== motherInchesValue)
        setMotherInchesIndex(motherInchesValue);
      setTimeout(() => {
        scrollToIndex(dadFeetScrollRef, dadFeetValue);
        scrollToIndex(dadInchesScrollRef, dadInchesValue);
        scrollToIndex(motherFeetScrollRef, motherFeetValue);
        scrollToIndex(motherInchesScrollRef, motherInchesValue);
      }, 60);
    }
  }, [
    unit,
    dadHeight?.metric,
    dadHeight?.imperial?.feet,
    dadHeight?.imperial?.inches,
    motherHeight?.metric,
    motherHeight?.imperial?.feet,
    motherHeight?.imperial?.inches,
  ]);

  React.useEffect(() => {
    setTimeout(() => {
      if (unit === "metric") {
        scrollToIndex(dadMetricScrollRef, dadMetricIndex);
        scrollToIndex(motherMetricScrollRef, motherMetricIndex);
      } else {
        scrollToIndex(dadFeetScrollRef, dadFeetIndex);
        scrollToIndex(dadInchesScrollRef, dadInchesIndex);
        scrollToIndex(motherFeetScrollRef, motherFeetIndex);
        scrollToIndex(motherInchesScrollRef, motherInchesIndex);
      }
    }, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]);

  const renderPickerColumn = (
    items: string[],
    selectedIndex: number,
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    onScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    scrollRef: React.RefObject<ScrollView | null>,
    label: string,
    suffix: string,
    isMetric: boolean = false,
  ) => {
    return (
      <View style={[styles.column, isMetric && styles.metricColumn]}>
        <View style={styles.pickerContainer}>
          <View style={styles.selectionIndicator} pointerEvents="none">
            <View
              style={[
                styles.selectionIndicatorBackground,
                isMetric && styles.selectionIndicatorBackgroundMetric,
              ]}
            >
              <Text
                style={[styles.pickerItemText, styles.pickerItemTextSelected]}
              >
                {items[selectedIndex]}
                {suffix}
              </Text>
            </View>
          </View>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            onScroll={onScroll}
            onMomentumScrollEnd={onScrollEnd}
            scrollEventThrottle={16}
            contentContainerStyle={styles.scrollContent}
          >
            {items.map((item, index) => {
              const isSelected = index === selectedIndex;
              const opacity = isSelected
                ? 0
                : Math.max(0.35, 1 - Math.abs(index - selectedIndex) * 0.2);

              return (
                <View key={index} style={styles.pickerItem}>
                  <Text style={[styles.pickerItemText, { opacity }]}>
                    {item}
                    {suffix}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderParentPicker = (
    title: string,
    metricIndex: number,
    feetIndex: number,
    inchesIndex: number,
    metricRef: React.RefObject<ScrollView>,
    feetRef: React.RefObject<ScrollView>,
    inchesRef: React.RefObject<ScrollView>,
    onMetricScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    onMetricScrollEnd: () => void,
    onFeetScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    onFeetScrollEnd: () => void,
    onInchesScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    onInchesScrollEnd: () => void,
  ) => {
    return (
      <View style={styles.parentColumn}>
        <Text style={styles.parentTitle}>{title}</Text>
        {unit === "metric" ? (
          renderPickerColumn(
            metricValues,
            metricIndex,
            onMetricScroll,
            onMetricScrollEnd,
            metricRef,
            "cm",
            " cm",
            true,
          )
        ) : (
          <View style={styles.imperialRow}>
            {renderPickerColumn(
              feetValues,
              feetIndex,
              onFeetScroll,
              onFeetScrollEnd,
              feetRef,
              "ft",
              " ft",
              false,
            )}
            {renderPickerColumn(
              inchesValues,
              inchesIndex,
              onInchesScroll,
              onInchesScrollEnd,
              inchesRef,
              "in",
              " in",
              false,
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <View style={styles.pickerRow}>
          {renderParentPicker(
            "Dad",
            dadMetricIndex,
            dadFeetIndex,
            dadInchesIndex,
            dadMetricScrollRef as React.RefObject<ScrollView>,
            dadFeetScrollRef as React.RefObject<ScrollView>,
            dadInchesScrollRef as React.RefObject<ScrollView>,
            handleDadMetricScroll,
            handleDadMetricScrollEnd,
            handleDadFeetScroll,
            handleDadFeetScrollEnd,
            handleDadInchesScroll,
            handleDadInchesScrollEnd,
          )}
          <View style={styles.divider} />
          {renderParentPicker(
            "Mother",
            motherMetricIndex,
            motherFeetIndex,
            motherInchesIndex,
            motherMetricScrollRef as React.RefObject<ScrollView>,
            motherFeetScrollRef as React.RefObject<ScrollView>,
            motherInchesScrollRef as React.RefObject<ScrollView>,
            handleMotherMetricScroll,
            handleMotherMetricScrollEnd,
            handleMotherFeetScroll,
            handleMotherFeetScrollEnd,
            handleMotherInchesScroll,
            handleMotherInchesScrollEnd,
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
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
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    gap: 8,
    width: "100%",
  },
  parentColumn: {
    flex: 1,
    alignItems: "center",
  },
  parentTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: FontFamilies.ownersBold,
    color: Colors.naturalBlack,
    marginBottom: 12,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: 8,
  },
  column: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    flexBasis: 0,
    maxWidth: "48%",
  },
  metricColumn: {
    flex: 0,
    width: "100%",
    maxWidth: 250,
    alignSelf: "center",
  },
  imperialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    gap: 8,
    width: "100%",
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
    width: 55,
    height: 36,
    backgroundColor: Colors.brandText,
    borderRadius: 40,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  selectionIndicatorBackgroundMetric: {
    width: 75,
    paddingHorizontal: 10,
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
