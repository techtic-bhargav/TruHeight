// Store configuration and state management

import { getUserNotifications } from "@/api/endpoints/users";
import { LoaderService } from "@/components/loader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import firebaseMessagingService from "../services/firebaseMessaging";
import { storageService } from "../services/storage";
import { clearAuthToken } from "../services/tokenManager";

// User store
interface UserState {
  user: any | null;
  isAuthenticated: boolean;
  setIsAuthenticated: (user: any) => void;
  setUser: (user: any) => void;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setIsAuthenticated: (isAuthenticated) =>
        set({ isAuthenticated: isAuthenticated }),
      setUser: (user) => set({ user }), // Don't automatically set isAuthenticated
      logout: async () => {
        LoaderService.hide();
        await firebaseMessagingService.deleteToken();
        await clearAuthToken();
        await storageService.removeUserData();
        // Clear session-specific data (like welcome banner)
        await storageService.removeItem("welcome_banner_shown_session");
        await storageService.clear();
        useRegistrationStore.getState().clearRegistrationData();
        useRegistrationStore.getState().setIsRegistrationPending(false);
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => storageService),
    },
  ),
);

// App settings store
interface AppSettingsState {
  theme: "light" | "dark";
  language: string;
  notifications: boolean;
  setTheme: (theme: "light" | "dark") => void;
  setLanguage: (language: string) => void;
  setNotifications: (enabled: boolean) => void;
}

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      theme: "light",
      language: "en",
      notifications: true,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setNotifications: (notifications) => set({ notifications }),
    }),
    {
      name: "app-settings-storage",
      storage: createJSONStorage(() => storageService),
    },
  ),
);

// Loading store
interface LoadingState {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));

// Notification unread count store (for header badge / dot)
interface NotificationCountState {
  unreadCount: number;
  isRefreshingUnreadCount: boolean;
  setUnreadCount: (count: number) => void;
  decrementUnreadCount: (by?: number) => void;
  incrementUnreadCount: (by?: number) => void;
  resetUnreadCount: () => void;
  fetchUnreadCount: () => Promise<number>;
}

export const useNotificationCountStore = create<NotificationCountState>(
  (set, get) => ({
    unreadCount: 0,
    isRefreshingUnreadCount: false,
    setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
    decrementUnreadCount: (by = 1) =>
      set((s) => ({ unreadCount: Math.max(0, s.unreadCount - by) })),
    incrementUnreadCount: (by = 1) =>
      set((s) => ({ unreadCount: Math.max(0, s.unreadCount + by) })),
    resetUnreadCount: () => set({ unreadCount: 0 }),
    fetchUnreadCount: async () => {
      if (get().isRefreshingUnreadCount) return get().unreadCount;
      try {
        set({ isRefreshingUnreadCount: true });
        const res = await getUserNotifications({ only_unread: true, limit: 1 });
        const countFromApi =
          res?.data?.unread_count ??
          (Array.isArray(res?.data?.notifications)
            ? res!.data!.notifications.length
            : 0);
        const nextCount = Math.max(0, Number(countFromApi) || 0);
        set({ unreadCount: nextCount });
        return nextCount;
      } catch {
        return get().unreadCount;
      } finally {
        set({ isRefreshingUnreadCount: false });
      }
    },
  }),
);

// Profile refresh trigger – increment when selected child changes so tab bar refetches
interface ProfileRefreshState {
  profileRefreshTrigger: number;
  incrementProfileRefresh: () => void;
}

export const useProfileRefreshStore = create<ProfileRefreshState>((set) => ({
  profileRefreshTrigger: 0,
  incrementProfileRefresh: () =>
    set((s) => ({ profileRefreshTrigger: s.profileRefreshTrigger + 1 })),
}));

// Registration store
interface RegistrationData {
  // Personal step
  firstName: string;
  lastName: string;
  email: string;
  agreeToTerms: boolean;
  street: string;
  password: string;
  confirmPassword: string;
  zip: string;
  state: string;
  country: string;
  countryCode: string;
  phoneNumber: string;

  // Services step
  serviceType: string;
  experience: string;
  hourlyRate: string;
  description: string;
  selectedServices: string[]; // Array of selected service IDs
  selectedTags: string[]; // Array of selected tags
  // Experience step
  experienceType: string;

  // Verification step
  documentType: string;
  documentFile: any;
  ssn?: string;
  license?: string;
  city: string;
  latitude: number;
  longitude: number;
  // Photo step
  profilePhoto: any;
  dateOfBirth: string;
}

interface RegistrationState {
  registrationData: RegistrationData;
  stepDataHistory: {
    [step: number]: Partial<RegistrationData>;
  };
  currentStep: number;
  completedStep: number;
  isRegistrationInProgress: boolean;
  setRegistrationData: (data: Partial<RegistrationData>) => void;
  setCurrentStep: (step: number) => void;
  setCompletedStep: (step: number) => void;
  updateStepData: (stepData: Partial<RegistrationData>) => void;
  saveStepData: (step: number, stepData: Partial<RegistrationData>) => void;
  saveStepDataHistory: (
    step: number,
    stepData: Partial<RegistrationData>,
  ) => void;
  clearRegistrationData: () => void;
  markRegistrationComplete: () => void;
  setIsRegistrationInProgress: (isRegistrationInProgress: boolean) => void;
  resetToStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  isRegistrationPending: boolean;
  setIsRegistrationPending: (isRegistrationPending: boolean) => void;
  getStepDataHistory: (step: number) => Partial<RegistrationData>;
}

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set) => ({
      registrationData: {
        firstName: "",
        lastName: "",
        email: "",
        agreeToTerms: false,
        serviceType: "",
        experience: "",
        hourlyRate: "",
        documentType: "",
        zip: "",
        state: "",
        country: "",
        street: "",
        countryCode: "",
        phoneNumber: "",
        documentFile: null,
        profilePhoto: null,
        password: "",
        confirmPassword: "",
        description: "",
        selectedServices: [],
        selectedTags: [],
        ssn: "",
        city: "",
        license: "",
        dateOfBirth: "",
        experienceType: "",
        latitude: 0,
        longitude: 0,
      },
      stepDataHistory: {},
      currentStep: 1,
      completedStep: 1,
      isRegistrationInProgress: false,
      setIsRegistrationInProgress: (isRegistrationInProgress) =>
        set({ isRegistrationInProgress }),
      setRegistrationData: (data) =>
        set((state) => ({
          registrationData: { ...state.registrationData, ...data },
          isRegistrationInProgress: true,
        })),

      saveStepData: (step: number, stepData: Partial<RegistrationData>) =>
        set((state) => ({
          registrationData: {
            ...state.registrationData,
            ...stepData,
          },
        })),
      saveStepDataHistory: (
        step: number,
        stepData: Partial<RegistrationData>,
      ) =>
        set((state) => ({
          stepDataHistory: {
            ...state.stepDataHistory,
            [step]: stepData,
          },
        })),
      setCurrentStep: (step) => set({ currentStep: step }),
      setCompletedStep: (step) => set({ completedStep: step }),
      setIsRegistrationPending: (isRegistrationPending) =>
        set({ isRegistrationPending }),
      updateStepData: (stepData) =>
        set((state) => {
          const updatedData = { ...state.registrationData, ...stepData };
          console.log("Updating registration data:", stepData);
          return {
            registrationData: updatedData,
            isRegistrationInProgress: true,
          };
        }),
      getStepDataHistory: (step: number) => (state: RegistrationState) =>
        state.stepDataHistory[step] || {},

      clearRegistrationData: () =>
        set({
          registrationData: {
            firstName: "",
            lastName: "",
            email: "",
            agreeToTerms: false,
            serviceType: "",
            experience: "",
            hourlyRate: "",
            documentType: "",
            zip: "",
            state: "",
            country: "",
            street: "",
            countryCode: "",
            phoneNumber: "",
            documentFile: null,
            profilePhoto: null,
            password: "",
            confirmPassword: "",
            description: "",
            selectedServices: [],
            selectedTags: [],
            ssn: "",
            city: "",
            license: "",
            dateOfBirth: "",
            experienceType: "",
            latitude: 0,
            longitude: 0,
          },
          stepDataHistory: {},
          isRegistrationInProgress: false,
          currentStep: 1,
          completedStep: 1,
        }),
      isRegistrationPending: false,
      markRegistrationComplete: () => set({ isRegistrationInProgress: false }),
      resetToStep: (step: number) => set({ currentStep: step }),
      goToNextStep: () =>
        set((state) => ({ currentStep: Math.min(state.currentStep + 1, 4) })),
      goToPreviousStep: () =>
        set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
    }),
    {
      name: "registration-storage",
      storage: createJSONStorage(() => storageService),
    },
  ),
);

export function useRegistrationLifecycle() {
  const clearRegistrationData = useRegistrationStore(
    (state) => state.clearRegistrationData,
  );

  useEffect(() => {
    const checkLaunch = async () => {
      const hasLaunched = await AsyncStorage.getItem("hasLaunched");

      if (!hasLaunched) {
        // Fresh launch → clear store
        clearRegistrationData();
      }

      // Always set this so that background → foreground won’t clear data
      await AsyncStorage.setItem("hasLaunched", "true");
    };

    checkLaunch();
  }, []);
}

// Custom hook to get step data
export const useStepData = (step: number) => {
  return useRegistrationStore((state) => state.getStepDataHistory(step));
};
