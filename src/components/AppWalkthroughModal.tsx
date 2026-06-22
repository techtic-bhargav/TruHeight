import { FontFamilies } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import { useWalkthroughLayoutStore } from "@/store/walkthroughLayoutStore";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type WalkthroughStep = {
  title: string;
  description: string;
};

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    title: "Welcome to TruHeight!",
    description:
      "Let’s walk through the features and help you get the most out of the app. Tap Next to continue or Skip to close.",
  },
  {
    title: "Your Measurements",
    description:
      "View your height and weight with measurement dates. Updates are available once per month for accurate tracking. Tap the pencil icon to edit when allowed. Tap the bell to view notifications.",
  },
  {
    title: "Percentile & Projected Height Range",
    description:
      "See how you measure up against others in your age group (CDC Growth Chart) and view your projected height range (MPH method). Tap the card to view the full growth chart. You can toggle cm or inches.",
  },
  {
    title: "Streaks & Recent Badges",
    description:
      "Get on a hot streak by logging activities every day and earn badges as you hit milestones. Tap View All to see all badges.",
  },
  {
    title: "Leaderboard",
    description:
      "See how you rank against other TruHeight users. Switch between child and parent views. Track your streak score.",
  },
  {
    title: "Daily Routine",
    description:
      "Build consistency with a daily checklist. Mark items complete to keep your streak. If you manage children, tasks adjust based on the selected profile.",
  },
  {
    title: "Badges",
    description:
      "See all badges you’ve unlocked. Switch between monthly and lifetime views. Tap a badge to view details, claim, or share.",
  },
  {
    title: "Manage Your Profile",
    description:
      "View your photo and name. Tap Edit Profile to update details. If you have multiple children, the main card shows the selected profile and you can switch between them.",
  },
  {
    title: "Settings & Support",
    description:
      "Manage account settings, password, subscription, and notifications. Access support options like Report an Issue, FAQs, Terms, and Privacy Policy. Delete your account or sign out at the bottom.",
  },
];

/** Bottom tab row: same order as `TruBottomTabBar` — index 0 = Home (not used for tab steps). */
const TAB_STEP_TO_TAB_INDEX: Record<number, number> = {
  4: 1, // Leaderboard
  5: 2, // Routine
  6: 3, // Badges
  7: 4, // Profile
  8: 4, // Profile (settings)
};

function tabIconCenterX(tabIndex: number, windowWidth: number): number {
  const pad = 16;
  const inner = windowWidth - 2 * pad;
  return pad + (tabIndex + 0.5) * (inner / 5);
}

const ARROW_HALF = 10;
/** Modal horizontal padding matches overlay `paddingHorizontal`. */
const OVERLAY_PAD = 16;

interface AppWalkthroughModalProps {
  visible: boolean;
  onComplete: () => void;
}

export function AppWalkthroughModal({
  visible,
  onComplete,
}: AppWalkthroughModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const homeStreakAnchor = useWalkthroughLayoutStore((s) => s.homeStreakAnchor);
  const [cardHeight, setCardHeight] = useState(0);

  const step = WALKTHROUGH_STEPS[stepIndex];
  const isLastStep = stepIndex === WALKTHROUGH_STEPS.length - 1;
  const isTabStep = stepIndex >= 4;

  const progressText = useMemo(
    () => `${stepIndex + 1}/${WALKTHROUGH_STEPS.length}`,
    [stepIndex],
  );

  const homePlacementMarginTop = useMemo(() => {
    const topLimit = insets.top + 10;
    const bottomLimit =
      windowHeight - insets.bottom - (cardHeight > 0 ? cardHeight : 260) - 20;
    const clampY = (y: number) =>
      Math.max(topLimit, Math.min(y, Math.max(topLimit, bottomLimit)));

    if (stepIndex === 3 && homeStreakAnchor) {
      const gapBelowStreak = 10;
      return clampY(homeStreakAnchor.pageY + homeStreakAnchor.height + gapBelowStreak);
    }

    switch (stepIndex) {
      case 0:
        return clampY(96);
      case 1:
        return clampY(200);
      case 2:
        return clampY(320);
      case 3:
        return clampY(420);
      default:
        return clampY(110);
    }
  }, [stepIndex, homeStreakAnchor, insets.top, insets.bottom, windowHeight, cardHeight]);

  /** Align the up-arrow with the horizontal center of the measured Streak card. */
  const homePointerStyle = useMemo(() => {
    if (stepIndex !== 3) return undefined;
    if (!homeStreakAnchor) return styles.pointerWrapCentered;
    const cx = homeStreakAnchor.pageX + homeStreakAnchor.width / 2;
    return {
      alignItems: "flex-start" as const,
      marginLeft: Math.max(0, cx - OVERLAY_PAD - ARROW_HALF),
    };
  }, [stepIndex, homeStreakAnchor]);

  useEffect(() => {
    if (!visible || stepIndex !== 3) return;
    const id = requestAnimationFrame(() => {
      useWalkthroughLayoutStore.getState().scrollHomeStreakIntoView?.();
    });
    return () => cancelAnimationFrame(id);
  }, [visible, stepIndex]);

  useEffect(() => {
    if (!visible) {
      setStepIndex(0);
    }
  }, [visible]);

  const tabArrowMarginLeft = useMemo(() => {
    const tabIndex = TAB_STEP_TO_TAB_INDEX[stepIndex];
    if (tabIndex == null) return 0;
    const cx = tabIconCenterX(tabIndex, windowWidth);
    return Math.max(0, cx - OVERLAY_PAD - ARROW_HALF);
  }, [stepIndex, windowWidth]);

  /** Space reserved above system tab bar (matches bar padding + icon + label). */
  const tabBarReserve = insets.bottom + 88;

  const handleSkip = () => {
    setStepIndex(0);
    onComplete();
  };

  const handleNext = () => {
    if (isLastStep) {
      setStepIndex(0);
      onComplete();
      return;
    }
    setStepIndex((prev) => prev + 1);
  };

  const card = (
    <View
      style={styles.card}
      onLayout={(e) => {
        const h = Math.round(e.nativeEvent.layout.height);
        if (h > 0 && h !== cardHeight) setCardHeight(h);
      }}
    >
      <View style={styles.header}>
        <Text style={styles.stepCount}>{progressText}</Text>
        <Pressable onPress={handleSkip} hitSlop={8}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>{step.title}</Text>
      <Text style={styles.description}>{step.description}</Text>

      <View style={styles.footer}>
        <Pressable onPress={handleNext} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            {isLastStep ? "Done" : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <View
      style={[
        styles.overlay,
        isTabStep ? styles.overlayAnchorBottom : styles.overlayAnchorTop,
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.backdrop} pointerEvents="auto" />
      {isTabStep ? (
        <View
          style={[styles.tabStepColumn, { paddingBottom: tabBarReserve }]}
          pointerEvents="box-none"
        >
          {card}
          <View style={[styles.pointerWrapTab, { marginLeft: tabArrowMarginLeft }]}>
            <View style={styles.pointerArrowDown} />
          </View>
        </View>
      ) : (
        <View
          style={[styles.homeStepBlock, { marginTop: homePlacementMarginTop }]}
          pointerEvents="box-none"
        >
          <View style={[styles.pointerWrap, homePointerStyle ?? styles.pointerWrapCentered]}>
            <View style={styles.pointerArrowUp} />
          </View>
          {card}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
    paddingHorizontal: OVERLAY_PAD,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  overlayAnchorTop: {
    justifyContent: "flex-start",
  },
  overlayAnchorBottom: {
    justifyContent: "flex-end",
  },
  homeStepBlock: {
    alignSelf: "stretch",
  },
  tabStepColumn: {
    alignSelf: "stretch",
  },
  pointerWrap: {
    marginBottom: -1,
  },
  pointerWrapCentered: {
    alignItems: "center",
  },
  pointerWrapTab: {
    alignItems: "flex-start",
    marginTop: -1,
  },
  pointerArrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: Colors.background,
  },
  pointerArrowDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  stepCount: {
    fontSize: 13,
    color: Colors.textFieldPlaceholder,
    fontFamily: FontFamilies.ownersRegular,
  },
  skipText: {
    fontSize: 14,
    color: Colors.textFieldPlaceholder,
    fontFamily: FontFamilies.ownersMedium,
  },
  targetText: {
    fontSize: 12,
    color: Colors.textFieldPlaceholder,
    fontFamily: FontFamilies.ownersMedium,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    color: Colors.naturalBlack,
    fontFamily: FontFamilies.butlerBold,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.naturalBlack,
    fontFamily: FontFamilies.ownersRegular,
    marginBottom: 18,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: Colors.onboardingButton,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  primaryButtonText: {
    fontSize: 14,
    color: Colors.onboardingButtonText,
    fontFamily: FontFamilies.ownersMedium,
  },
});
