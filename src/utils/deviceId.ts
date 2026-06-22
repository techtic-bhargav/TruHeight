import { STORAGE_KEYS } from '@/constants';
import storageService from '@/services/storage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Generate a unique device ID using device properties
 * This creates a consistent ID that persists across app sessions
 */
const generateDeviceId = (): string => {
  const parts: string[] = [];

  parts.push(Platform.OS);

  if (Device.modelName) {
    parts.push(Device.modelName.replace(/\s+/g, '_'));
  }

  if (Device.brand) {
    parts.push(Device.brand);
  }

  if (Device.osVersion) {
    parts.push(Device.osVersion.replace(/\./g, '_'));
  }

  const randomPart =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  parts.push(randomPart);

  return parts.join('-');
};

/**
 * Get or generate a unique device ID
 * The ID is stored in AsyncStorage and persists across app sessions
 */
export const getOrCreateDeviceId = async (): Promise<string> => {
  try {
    const storedDeviceId = await storageService.getItem<string>(
      STORAGE_KEYS.DEVICE_ID
    );

    if (storedDeviceId && storedDeviceId.length > 0) {
      return storedDeviceId;
    }

    const newDeviceId = generateDeviceId();
    await storageService.setItem(STORAGE_KEYS.DEVICE_ID, newDeviceId);

    return newDeviceId;
  } catch (error) {
    console.error('Error getting/creating device ID:', error);
    const fallbackId = `${Platform.OS}-${Device.modelName || 'unknown'}-${Date.now()}`;
    return fallbackId;
  }
};

/**
 * Get device type in a standardized format
 * Returns 'ios' or 'android' (lowercase) for consistency
 */
export const getDeviceType = (): string => {
  return Platform.OS.toLowerCase();
};
