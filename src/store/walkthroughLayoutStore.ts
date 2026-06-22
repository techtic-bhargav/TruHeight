import { create } from "zustand";

/** Window coordinates from `measureInWindow` for the Home streak card (below Growth Chart). */
export type HomeStreakAnchor = {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
};

interface WalkthroughLayoutState {
  homeStreakAnchor: HomeStreakAnchor | null;
  setHomeStreakAnchor: (rect: HomeStreakAnchor | null) => void;
  /** ScrollView `scrollTo({ y })` offset to bring streak into view (content coordinates). */
  homeStreakScrollY: number;
  setHomeStreakScrollY: (y: number) => void;
  scrollHomeStreakIntoView: (() => void) | null;
  setScrollHomeStreakIntoView: (fn: (() => void) | null) => void;
  /** Clear anchors when logging out or switching users so the walkthrough does not use stale layout. */
  resetWalkthroughLayout: () => void;
}

export const useWalkthroughLayoutStore = create<WalkthroughLayoutState>(
  (set) => ({
    homeStreakAnchor: null,
    setHomeStreakAnchor: (rect) => set({ homeStreakAnchor: rect }),
    homeStreakScrollY: 0,
    setHomeStreakScrollY: (y) => set({ homeStreakScrollY: y }),
    scrollHomeStreakIntoView: null,
    setScrollHomeStreakIntoView: (fn) => set({ scrollHomeStreakIntoView: fn }),
    resetWalkthroughLayout: () =>
      set({
        homeStreakAnchor: null,
        homeStreakScrollY: 0,
        scrollHomeStreakIntoView: null,
      }),
  }),
);
