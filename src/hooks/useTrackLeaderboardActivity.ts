import { getProfile, trackLeaderboardActivity } from "@/api/endpoints/users";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

/**
 * Call POST /api/v1/users/leaderboard-activity/track when any tab screen is focused.
 * Only runs when the current user's role is "parent".
 */
export function useTrackLeaderboardActivityOnFocus() {
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const res = await getProfile();
          if (cancelled) return;
          const role = res?.data?.user?.role;
          if (role !== "parent") return;
          await trackLeaderboardActivity();
        } catch {
          // Fire-and-forget; do not block UI or show errors
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );
}
