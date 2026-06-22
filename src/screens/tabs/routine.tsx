import {
  getDailyRoutines,
  getProfile,
  getStreak,
  updateDailyRoutineTask,
  type DailyRoutineItem,
  type DailyRoutineTaskCompletion,
} from "@/api/endpoints/users";
import { LoaderService } from "@/components/loader";
import { NotificationBellButton } from "@/components/NotificationBellButton";
import { ToastService } from "@/components/toast";
import { FontFamilies } from "@/constants/fonts";
import { Images } from "@/constants/images";
import { Colors } from "@/constants/theme";
import { useTrackLeaderboardActivityOnFocus } from "@/hooks/useTrackLeaderboardActivity";
import { globalStyles } from "@/styles/global";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

type DateStatus = "green" | "red" | "white" | "gray" | null;

const RoutineScreen = () => {
  const router = useRouter();
  useTrackLeaderboardActivityOnFocus();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyRoutines, setDailyRoutines] = useState<DailyRoutineItem[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [currentStreakCount, setCurrentStreakCount] = useState<number>(0);
  const dateScrollViewRef = useRef<ScrollView>(null);

  // Scroll date strip to current selected date (item width 42 + gap 12, padding 8)
  const DATE_ITEM_WIDTH = 42;
  const DATE_ITEM_GAP = 12;
  const DATE_SCROLL_PADDING = 8;

  // Helper function to format date as YYYY-MM-DD
  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Date items from API routines
  const dateItemsFromApi: {
    date: Date;
    dateKey: string;
    completed: boolean;
  }[] = dailyRoutines
    .map((r) => {
      const dateKey = r.date.slice(0, 10);
      const date = new Date(dateKey + "T12:00:00");
      return { date, dateKey, completed: r.status };
    })
    .filter((item) => !Number.isNaN(item.date.getTime()))
    .reverse();

  const formatDay = (date: Date): string => {
    return date.getDate().toString();
  };

  const formatMonth = (date: Date): string => {
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
    return months[date.getMonth()];
  };

  const isSelected = (date: Date): boolean => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getStatusDotColor = (status: DateStatus): string => {
    switch (status) {
      case "green":
        return "#4CAF50";
      case "red":
        return "#F44336";
      case "white":
        return "#FFFFFF";
      case "gray":
        return "#E0E0E0";
      default:
        return "#D0D0D0";
    }
  };

  // Load selected child id for parent role (used when PATCHing daily routine task)
  useEffect(() => {
    let cancelled = false;
    getProfile().then((res) => {
      if (cancelled) return;
      const user = res?.data?.user;
      const selectedChild = res?.data?.selected_child;
      if (user?.role === "parent" && selectedChild?.id) {
        setSelectedChildId(selectedChild.id);
      } else {
        setSelectedChildId(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Refetch routines when screen gains focus (e.g. after switch-child on Profile)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      LoaderService.show();
      (async () => {
        try {
          const res = await getProfile();
          if (cancelled) return;
          const user = res?.data?.user;
          const selectedChild = res?.data?.selected_child;
          const childId =
            user?.role === "parent" && selectedChild?.id
              ? selectedChild.id
              : null;
          setSelectedChildId(childId);
          const [routinesResponse, streakResponse] = await Promise.all([
            getDailyRoutines({
              days: 30,
              ...(childId ? { child_id: childId } : {}),
            }),
            getStreak(childId ? { child_id: childId } : undefined),
          ]);
          if (cancelled) return;
          if (
            routinesResponse?.status === "success" &&
            routinesResponse?.data?.routines
          ) {
            setDailyRoutines(routinesResponse.data.routines);
            // When screen refocuses and data is refreshed, default to today
            setSelectedDate(new Date());
          }
          if (
            streakResponse?.status === "success" &&
            streakResponse?.data != null
          ) {
            setCurrentStreakCount(
              streakResponse.data.current_streak_count ?? 0,
            );
          }
        } catch (error) {
          if (!cancelled)
            console.error("Error fetching daily routines:", error);
        } finally {
          if (!cancelled) LoaderService.hide();
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  // Scroll date strip to current selected date when dates are loaded or selection changes
  useEffect(() => {
    if (dateItemsFromApi.length === 0) return;
    const key = formatDateKey(selectedDate);
    const index = dateItemsFromApi.findIndex((item) => item.dateKey === key);
    if (index < 0) return;
    const x = DATE_SCROLL_PADDING + index * (DATE_ITEM_WIDTH + DATE_ITEM_GAP);
    const scroll = () =>
      dateScrollViewRef.current?.scrollTo({
        x: Math.max(0, x - DATE_ITEM_WIDTH),
        animated: false,
      });
    const id = setTimeout(scroll, 100);
    return () => clearTimeout(id);
  }, [dateItemsFromApi, selectedDate]);

  // Selected day's routine from API (task list and habit card — API only, no static list)
  const selectedDateKey = formatDateKey(selectedDate);
  const selectedDayRoutine = dailyRoutines.find(
    (r) => r.date.slice(0, 10) === selectedDateKey,
  );

  // Date helpers: only today is editable; past & future dates not editable
  const todayKey = formatDateKey(new Date());
  const isFutureDate = (date: Date): boolean => formatDateKey(date) > todayKey;
  const canSelectDate = (date: Date): boolean => !isFutureDate(date);
  const canEditRoutineForDate = useCallback(
    (date: Date): boolean => {
      return formatDateKey(date) === todayKey;
    },
    [todayKey],
  );

  // Local completion overrides for today/yesterday
  const [localTaskCompletions, setLocalTaskCompletions] = useState<
    Record<string, Record<string, boolean>>
  >({});

  const toggleRoutineItem = useCallback(
    async (taskId: string) => {
      if (!canEditRoutineForDate(selectedDate) || !selectedDayRoutine) return;
      const currentCompleted =
        localTaskCompletions[selectedDateKey]?.[taskId] ??
        selectedDayRoutine.task_completions?.find((t) => t.task_id === taskId)
          ?.is_completed ??
        false;
      const newCompleted = !currentCompleted;

      // Optimistic update
      setLocalTaskCompletions((prev) => ({
        ...prev,
        [selectedDateKey]: {
          ...(prev[selectedDateKey] ?? {}),
          [taskId]: newCompleted,
        },
      }));

      try {
        LoaderService.show();
        const response = await updateDailyRoutineTask(
          selectedDayRoutine.routine_id,
          {
            task_id: taskId,
            is_completed: newCompleted,
            date: selectedDateKey,
            ...(selectedChildId ? { child_id: selectedChildId } : {}),
          },
        );
        if (response?.status === "success" && response?.data) {
          const resData = response.data;
          const existingRoutine = selectedDayRoutine;
          const completionByTaskId = new Map(
            resData.task_completions.map((t) => [t.task_id, t]),
          );
          // Keep all tasks from existing routine, only update status
          const mergedTaskCompletions: DailyRoutineTaskCompletion[] = (
            existingRoutine.task_completions ?? []
          ).map((existingTc) => {
            const fromApi = completionByTaskId.get(existingTc.task_id);
            return {
              task_id: existingTc.task_id,
              title: existingTc.title,
              description: existingTc.description,
              routine_label: existingTc.routine_label,
              is_completed: fromApi?.is_completed ?? existingTc.is_completed,
              completed_at: fromApi?.completed_at ?? existingTc.completed_at,
            };
          });
          const updatedRoutine: DailyRoutineItem = {
            id: resData.id,
            user_id: resData.user_id,
            routine_id: resData.routine_id,
            date: selectedDateKey,
            task_completions: mergedTaskCompletions,
            status: resData.status,
            total_tasks:
              existingRoutine.total_tasks ?? mergedTaskCompletions.length,
            completed_tasks: mergedTaskCompletions.filter((t) => t.is_completed)
              .length,
            created_at: resData.created_at,
            updated_at: resData.updated_at,
          };
          setDailyRoutines((prev) =>
            prev.map((r) =>
              r.date.slice(0, 10) === selectedDateKey ? updatedRoutine : r,
            ),
          );
          setLocalTaskCompletions((prev) => {
            const next = { ...prev };
            if (next[selectedDateKey]) {
              const nextDate = { ...next[selectedDateKey] };
              delete nextDate[taskId];
              if (Object.keys(nextDate).length === 0) {
                delete next[selectedDateKey];
              } else {
                next[selectedDateKey] = nextDate;
              }
            }
            return next;
          });
        }
      } catch (error) {
        console.error("Error updating routine task:", error);
        ToastService.showError("Failed to update task. Please try again.");
        setLocalTaskCompletions((prev) => ({
          ...prev,
          [selectedDateKey]: {
            ...(prev[selectedDateKey] ?? {}),
            [taskId]: currentCompleted,
          },
        }));
      } finally {
        LoaderService.hide();
      }
    },
    [
      selectedDate,
      selectedDateKey,
      selectedDayRoutine,
      localTaskCompletions,
      selectedChildId,
      canEditRoutineForDate,
    ],
  );

  const routineItemsForDisplay: {
    id: string;
    title: string;
    subtitle: string;
    routineLabel: string;
    isCompleted: boolean;
  }[] = selectedDayRoutine?.task_completions?.length
    ? selectedDayRoutine.task_completions.map(
        (t: DailyRoutineTaskCompletion) => ({
          id: t.task_id,
          title: t.title,
          subtitle: t.description || "",
          routineLabel: t.routine_label || "",
          isCompleted: t.is_completed,
        }),
      )
    : [];

  const completedRoutineItemsForDisplay: Record<string, boolean> = (() => {
    const fromApi =
      selectedDayRoutine?.task_completions?.reduce(
        (acc, t) => ({ ...acc, [t.task_id]: t.is_completed }),
        {} as Record<string, boolean>,
      ) ?? {};
    const local = localTaskCompletions[selectedDateKey];
    if (canEditRoutineForDate(selectedDate) && local) {
      return { ...fromApi, ...local };
    }
    return fromApi;
  })();

  // Calculate dynamic habit completion count (from API for selected day or local state)
  const completedCount = Object.values(completedRoutineItemsForDisplay).filter(
    Boolean,
  ).length;
  const totalCount = routineItemsForDisplay.length;
  const completionPercentage = totalCount > 0 ? completedCount / totalCount : 0;
  const allTasksCompletedForSelectedDate =
    totalCount > 0 && completedCount === totalCount;

  return (
    <View style={styles.container}>
      {/* Fixed Header + Date selector + Habit card */}
      <View
        style={[
          globalStyles.headerRediusView,
          { backgroundColor: Colors.routineHeaderBackground },
        ]}
      >
        <View style={styles.header}>
          <Text style={globalStyles.deshboardTitle}>Daily Routine</Text>
          <NotificationBellButton
            style={styles.notificationButton}
            iconStyle={styles.notificationIcon}
          />
        </View>

        {/* Date Selector — rendered from API routine dates ("date": "2026-02-11") */}
        <View style={styles.dateSelectorContainer}>
          <ScrollView
            ref={dateScrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScrollContent}
          >
            {dateItemsFromApi.map((item, index) => {
              const selected = isSelected(item.date);
              const disabled = !canSelectDate(item.date);
              const status: DateStatus = isFutureDate(item.date)
                ? "gray"
                : selected
                  ? allTasksCompletedForSelectedDate
                    ? "green"
                    : "white"
                  : item.completed
                    ? "green"
                    : "red";
              return (
                <Pressable
                  key={`${item.dateKey}-${index}`}
                  onPress={() => !disabled && setSelectedDate(item.date)}
                  style={[
                    styles.dateSelector,
                    selected && styles.dateSelectorSelected,
                    disabled && styles.dateSelectorDisabled,
                  ]}
                  pointerEvents={disabled ? "none" : "auto"}
                >
                  {/* Day Number Badge */}
                  <View
                    style={[
                      styles.dayBadge,
                      selected && styles.dayBadgeSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selected && styles.dayTextSelected,
                      ]}
                    >
                      {formatDay(item.date)}
                    </Text>
                  </View>

                  {/* Month */}
                  <Text
                    style={[
                      styles.monthText,
                      selected && styles.monthTextSelected,
                    ]}
                  >
                    {formatMonth(item.date)}
                  </Text>

                  {/* Status Dot */}
                  {status && (
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: getStatusDotColor(status),
                        },
                      ]}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Habit Tracking Card */}
        <View style={styles.habitCardContainer}>
          <View style={styles.habitCard}>
            {/* Circular Progress Indicator */}
            <View style={styles.progressContainer}>
              <Svg width={80} height={80} style={styles.progressSvg}>
                {/* Background circle */}
                <Circle
                  cx={40}
                  cy={40}
                  r={34}
                  stroke="#E1DACC"
                  strokeWidth={6}
                  fill="none"
                />
                {/* Progress circle */}
                <Circle
                  cx={40}
                  cy={40}
                  r={34}
                  stroke="#C8A89A"
                  strokeWidth={6}
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - completionPercentage)}`}
                  strokeLinecap="round"
                  transform={`rotate(-90 40 40)`}
                />
              </Svg>
              <View style={styles.progressTextContainer}>
                <Text style={styles.progressText}>
                  {completedCount}/
                  <Text style={styles.progressTextNumber}>{totalCount}</Text>
                </Text>
              </View>
            </View>

            {/* Middle Text Section */}
            <View style={styles.habitTextContainer}>
              <Text style={styles.habitLabel}>Habit</Text>
              <Text style={styles.habitStatus}>Completed</Text>
            </View>

            {/* Streaks Badge */}
            <View style={styles.streaksBadge}>
              <Text style={styles.streaksNumber}>{currentStreakCount}</Text>
              <View style={styles.streaksLabelContainer}>
                <Text style={styles.streaksEmoji}>🔥</Text>
                <Text style={styles.streaksLabel}>
                  {currentStreakCount > 1 ? "Streaks" : "Streak"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Only this area scrolls */}
      <ScrollView
        style={styles.routineScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.routineScrollContent}
      >
        {/* Routine List (attached design) */}
        <View style={styles.routineListContainer}>
          {routineItemsForDisplay.map((item) => {
            const isCompleted = !!completedRoutineItemsForDisplay[item.id];
            const canEdit = canEditRoutineForDate(selectedDate);
            return (
              <Pressable
                key={item.id}
                onPress={() => canEdit && toggleRoutineItem(item.id)}
                style={[
                  styles.routineItem,
                  isCompleted && styles.routineItemCompleted,
                  !canEdit && styles.routineItemDisabled,
                ]}
                pointerEvents={canEdit ? "auto" : "none"}
              >
                <View style={styles.routineItemLeft}>
                  <View style={styles.routineTextContainer}>
                    {!!item.routineLabel && (
                      <View
                        style={[
                          styles.routineLabelBadge,
                          item.isCompleted && styles.routineLabelBadgeCompleted,
                        ]}
                      >
                        <Text
                          style={[
                            styles.routineLabelText,
                            item.isCompleted &&
                              styles.routineLabelTextCompleted,
                          ]}
                        >
                          {`${item.routineLabel} Habit`}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.routineTitle}>{item.title}</Text>
                    <Text style={styles.routineSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.routineCheckOuter,
                    isCompleted && styles.routineCheckOuterCompleted,
                  ]}
                >
                  {isCompleted && (
                    <Image
                      source={Images.selectedCheck}
                      style={styles.selectedCheck}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default RoutineScreen;

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  container1: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: Colors.homeBackground,
  },
  routineScroll: {
    flex: 1,
  },
  routineScrollContent: {
    paddingBottom: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 75,
    marginBottom: 20,
    marginHorizontal: 15,
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
  dateSelectorContainer: {
    marginTop: 5,
    marginBottom: 20,
    marginHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dateScrollContent: {
    paddingHorizontal: 8,
    gap: 12,
  },
  dateSelector: {
    width: 42,
    height: 81,
    backgroundColor: Colors.background,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 5,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  dateSelectorSelected: {
    backgroundColor: Colors.brandText,
    borderWidth: StyleSheet.hairlineWidth + 1,
    borderColor: Colors.naturalBlack,
  },
  dateSelectorDisabled: {
    opacity: 0.5,
  },
  dayBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.brandText,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeSelected: {
    backgroundColor: Colors.naturalBlack,
  },
  dayText: {
    fontSize: 14,
    fontFamily: FontFamilies.ownersBold,
    color: Colors.naturalBlack,
  },
  dayTextSelected: {
    color: Colors.background,
  },
  monthText: {
    fontSize: 12,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.naturalBlack,
    marginTop: 4,
  },
  monthTextSelected: {
    color: Colors.naturalBlack,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  habitCardContainer: {
    paddingHorizontal: 15,
    marginTop: 5,
  },
  habitCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 102,
    paddingHorizontal: 10,
  },
  progressContainer: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  progressSvg: {
    position: "absolute",
  },
  progressTextContainer: {
    position: "absolute",
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  progressText: {
    fontSize: 26,
    fontFamily: FontFamilies.butlerBold,
    color: Colors.naturalBlack,
  },
  progressTextNumber: {
    fontSize: 18,
    fontFamily: FontFamilies.butlerBold,
    color: Colors.naturalBlack,
  },
  habitTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  habitLabel: {
    fontSize: 16,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.textFieldPlaceholder,
  },
  habitStatus: {
    fontSize: 16,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.textFieldPlaceholder,
  },
  streaksBadge: {
    backgroundColor: Colors.onboardingBackground,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 78,
    width: 102,
  },
  streaksNumber: {
    fontSize: 26,
    fontFamily: FontFamilies.butlerBold,
    color: Colors.naturalBlack,
    marginBottom: 4,
  },
  streaksLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  streaksEmoji: {
    fontSize: 14,
  },
  streaksLabel: {
    fontSize: 16,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.textFieldPlaceholder,
  },

  routineListContainer: {
    paddingHorizontal: 15,
    marginTop: 14,
    gap: 10,
    paddingBottom: 16,
  },
  routineItem: {
    backgroundColor: Colors.textFieldBackground,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  routineItemCompleted: {
    backgroundColor: Colors.brandText,
  },
  routineItemDisabled: {
    opacity: 0.85,
  },
  routineItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 12,
  },

  routineIconText: {
    fontSize: 32,
  },
  routineTextContainer: {
    flex: 1,
    marginStart: 8,
  },
  routineLabelBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.brandText,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  routineLabelText: {
    fontSize: 11,
    fontFamily: FontFamilies.ownersRegular,
    color: "#FFFFFF",
    textTransform: "capitalize",
  },
  routineLabelBadgeCompleted: {
    backgroundColor: Colors.naturalBlack,
  },
  routineLabelTextCompleted: {
    color: "#FFFFFF",
  },
  routineTitle: {
    fontSize: 16,
    fontFamily: FontFamilies.ownersMedium,
    color: Colors.naturalBlack,
  },
  routineSubtitle: {
    marginTop: 2,
    fontSize: 14,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.naturalBlack,
  },
  routineCheckOuter: {
    width: 25,
    height: 25,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: Colors.divider,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  routineCheckOuterCompleted: {
    borderColor: Colors.background,
    backgroundColor: "transparent",
  },
  routineCheckMark: {
    fontSize: 16,
    fontFamily: FontFamilies.butlerBold,
    color: Colors.naturalBlack,
    lineHeight: 18,
  },

  selectedCheck: {
    width: 23,
    height: 23,
  },
});
