// Storage service for handling local storage operations

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

class StorageService {
  /**
   * Store data in AsyncStorage
   */
  async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error saving data:', error);
      // Don't throw error in production to prevent crashes
      if (__DEV__) {
        throw error;
      }
    }
  }

  /**
   * Retrieve data from AsyncStorage
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue == null) return null;

      // Additional safety check for JSON parsing
      try {
        return JSON.parse(jsonValue);
      } catch (parseError) {
        console.error('Error parsing stored data:', parseError);
        // Remove corrupted data
        await this.removeItem(key);
        return null;
      }
    } catch (error) {
      console.error('Error reading data:', error);
      return null;
    }
  }

  /**
   * Remove data from AsyncStorage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
      // Don't throw error in production to prevent crashes
      if (__DEV__) {
        throw error;
      }
    }
  }

  /**
   * Clear all data from AsyncStorage
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing data:', error);
      // Don't throw error in production to prevent crashes
      if (__DEV__) {
        throw error;
      }
    }
  }

  /**
   * Get all keys from AsyncStorage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return (await AsyncStorage.getAllKeys()) as string[];
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Store user token
   */
  async setUserToken(token: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.USER_TOKEN, token);
  }

  /**
   * Get user token
   */
  async getUserToken(): Promise<string | null> {
    return this.getItem<string>(STORAGE_KEYS.USER_TOKEN);
  }

  /**
   * Remove user token
   */
  async removeUserToken(): Promise<void> {
    return this.removeItem(STORAGE_KEYS.USER_TOKEN);
  }

  /**
   * Store user data
   */
  async setUserData(userData: any): Promise<void> {
    return this.setItem(STORAGE_KEYS.USER_DATA, userData);
  }

  /**
   * Get user data
   */
  async getUserData(): Promise<any | null> {
    return this.getItem(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Remove user data
   */
  async removeUserData(): Promise<void> {
    return this.removeItem(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Store app settings
   */
  async setSettings(settings: any): Promise<void> {
    return this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  /**
   * Get app settings
   */
  async getSettings(): Promise<any | null> {
    return this.getItem(STORAGE_KEYS.SETTINGS);
  }

  /**
   * Store app theme
   */
  async setTheme(theme: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.THEME, theme);
  }

  /**
   * Get app theme
   */
  async getTheme(): Promise<string | null> {
    return this.getItem<string>(STORAGE_KEYS.THEME);
  }
}

export const storageService = new StorageService();
export default storageService;
