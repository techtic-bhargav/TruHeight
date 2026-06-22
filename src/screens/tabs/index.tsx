import {
  getHome,
  getMonthlyHeightChart,
  getProfile,
  getRecentEarnedBadges,
  type EarnedBadgeItem,
  type GetHomeResponse,
  type GetMonthlyHeightChartResponse,
} from "@/api/endpoints/users";
import { LoaderService } from "@/components/loader";
import { NotificationBellButton } from "@/components/NotificationBellButton";
import { ToastService } from "@/components/toast";
import { TruBadgeHomeCard } from "@/components/tru-badge-home-card";
import { TruHeightUserBadges } from "@/components/tru-height-user-badges";
import { STORAGE_KEYS } from "@/constants";
import { FontFamilies } from "@/constants/fonts";
import { Images } from "@/constants/images";
import { Colors } from "@/constants/theme";
import { useProfile } from "@/contexts/ProfileContext";
import { useTrackLeaderboardActivityOnFocus } from "@/hooks/useTrackLeaderboardActivity";
import storageServiceUtil from "@/services/storage";
import { useWalkthroughLayoutStore } from "@/store/walkthroughLayoutStore";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PADDING = 24;
const CARD_GAP = 16;
const HEADER_HORIZONTAL_PADDING = 16;
const SECTION_MARGIN_HORIZONTAL = -(CARD_PADDING - HEADER_HORIZONTAL_PADDING);

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function axisTicks(min: number, max: number, count: number): number[] {
  const span = max - min;
  if (!Number.isFinite(span) || span === 0 || count <= 1) {
    return [min];
  }
  const step = span / (count - 1);
  const ticks: number[] = [];
  for (let i = 0; i < count; i++) {
    ticks.push(min + i * step);
  }
  return ticks;
}

function formatLastMeasured(isoDate: string | null | undefined): string {
  if (!isoDate) return "Not measured yet";
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return "Not measured yet";
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `Last measured: ${months[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return "Not measured yet";
  }
}

function formatPercentileLabel(percentile: number | undefined): string {
  if (percentile == null || Number.isNaN(percentile)) return "—";
  return `${percentile} Percentile`;
}

function MetricCard({
  icon,
  title,
  value,
  lastMeasured,
  onEdit,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  lastMeasured: string;
  onEdit?: () => void;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricTitleRow}>
        {icon}
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>{value}</Text>
        {onEdit ? (
          <Pressable
            onPress={onEdit}
            hitSlop={8}
            style={styles.editButtonInline}
          >
            <Image
              source={Images.edit}
              style={styles.metricEditIcon}
              contentFit="contain"
            />
          </Pressable>
        ) : (
          <View style={styles.editButtonPlaceholder} />
        )}
      </View>
      <Text style={styles.metricSubtext}>{lastMeasured}</Text>
    </View>
  );
}

type GrowthChartUnit = "cm" | "inches";

interface GrowthChartProps {
  selectedChildId: string | null;
  isParent?: boolean;
  onPressChart?: () => void;
  onUnitChange?: (unit: GrowthChartUnit) => void;
  initialUnit?: GrowthChartUnit;
  isLocked?: boolean;
}

interface GrowthChartPoint {
  month: string;
  value: number;
}

function GrowthChart({
  selectedChildId,
  isParent,
  onPressChart,
  onUnitChange,
  initialUnit,
  isLocked,
}: GrowthChartProps) {
  const [unit, setUnit] = useState<GrowthChartUnit>(initialUnit ?? "inches");
  const [chartData, setChartData] = useState<GrowthChartPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shouldHideGlobalLoaderRef = useRef(false);

  // Keep the internal chart unit in sync with the parent restored value.
  // (Only reacts to `initialUnit` changes; does not run on local `unit` changes.)
  useEffect(() => {
    if (initialUnit == null) return;
    setUnit((prev) => (prev === initialUnit ? prev : initialUnit));
  }, [initialUnit]);

  const chartWidth = Math.max(
    280,
    SCREEN_WIDTH - CARD_PADDING * 2 - 20 * 2 - 28 - 24,
  );
  const chartHeight = 260;
  const padding = { top: 56, right: 8, bottom: 32, left: 8 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const hasData = chartData.length > 0;

  let computedMin = unit === "cm" ? 80 : 30;
  let computedMax = unit === "cm" ? 200 : 80;

  if (hasData) {
    let hMin = Infinity;
    let hMax = -Infinity;
    for (const p of chartData) {
      if (!Number.isNaN(p.value)) {
        hMin = Math.min(hMin, p.value);
        hMax = Math.max(hMax, p.value);
      }
    }
    if (hMin !== Infinity && hMax !== -Infinity) {
      const paddingValue = unit === "cm" ? 5 : 2;
      computedMin = Math.floor(hMin / paddingValue) * paddingValue;
      computedMax = Math.ceil(hMax / paddingValue) * paddingValue;
      if (computedMin === computedMax) {
        const span = unit === "cm" ? 10 : 4;
        computedMin -= span / 2;
        computedMax += span / 2;
      }
    }
  }

  const Y_TICK_COUNT = 7;
  const yTicks = axisTicks(computedMin, computedMax, Y_TICK_COUNT);

  const minValue = computedMin;
  const maxValue = computedMax;

  const resolvedChartData: GrowthChartPoint[] = hasData ? chartData : [];

  const points = resolvedChartData.map((point, index) => {
    const denominator = Math.max(1, resolvedChartData.length - 1);

    const x = padding.left + (index / denominator) * innerWidth;
    const y =
      padding.top +
      innerHeight -
      ((point.value - minValue) / (maxValue - minValue)) * innerHeight;
    return { x, y, ...point };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const highlightedIndex = points.length > 0 ? points.length - 1 : -1;
  const highlightedPoint =
    highlightedIndex >= 0 ? points[highlightedIndex] : null;

  const formatTooltipValue = (value: number, currentUnit: GrowthChartUnit) => {
    if (currentUnit === "cm") {
      return `${Math.round(value)} cm`;
    }
    return `${value.toFixed(1)} in`;
  };

  const fetchGrowthChart = useCallback(
    async (currentUnit: GrowthChartUnit, childId: string | null) => {
      setLoading(true);
      setError(null);
      try {
        const effectiveChildId = childId ?? null;
        // Parent: require child_id — only call when we have effectiveChildId.
        // Non-parent (role !== parent): call without child_id.
        if (!effectiveChildId && isParent !== false) {
          setChartData([]);
          setLoading(false);
          return;
        }
        const params: Parameters<typeof getMonthlyHeightChart>[0] = {
          unit: currentUnit,
        };
        if (effectiveChildId) {
          params.child_id = effectiveChildId;
        }
        const res: GetMonthlyHeightChartResponse | undefined =
          await getMonthlyHeightChart(params);
        if (res?.status === "success" && res.data?.updates?.length) {
          const mapped: GrowthChartPoint[] = res.data.updates
            .map((update) => {
              const date = new Date(update.recorded_at);
              const monthIndex = Number.isNaN(date.getTime())
                ? -1
                : date.getMonth();
              const monthLabel =
                monthIndex >= 0 && monthIndex < MONTH_LABELS.length
                  ? MONTH_LABELS[monthIndex]
                  : "";
              const height = update.height;
              let value: number | null = null;

              if (currentUnit === "cm") {
                if (height?.cm != null) {
                  value = height.cm;
                } else if (height?.inches != null) {
                  value = height.inches * 2.54;
                } else if (height?.ft != null) {
                  value = height.ft * 30.48;
                }
              } else {
                // currentUnit === "inches"
                if (height?.inches != null) {
                  value = height.inches;
                } else if (height?.ft != null) {
                  value = height.ft * 12;
                } else if (height?.cm != null) {
                  value = height.cm / 2.54;
                }
              }
              if (value == null) return null;
              return { month: monthLabel, value };
            })
            .filter(
              (point): point is GrowthChartPoint =>
                point !== null && !Number.isNaN(point.value),
            );
          setChartData(mapped);
        } else {
          setChartData([]);
        }
      } catch {
        setError("Unable to load growth data");
        setChartData([]);
      } finally {
        setLoading(false);
        if (shouldHideGlobalLoaderRef.current) {
          shouldHideGlobalLoaderRef.current = false;
          LoaderService.hide();
        }
      }
    },
    [isParent],
  );

  useEffect(() => {
    fetchGrowthChart(unit, selectedChildId);
  }, [fetchGrowthChart, selectedChildId, unit]);

  const handleUnitChange = (nextUnit: GrowthChartUnit) => {
    if (nextUnit === unit) return;
    shouldHideGlobalLoaderRef.current = true;
    LoaderService.show();
    setUnit(nextUnit);
    onUnitChange?.(nextUnit);
  };

  return (
    <View style={styles.chartCard}>
      {isLocked && (
        <View style={styles.lockOverlayFull} pointerEvents="none">
          <Image
            source={Images.lock_2}
            style={styles.lockOverlayImage}
            contentFit="contain"
          />
        </View>
      )}
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Growth Chart</Text>
        <View style={styles.unitSelector}>
          {(["cm", "inches"] as GrowthChartUnit[]).map((option) => (
            <Pressable
              key={option}
              onPress={() => handleUnitChange(option)}
              hitSlop={16}
              style={[
                styles.unitOption,
                unit === option && styles.unitOptionActive,
              ]}
            >
              <Text
                style={[
                  styles.unitText,
                  unit === option && styles.unitTextActive,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.chartWrapper}>
        <View style={styles.chartContent}>
          <View style={styles.yAxis}>
            {[...yTicks].reverse().map((val) => (
              <Text key={val} style={styles.yAxisLabel}>
                {unit === "inches" ? val.toFixed(1) : Math.round(val)}
              </Text>
            ))}
          </View>
          <Pressable
            style={styles.chartArea}
            onPress={isLocked ? undefined : onPressChart}
            hitSlop={4}
          >
            {hasData && (
              <>
                <Svg width={chartWidth} height={chartHeight}>
                  {/* Grid lines aligned with each Y-axis label */}
                  {yTicks.map((tickValue, index) => {
                    const ratio =
                      yTicks.length === 1 ? 0 : index / (yTicks.length - 1);
                    const y = padding.top + innerHeight * ratio;
                    return (
                      <Line
                        key={tickValue}
                        x1={padding.left}
                        y1={y}
                        x2={padding.left + innerWidth}
                        y2={y}
                        stroke={Colors.textFieldBorder}
                        strokeWidth={0.5}
                        strokeDasharray="2,2"
                      />
                    );
                  })}
                  {/* Growth line */}
                  <Path
                    d={pathD}
                    fill="none"
                    stroke={Colors.homeChartLine}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Single dot at highlighted point only - show only when data loaded (not during unit switch) */}
                  {highlightedPoint && !loading && (
                    <Circle
                      cx={highlightedPoint.x}
                      cy={highlightedPoint.y}
                      r={6}
                      fill={Colors.background}
                      stroke={Colors.homeChartLine}
                      strokeWidth={3}
                    />
                  )}
                  {/* Dotted vertical line - only when growth line is plotted (not during cm/ft switch) */}
                  {highlightedPoint && !loading && (
                    <Line
                      x1={highlightedPoint.x}
                      y1={padding.top}
                      x2={highlightedPoint.x}
                      y2={chartHeight - padding.bottom}
                      stroke={Colors.textFieldPlaceholder}
                      strokeWidth={1}
                      strokeDasharray="3,3"
                    />
                  )}
                </Svg>
                {/* Tooltip - only when data loaded */}
                {highlightedPoint && !loading && (
                  <View
                    style={[
                      styles.tooltip,
                      {
                        left: highlightedPoint.x - 32,
                        top: highlightedPoint.y - 48,
                        backgroundColor: Colors.homeTooltipBg,
                      },
                    ]}
                  >
                    <Text style={styles.tooltipText}>
                      {formatTooltipValue(highlightedPoint.value, unit)}
                    </Text>
                  </View>
                )}
              </>
            )}
            {loading && !hasData && (
              <View style={styles.chartLoadingOverlay}>
                <ActivityIndicator size="small" color={Colors.homeChartLine} />
              </View>
            )}
            {!loading && !hasData && (
              <View style={styles.chartEmptyState}>
                <Text style={styles.chartEmptyText}>
                  {error ?? "No growth data yet"}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
        <View style={styles.xAxis}>
          {resolvedChartData.map((point, index) => (
            <Text key={`${point.month}-${index}`} style={styles.xAxisLabel}>
              {point.month}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const HomeScreen = () => {
  const router = useRouter();
  useTrackLeaderboardActivityOnFocus();
  const { getAllProfileData } = useProfile();
  const scrollViewRef = useRef<ScrollView>(null);
  const streakWalkthroughRef = useRef<View>(null);
  const [homeData, setHomeData] = useState<GetHomeResponse["data"] | null>(
    null,
  );
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isParentUser, setIsParentUser] = useState<boolean | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(true);
  const [recentBadges, setRecentBadges] = useState<EarnedBadgeItem[]>([]);
  const [growthChartUnit, setGrowthChartUnit] =
    useState<GrowthChartUnit>("inches");

  // Persist cm/inches selection locally.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const savedUnit = await storageServiceUtil.getItem<GrowthChartUnit>(
        STORAGE_KEYS.GROWTH_CHART_UNIT,
      );
      if (cancelled) return;
      if (savedUnit === "cm" || savedUnit === "inches") {
        setGrowthChartUnit(savedUnit);
        return;
      }

      // No saved preference yet (likely a fresh install or just-finished onboarding).
      // Infer preferred unit from onboarding profile steps so Home matches what the
      // user just entered (cm/kg vs ft/in + lb).
      try {
        const profileData = getAllProfileData();
        const step4Unit = profileData.step4?.measurementSystem;
        const step5Unit = profileData.step5?.measurementSystem;
        const step6Unit = profileData.step6?.measurementSystem;
        const preferred = step4Unit ?? step5Unit ?? step6Unit;

        if (preferred === "metric") {
          setGrowthChartUnit("cm");
        } else if (preferred === "imperial") {
          setGrowthChartUnit("inches");
        }
      } catch {
        // If context is not available for any reason, fall back to default.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getAllProfileData]);

  useEffect(() => {
    storageServiceUtil.setItem(STORAGE_KEYS.GROWTH_CHART_UNIT, growthChartUnit);
  }, [growthChartUnit]);

  const fetchHome = useCallback(
    async (childIdOverride?: string | null) => {
      try {
        const effectiveChildId = childIdOverride ?? selectedChildId ?? null;
        const res = await getHome(
          effectiveChildId ? { child_id: effectiveChildId } : undefined,
        );
        if (res?.status === "success" && res?.data) {
          setHomeData(res.data);
        } else {
          setHomeData(null);
        }
      } catch {
        setHomeData(null);
      }
    },
    [selectedChildId],
  );

  const fetchRecentBadges = useCallback(
    async (childIdOverride?: string | null) => {
      try {
        const effectiveChildId = childIdOverride ?? selectedChildId ?? null;
        const params: { child_id?: string } = {};
        if (effectiveChildId) {
          params.child_id = effectiveChildId;
        }
        const res = await getRecentEarnedBadges(params);
        if (res?.status === "success" && Array.isArray(res.data)) {
          setRecentBadges(res.data.filter((badge) => badge.is_earned));
        } else {
          setRecentBadges([]);
        }
      } catch {
        setRecentBadges([]);
      }
    },
    [selectedChildId],
  );

  // Ensure we always load the latest selected child before any Home screen APIs
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        LoaderService.show();
        try {
          const res = await getProfile();
          if (cancelled) return;
          const user = res?.data?.user;
          const selectedChild = res?.data?.selected_child;
          const childId =
            user?.role === "parent" && selectedChild?.id
              ? selectedChild.id
              : null;
          setIsParentUser(user?.role === "parent");
          setSelectedChildId(childId);
          await Promise.all([fetchHome(childId), fetchRecentBadges(childId)]);
        } catch {
          if (cancelled) return;
          setSelectedChildId(null);
          await Promise.all([fetchHome(null), fetchRecentBadges(null)]);
        } finally {
          if (!cancelled) {
            setLoading(false);
            LoaderService.hide();
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [fetchHome, fetchRecentBadges]),
  );

  const height = homeData?.current_height;
  const weight = homeData?.current_weight;
  const percentile = homeData?.percentile;
  const predicted = homeData?.predicted_height;
  const streak = homeData?.streak;
  const isUpdateHeightEnable = homeData?.is_update_height_enable === true;
  const heightUpdateMessage = homeData?.height_update_message ?? "";
  const isUpdateWeightEnable = homeData?.is_update_weight_enable === true;
  const weightUpdateMessage = homeData?.weight_update_message ?? "";

  const heightValue = (() => {
    const formatImperialFromFields = (ft?: number, inches?: number) => {
      if (ft == null || inches == null) return null;
      const totalIn = ft * 12 + inches;
      let outFeet = Math.floor(totalIn / 12);
      let outInches = Math.round(totalIn - outFeet * 12);
      if (outInches === 12) {
        outFeet += 1;
        outInches = 0;
      }
      return `${outFeet} ft ${outInches} in`;
    };

    const formatImperialFromCm = (cm?: number | null) => {
      if (cm == null) return null;
      const totalIn = cm / 2.54;
      let outFeet = Math.floor(totalIn / 12);
      let outInches = Math.round(totalIn - outFeet * 12);
      if (outInches === 12) {
        outFeet += 1;
        outInches = 0;
      }
      return `${outFeet} ft ${outInches} in`;
    };

    if (growthChartUnit === "inches") {
      return (
        formatImperialFromFields(height?.ft, height?.inches) ??
        formatImperialFromCm(height?.cm) ??
        "—"
      );
    }

    if (height?.cm != null) return `${Math.round(height.cm)} cm`;
    if (height?.ft != null && height?.inches != null) {
      const cmFromFields = (height.ft * 12 + height.inches) * 2.54;
      return `${Math.round(cmFromFields)} cm`;
    }
    return "—";
  })();
  const weightValue = (() => {
    if (growthChartUnit === "inches") {
      return weight?.lb != null ? `${weight.lb.toFixed(1)} lb` : "—";
    }
    return weight?.kg != null ? `${weight.kg} kg` : "—";
  })();
  const projectedValue = (() => {
    const formatImperial = (ft?: number, inches?: number) => {
      if (ft == null || inches == null) return null;
      const totalIn = ft * 12 + inches;
      let outFeet = Math.floor(totalIn / 12);
      let outInches = Math.round(totalIn - outFeet * 12);
      if (outInches === 12) {
        outFeet += 1;
        outInches = 0;
      }
      return `${outFeet} ft ${outInches} in`;
    };

    if (growthChartUnit === "inches") {
      return (
        formatImperial(predicted?.ft, predicted?.inches) ??
        (predicted?.cm != null
          ? (() => {
              const totalIn = predicted.cm / 2.54;
              let outFeet = Math.floor(totalIn / 12);
              let outInches = Math.round(totalIn - outFeet * 12);
              if (outInches === 12) {
                outFeet += 1;
                outInches = 0;
              }
              return `${outFeet} ft ${outInches} in`;
            })()
          : "—")
      );
    }

    if (predicted?.cm != null) return `${Math.round(predicted.cm)} cm`;
    if (predicted?.ft != null && predicted?.inches != null) {
      const cmFromFields = (predicted.ft * 12 + predicted.inches) * 2.54;
      return `${Math.round(cmFromFields)} cm`;
    }
    return "—";
  })();
  const percentileLabel =
    percentile?.percentile != null
      ? formatPercentileLabel(percentile.percentile)
      : "—";
  const percentileSubtitle =
    percentile?.classification ?? "Compared with your child's age";

  const streakCurrentCount = streak?.current_streak_count;
  const streakCompletion = streak?.completion_percentage;
  const streakMessageRaw =
    streak?.message ??
    "Start your streak today! Complete at least one task to begin.";

  // If the message contains an exclamation mark, break into two lines:
  // first sentence up to and including the "!", remainder on the next line.
  const exclamationIndex = streakMessageRaw.indexOf("!");
  const streakMessageLine1 =
    exclamationIndex >= 0
      ? streakMessageRaw.slice(0, exclamationIndex + 1).trim()
      : streakMessageRaw;
  const streakMessageLine2 =
    exclamationIndex >= 0
      ? streakMessageRaw.slice(exclamationIndex + 1).trim()
      : "";
  const isTruHeightSubscriber = homeData?.is_truheight_subscriber === true;
  const isSubscribed = homeData?.is_subscribed ?? false;
  const isTrialActive = homeData?.is_trial_active === true;
  const headerBadgeIcon = isTruHeightSubscriber
    ? Images.subscriber
    : isSubscribed
      ? Images.premiumUser
      : Images.freeUser;

  const headerBadgeTitle = isTruHeightSubscriber
    ? "TruHeight\u00ae Subscriber"
    : isSubscribed
      ? "Premium User"
      : "Free User";

  const headerBadgeBottomTitle =
    isTruHeightSubscriber || isSubscribed
      ? "All features unlocked"
      : isTrialActive
        ? "7 days free trial activated"
        : "Upgrade to premium";
  const isHeaderFreeUser = !isTruHeightSubscriber && !isSubscribed;
  const shouldLockContent =
    !isSubscribed && !isTruHeightSubscriber && !isTrialActive;
  // Projected Height Range should remain locked for all non-subscribed users,
  // including those on a 7-day free trial.
  const shouldLockProjectedHeightRange =
    !isSubscribed && !isTruHeightSubscriber;

  // Debug: verify Home backend flags drive badge/lock correctly.
  useEffect(() => {
    if (!homeData) return;
    console.log("[Home Subscription Flags]", {
      is_truheight_subscriber: homeData.is_truheight_subscriber ?? false,
      is_subscribed: homeData.is_subscribed ?? false,
      is_trial_active: homeData.is_trial_active ?? false,
    });
  }, [homeData]);

  const updateStreakWalkthroughAnchor = useCallback(() => {
    streakWalkthroughRef.current?.measureInWindow(
      (pageX, pageY, width, height) => {
        useWalkthroughLayoutStore.getState().setHomeStreakAnchor({
          pageX,
          pageY,
          width,
          height,
        });
      },
    );
  }, []);

  useEffect(() => {
    const scrollStreakIntoView = () => {
      const y = useWalkthroughLayoutStore.getState().homeStreakScrollY;
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, y - 56),
        animated: true,
      });
      setTimeout(() => {
        updateStreakWalkthroughAnchor();
      }, 450);
    };
    useWalkthroughLayoutStore
      .getState()
      .setScrollHomeStreakIntoView(scrollStreakIntoView);
    return () => {
      useWalkthroughLayoutStore.getState().setScrollHomeStreakIntoView(null);
    };
  }, [updateStreakWalkthroughAnchor]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.headerRediusView, styles.headerBackgroundSection]}>
          <View style={styles.header}>
            <View style={styles.headerBrandGroup}>
              <Image
                source={Images.appLogo}
                style={styles.appLogo}
                contentFit="contain"
              />
              <Pressable
                hitSlop={6}
                onPress={
                  isHeaderFreeUser
                    ? () =>
                        router.push({
                          pathname: "/managesubscription",
                          params: { skipInitLoader: "1" },
                        })
                    : undefined
                }
              >
                <TruHeightUserBadges
                  image={headerBadgeIcon}
                  title={headerBadgeTitle}
                  bottomTitle={headerBadgeBottomTitle}
                />
              </Pressable>
            </View>
            <NotificationBellButton
              style={styles.notificationButton}
              iconStyle={styles.notificationIcon}
            />
          </View>

          {/* Metric Cards */}
          <View style={styles.metricsRow}>
            <MetricCard
              icon={
                <Image
                  source={Images.currentHeight}
                  style={styles.metricCardIcon}
                  contentFit="contain"
                />
              }
              title="Current Height"
              value={loading ? "..." : heightValue}
              lastMeasured={formatLastMeasured(
                height?.last_measured_date ?? null,
              )}
              onEdit={() => {
                if (isUpdateHeightEnable) {
                  router.push({
                    pathname: "/profilestep4",
                    params: { mode: "edit" },
                  });
                } else {
                  ToastService.showError(heightUpdateMessage);
                }
              }}
            />
            <MetricCard
              icon={
                <Image
                  source={Images.currentWeight}
                  style={styles.metricCardIcon}
                  contentFit="contain"
                />
              }
              title="Current Weight"
              value={loading ? "..." : weightValue}
              lastMeasured={formatLastMeasured(
                weight?.last_measured_date ?? null,
              )}
              onEdit={() => {
                if (isUpdateWeightEnable) {
                  router.push({
                    pathname: "/profilestep5",
                    params: { mode: "edit" },
                  });
                } else {
                  ToastService.showError(weightUpdateMessage);
                }
              }}
            />
          </View>

          {/* Percentile Card */}
          <Pressable
            style={
              shouldLockProjectedHeightRange
                ? styles.projectedCardLocked
                : styles.projectedCard
            }
            onPress={
              shouldLockProjectedHeightRange
                ? undefined
                : () => router.push("/growthchart")
            }
          >
            {/* Outer card has no padding so lock overlay matches exact edges.
                Inner wrapper keeps the original spacing. */}
            <View style={styles.projectedInner}>
              {/* Keep layout stable (no section removed). Hide text when locked. */}
              <View style={{ opacity: shouldLockProjectedHeightRange ? 0 : 1 }}>
                <View style={styles.projectedHeader}>
                  <View style={styles.projectedTitleRow}>
                    <Image
                      source={Images.growth}
                      style={styles.percentileIcon}
                      contentFit="contain"
                    />
                    <View>
                      <Text style={styles.projectedTitle}>
                        {loading ? "..." : percentileLabel}
                      </Text>
                      <Text style={styles.projectedSubtitle}>
                        {percentileSubtitle}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={Colors.titleBlack}
                  />
                </View>
                <View style={styles.projectedDivider} />
                <View style={styles.projectedBody}>
                  <Text style={styles.projectedLabel}>
                    Projected Height Range
                  </Text>
                  <Text style={styles.projectedValue}>
                    {loading ? "..." : projectedValue}
                  </Text>
                </View>
                <Text style={styles.projectedDisclaimer}>
                  *Uses standard pediatric mid-parental method; results are
                  approximate.
                </Text>
              </View>
            </View>

            {shouldLockProjectedHeightRange && (
              <View style={styles.lockOverlayProjected} pointerEvents="none">
                <Image
                  source={Images.lock_1}
                  style={styles.lockOverlayImageLock1}
                  contentFit="contain"
                />
              </View>
            )}
          </Pressable>
        </View>

        {/* Growth Chart */}
        <GrowthChart
          selectedChildId={selectedChildId}
          isParent={isParentUser}
          initialUnit={growthChartUnit}
          onUnitChange={setGrowthChartUnit}
          isLocked={shouldLockContent}
        />

        {/* Streak Card — anchor for walkthrough (directly below Growth Chart) */}
        <View
          ref={streakWalkthroughRef}
          collapsable={false}
          onLayout={(e) => {
            useWalkthroughLayoutStore
              .getState()
              .setHomeStreakScrollY(e.nativeEvent.layout.y);
            updateStreakWalkthroughAnchor();
          }}
        >
          <View style={styles.streakCard}>
            {shouldLockContent && (
              <View style={styles.lockOverlayFull} pointerEvents="none">
                <Image
                  source={Images.lock_3}
                  style={styles.lockOverlayImage}
                  contentFit="contain"
                />
              </View>
            )}
            <View style={styles.streakTopRow}>
              <Image
                source={Images.streak}
                style={styles.streakIcon}
                contentFit="contain"
              />
              <View style={styles.streakContent}>
                <Text style={styles.streakTitle}>
                  {streakCurrentCount != null
                    ? `${streakCurrentCount} day Streak!`
                    : "Streak"}
                </Text>
                <Text style={styles.streakSubtitle}>
                  {streakCompletion != null
                    ? `${streakCompletion}% weekly consistency`
                    : "Start building your streak"}
                </Text>
              </View>
            </View>
            <View style={styles.streakMessageBox}>
              <Text style={styles.streakMessage}>
                {streakMessageLine1}
                {streakMessageLine2 ? `\n${streakMessageLine2}` : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Badges */}
        <View style={styles.badgesSection}>
          <View style={styles.badgesHeader}>
            <Text style={styles.badgesTitle}>Recent Badges</Text>
            <Pressable onPress={() => router.push("/(tabs)/badges")}>
              <Text style={styles.viewAllText}>View All</Text>
            </Pressable>
          </View>
          {recentBadges.length === 0 ? (
            <Text style={styles.badgesEmptyText}>
              You have not earned any badge recently.
            </Text>
          ) : (
            <View style={styles.badgesRow}>
              {recentBadges.slice(0, 2).map((badge) => {
                const isParentBadge = badge.audience === "parent";
                const label = isParentBadge ? "Parent" : "";
                const labelColor = Colors.badgeLabelParent;

                return (
                  <View key={badge.badge_code} style={styles.badgeItemWrapper}>
                    <TruBadgeHomeCard
                      title={badge.name}
                      description={badge.description}
                      label={label}
                      labelColor={labelColor}
                      icon={badge.icon ?? ""}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.homeBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: CARD_PADDING,
    paddingTop: 0,
    paddingBottom: 20,
  },
  headerRediusView: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 8,
    marginTop: Platform.OS === "ios" ? -56 : -42,
    paddingTop: Platform.OS === "ios" ? 56 : 42,
  },
  headerBackgroundSection: {
    backgroundColor: Colors.homeHeaderBackground,
    paddingHorizontal: 16,
    marginBottom: 20,
    marginHorizontal: -CARD_PADDING,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 75,
    marginBottom: 20,
    marginHorizontal: 0,
  },
  appLogo: {
    height: 40,
    width: 140,
  },
  headerBrandGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  headerUserBadgeSubscriber: {
    height: 44,
    width: 150,
  },
  headerUserBadgeCompact: {
    height: 30,
    width: 140,
  },
  notificationButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadge: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationIcon: {
    width: 48,
    height: 48,
    marginRight: 15,
  },
  metricsRow: {
    flexDirection: "row",
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.textFieldBackground,
    borderRadius: 14,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  metricTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  metricCardIcon: {
    width: 20,
    height: 20,
  },
  metricTitle: {
    fontSize: 14,
    fontFamily: FontFamilies.ownersMedium,
    color: Colors.naturalBlack,
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 26,
    fontFamily: FontFamilies.butlerBold,
    color: Colors.naturalBlack,
  },
  editButtonInline: {
    padding: 2,
  },
  editButtonPlaceholder: {
    width: 18,
    height: 18,
  },
  metricEditIcon: {
    width: 16,
    height: 16,
  },
  metricSubtext: {
    fontSize: 12,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.naturalBlack,
    marginTop: 4,
  },
  projectedCard: {
    backgroundColor: Colors.textFieldBackground,
    borderRadius: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: "relative",
    overflow: "hidden",
    marginBottom: CARD_GAP,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  projectedCardLocked: {
    backgroundColor: Colors.textFieldBackground,
    borderRadius: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 0,
    position: "relative",
    overflow: "hidden",
    marginBottom: CARD_GAP,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  projectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  projectedTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  percentileIcon: {
    width: 40,
    height: 40,
  },
  projectedDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 8,
  },
  projectedTitle: {
    fontSize: 20,
    fontFamily: FontFamilies.butlerBold,
    color: Colors.naturalBlack,
  },
  projectedSubtitle: {
    fontSize: 14,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.textFieldPlaceholder,
    marginTop: 4,
  },
  projectedBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  projectedLabel: {
    fontSize: 16,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.naturalBlack,
    marginTop: 6,
  },
  projectedValue: {
    fontSize: 26,
    fontFamily: FontFamilies.butlerBold,
    color: Colors.naturalBlack,
    marginTop: 6,
  },
  projectedDisclaimer: {
    fontSize: 10,
    fontFamily: FontFamilies.ownersRegularItalic,
    color: Colors.naturalBlack,
    fontStyle: "italic",
  },
  projectedInner: {
    padding: 20,
  },
  chartCard: {
    backgroundColor: Colors.textFieldBackground,
    borderRadius: 14,
    padding: 20,
    position: "relative",
    overflow: "hidden",
    marginHorizontal: SECTION_MARGIN_HORIZONTAL,
    marginBottom: CARD_GAP,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 20,
    fontFamily: FontFamilies.butlerBold,
    color: Colors.naturalBlack,
  },
  unitSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 1,
    borderRadius: 20,
    backgroundColor: "rgba(71, 67, 66, 0.08)",
  },
  unitText: {
    fontSize: 14,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.textFieldPlaceholder,
  },
  unitTextActive: {
    color: Colors.naturalBlack,
    fontFamily: FontFamilies.ownersMedium,
  },
  unitOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  unitOptionActive: {
    backgroundColor: Colors.brandText,
  },
  chartWrapper: {
    padding: 2,
    overflow: "hidden",
  },
  chartContent: {
    flexDirection: "row",
  },
  yAxis: {
    width: 30,
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 24,
  },
  yAxisLabel: {
    fontSize: 10,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.textFieldPlaceholder,
  },
  chartArea: {
    flex: 1,
    position: "relative",
  },
  chartLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  chartEmptyState: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  chartEmptyText: {
    fontSize: 12,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.textFieldPlaceholder,
  },
  tooltip: {
    position: "absolute",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 40,
    alignItems: "center",
  },
  tooltipText: {
    fontSize: 12,
    fontFamily: FontFamilies.ownersMedium,
    color: Colors.background,
  },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -8,
    marginLeft: 36,
    marginRight: 8,
  },
  xAxisLabel: {
    fontSize: 10,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.textFieldPlaceholder,
  },
  streakCard: {
    flexDirection: "column",
    backgroundColor: Colors.textFieldBackground,
    borderRadius: 14,
    padding: 20,
    position: "relative",
    overflow: "hidden",
    marginHorizontal: SECTION_MARGIN_HORIZONTAL,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  streakTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  streakIcon: {
    width: 42,
    height: 42,
    marginRight: 12,
  },
  streakContent: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 20,
    fontFamily: FontFamilies.butlerBold,
    color: Colors.naturalBlack,
    marginBottom: 4,
  },
  streakSubtitle: {
    fontSize: 14,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.textFieldPlaceholder,
  },
  streakMessageBox: {
    flexDirection: "row",
    alignSelf: "stretch",
    minHeight: 32,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  streakMessage: {
    fontSize: 14,
    fontFamily: FontFamilies.ownersRegular,
    textAlign: "left",
    color: Colors.naturalBlack,
  },
  lockOverlayFull: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    overflow: "hidden",
    zIndex: 10,
    backgroundColor: Colors.textFieldBackground,
  },
  lockOverlayProjected: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    zIndex: 10,
    backgroundColor: Colors.textFieldBackground,
  },
  lockOverlayImage: {
    width: "100%",
    height: "100%",
  },
  // lock_1.png contains extra whitespace/border; scaling removes the inset.
  lockOverlayImageLock1: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  lock1ProjectedImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  streakMessageGreen: {
    color: Colors.streakGreen,
    fontFamily: FontFamilies.ownersRegular,
  },
  streakMessageDark: {
    color: Colors.naturalBlack,
    fontFamily: FontFamilies.ownersRegular,
  },
  badgesSection: {
    marginHorizontal: SECTION_MARGIN_HORIZONTAL,
    marginBottom: 24,
  },
  badgesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  badgesTitle: {
    fontSize: 20,
    fontFamily: FontFamilies.butlerBold,
    color: Colors.naturalBlack,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.textFieldPlaceholder,
  },
  badgesEmptyText: {
    fontSize: 14,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.textFieldPlaceholder,
  },
  badgesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -4,
  },
  badgeItemWrapper: {
    width: "50%",
    maxWidth: "50%",
    minWidth: 0,
    paddingHorizontal: 4,
  },
});
