/**
 * Push token service – gets the best available push token for the backend.
 * Prefers FCM (Firebase) token; falls back to Expo push token if FCM is unavailable.
 */
import firebaseMessagingService from "./firebaseMessaging";
import { notificationService } from "./notificationService";

/**
 * Get the device push token to send to the backend.
 * Uses FCM token when available (recommended for Firebase backend);
 * falls back to Expo push token.
 */
export async function getPushTokenForBackend(): Promise<string> {
  try {
    // Prefer FCM token (works with Firebase Cloud Messaging)
    const fcmToken =
      (await firebaseMessagingService.getStoredFCMToken()) ??
      (await firebaseMessagingService.getFCMToken());

    if (fcmToken) {
      console.log("📬 [Notification] Push token (FCM) retrieved for backend, length:", fcmToken.length);
      return fcmToken;
    }

    // Fallback to Expo push token
    const expoToken =
      (await notificationService.getStoredPushToken()) ??
      (await notificationService.registerForPushNotificationsAsync());

    if (expoToken) {
      console.log("📬 [Notification] Push token (Expo) retrieved for backend");
    } else {
      console.warn("📬 [Notification] No push token available (FCM or Expo)");
    }
    return expoToken ?? "";
  } catch (e) {
    console.warn("📬 [Notification] Error getting push token:", e);
    return "";
  }
}
