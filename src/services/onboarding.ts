import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'has_seen_onboarding';
const LOGOUT_ONBOARDING_KEY = 'show_onboarding_after_logout';
const APP_WALKTHROUGH_KEY = 'has_seen_app_walkthrough_v1';

export const onboardingService = {
  hasSeenOnboarding: async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error reading onboarding status:', error);
      return false;
    }
  },

  markOnboardingComplete: async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  },

  resetOnboardingStatus: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
    } catch (error) {
      console.error('Error resetting onboarding status:', error);
    }
  },

  shouldShowOnboardingAfterLogout: async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(LOGOUT_ONBOARDING_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error reading logout onboarding status:', error);
      return false;
    }
  },

  setShowOnboardingAfterLogout: async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(LOGOUT_ONBOARDING_KEY, 'true');
    } catch (error) {
      console.error('Error setting logout onboarding flag:', error);
    }
  },

  clearLogoutOnboardingFlag: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(LOGOUT_ONBOARDING_KEY);
    } catch (error) {
      console.error('Error clearing logout onboarding flag:', error);
    }
  },

  hasSeenAppWalkthrough: async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(APP_WALKTHROUGH_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error reading app walkthrough status:', error);
      return false;
    }
  },

  markAppWalkthroughComplete: async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(APP_WALKTHROUGH_KEY, 'true');
    } catch (error) {
      console.error('Error saving app walkthrough status:', error);
    }
  },

  resetAppWalkthroughStatus: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(APP_WALKTHROUGH_KEY);
    } catch (error) {
      console.error('Error resetting app walkthrough status:', error);
    }
  },
};
