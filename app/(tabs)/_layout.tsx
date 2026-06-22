import {
  getHome,
  getProfile,
  updateWalkthroughPreference,
} from "@/api/endpoints/users";
import { AppWalkthroughModal } from "@/components/AppWalkthroughModal";
import { TruBottomTabBar } from "@/components/tru-bottom-tab-bar";
import { onboardingService } from "@/services/onboarding";
import { useUserStore } from "@/store";
import { useWalkthroughLayoutStore } from "@/store/walkthroughLayoutStore";
import { Tabs } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";

function useSessionKey(): string | null {
  const user = useUserStore((s) => s.user);
  return useMemo(() => {
    if (!user) return null;
    const id = user.id ?? user.user_id;
    if (id != null && String(id).length > 0) return String(id);
    if (typeof user.email === "string" && user.email.length > 0) {
      return user.email.trim().toLowerCase();
    }
    return null;
  }, [user]);
}

export default function TabLayout() {
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughUpdateInFlight, setWalkthroughUpdateInFlight] =
    useState(false);
  const sessionKey = useSessionKey();

  useEffect(() => {
    let cancelled = false;

    const hydrateWalkthroughVisibility = async () => {
      if (!sessionKey) {
        setShowWalkthrough(false);
        useWalkthroughLayoutStore.getState().resetWalkthroughLayout();
        return;
      }

      try {
        const profileRes = await getProfile();
        const profile = profileRes?.data;

        const selectedChildId =
          profile?.user.role === "parent" && profile?.selected_child?.id
            ? profile.selected_child.id
            : undefined;

        const homeRes = await getHome(
          selectedChildId ? { child_id: selectedChildId } : undefined,
        );
        const serverIsWalkthrough = homeRes?.data?.is_walkthrough;

        // Convention:
        // - `is_walkthrough === true` => user has already completed/seen it => do NOT show
        // - `is_walkthrough === false` => show
        if (typeof serverIsWalkthrough === "boolean" && !cancelled) {
          const shouldShow = serverIsWalkthrough === false;
          setShowWalkthrough(shouldShow);
          if (!shouldShow)
            useWalkthroughLayoutStore.getState().resetWalkthroughLayout();
          return;
        }
      } catch {
        // fall through to local fallback
      }

      // Fallback: local AsyncStorage preference (older behavior)
      try {
        const hasSeenWalkthrough =
          await onboardingService.hasSeenAppWalkthrough();
        if (!cancelled) {
          const shouldShow = !hasSeenWalkthrough;
          setShowWalkthrough(shouldShow);
          if (!shouldShow)
            useWalkthroughLayoutStore.getState().resetWalkthroughLayout();
        }
      } catch {
        // If even local fallback fails, default to not showing.
        if (!cancelled) {
          setShowWalkthrough(false);
          useWalkthroughLayoutStore.getState().resetWalkthroughLayout();
        }
      }
    };

    hydrateWalkthroughVisibility();

    return () => {
      cancelled = true;
    };
  }, [sessionKey]);

  const handleWalkthroughComplete = async () => {
    if (walkthroughUpdateInFlight) return;
    setWalkthroughUpdateInFlight(true);
    setShowWalkthrough(false);
    useWalkthroughLayoutStore.getState().resetWalkthroughLayout();
    try {
      await updateWalkthroughPreference({ is_walkthrough: true });
    } catch {
      // Even if the server call fails, keep the local fallback in sync.
    } finally {
      try {
        await onboardingService.markAppWalkthroughComplete();
      } finally {
        setWalkthroughUpdateInFlight(false);
      }
    }
  };

  return (
    <>
      <Tabs
        tabBar={(props) => <TruBottomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="leaderboard" options={{ title: "Leaderboard" }} />
        <Tabs.Screen name="routine" options={{ title: "Routine" }} />
        <Tabs.Screen name="badges" options={{ title: "Badges" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
      <AppWalkthroughModal
        visible={showWalkthrough}
        onComplete={handleWalkthroughComplete}
      />
    </>
  );
}
