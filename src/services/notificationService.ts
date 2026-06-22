/**
 * Notification service – Expo Notifications.
 * Register for push, get Expo push token, handle received/tap, local notifications.
 * Safe when native module is unavailable (e.g. Expo Go) – methods no-op or return null.
 */
import { STORAGE_KEYS } from "@/constants";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";
import storageService from "./storage";

// Lazy-load to avoid "Cannot find native module 'ExpoPushTokenManager'" in Expo Go
let Notifications: typeof import("expo-notifications") | null = null;
try {
  Notifications = require("expo-notifications");
  if (Notifications) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowList: true,
      }),
    });
  }
} catch {
  // Expo Go or native module not linked – push not available
}

export interface NotificationData {
  type:
    | "admin_notification"
    | "badge_earned"
    | "daily_habit_reminder"
    | "monthly_height_reminder"
    | "subscription"
    | "monthly_weight_reminder";
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: boolean;
  badge?: number;
}

/** Shape we need from expo-notifications response (avoids importing module at load time). */
export interface NotificationResponse {
  notification: {
    request: {
      content: { title?: string | null; body?: string | null; data?: Record<string, unknown> };
      identifier: string;
    };
  };
}

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: ReturnType<
    typeof import("expo-notifications")["addNotificationReceivedListener"]
  > | null = null;
  private responseListener: ReturnType<
    typeof import("expo-notifications")["addNotificationResponseReceivedListener"]
  > | null = null;
  private handledNotificationIds: Set<string> = new Set();
  private handledNotificationResponseIds: Set<string> = new Set();

  isAvailable(): boolean {
    return Notifications != null;
  }

  private async ensureAndroidNotificationChannel(): Promise<void> {
    if (!Notifications || Platform.OS !== "android") return;
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default Notifications",
      description: "Default notification channel",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });
  }

  async registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Notifications) return null;
    let token: string | null = null;

    if (Platform.OS === "android") {
      try {
        await this.ensureAndroidNotificationChannel();
      } catch (error) {
        console.warn("Error creating Android notification channel:", error);
      }
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: true, allowSound: true },
        });
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Push notification permission not granted");
        return null;
      }

      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const pushTokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId as string | undefined,
        });
        token = pushTokenData.data;
        this.expoPushToken = token;
        await storageService.setItem(STORAGE_KEYS.EXPO_PUSH_TOKEN, token);
      } catch (error) {
        console.warn("Error getting Expo push token:", error);
      }
    } else {
      console.warn("Push notifications require a physical device");
    }

    return token;
  }

  async getStoredPushToken(): Promise<string | null> {
    if (this.expoPushToken) return this.expoPushToken;
    const stored = await storageService.getItem<string>(
      STORAGE_KEYS.EXPO_PUSH_TOKEN,
    );
    if (stored) {
      this.expoPushToken = stored;
      return stored;
    }
    return null;
  }

  async sendLocalNotification(notificationData: NotificationData): Promise<void> {
    if (!Notifications) return;
    console.log("📬 [Notification] Sending local notification:", {
      title: notificationData.title,
      body: notificationData.body,
      type: notificationData.type,
    });
    try {
      if (Platform.OS === "android") {
        await this.ensureAndroidNotificationChannel();
      }
      let badge: number | undefined;
      if (typeof notificationData.badge === "number") {
        badge = notificationData.badge;
      } else if (Platform.OS === "ios") {
        try {
          // Ensure badge permission is granted for iOS icon badge updates.
          let permissions = await Notifications.getPermissionsAsync();
          const badgeAllowed =
            permissions.granted || permissions.ios?.allowsBadge === true;
          if (!badgeAllowed && permissions.canAskAgain) {
            permissions = await Notifications.requestPermissionsAsync({
              ios: { allowAlert: true, allowBadge: true, allowSound: true },
            });
          }
          const finalBadgeAllowed =
            permissions.granted || permissions.ios?.allowsBadge === true;
          if (!finalBadgeAllowed) {
            console.warn(
              "📬 [Notification] iOS badge permission not granted; badge will not update",
            );
          }
          const currentBadge = await Notifications.getBadgeCountAsync();
          badge = currentBadge + 1;
          console.log("📬 [Notification] iOS badge update:", {
            currentBadge,
            nextBadge: badge,
          });
        } catch {
          console.warn("📬 [Notification] Could not read/update iOS badge count");
        }
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data ?? {},
          sound: notificationData.sound !== false,
          ...(typeof badge === "number" ? { badge } : {}),
          ...(Platform.OS === "android" ? { channelId: "default", priority: "high" } : {}),
        },
        trigger: null,
      });
      if (Platform.OS === "ios" && typeof badge === "number") {
        try {
          const success = await Notifications.setBadgeCountAsync(badge);
          console.log("📬 [Notification] iOS setBadgeCount result:", {
            badge,
            success,
          });
        } catch (error) {
          console.warn("📬 [Notification] iOS setBadgeCount failed:", error);
        }
      }
      console.log("📬 [Notification] Local notification displayed");
    } catch (error) {
      console.warn("📬 [Notification] Error sending local notification:", error);
    }
  }

  setupNotificationListeners(
    onNotificationReceived?: (notification: import("expo-notifications").Notification) => void,
    onNotificationResponse?: (response: NotificationResponse) => void,
  ): void {
    if (!Notifications) return;

    // Ensure listeners are not duplicated on re-mount/hot reload.
    this.removeNotificationListeners();
    this.checkLastNotificationResponse(onNotificationResponse);

    this.notificationListener =
      Notifications.addNotificationReceivedListener(async (notification) => {
        const id = notification.request.identifier;
        if (this.handledNotificationIds.has(id)) return;
        this.handledNotificationIds.add(id);

        onNotificationReceived?.(notification);
      });

    if (onNotificationResponse) {
      this.responseListener =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const id = response.notification.request.identifier;
          // Keep response dedupe separate from "received" dedupe so
          // foreground taps are still handled after receipt.
          if (this.handledNotificationResponseIds.has(id)) return;
          this.handledNotificationResponseIds.add(id);
          onNotificationResponse(response);
        });
    }
  }

  private async checkLastNotificationResponse(
    onNotificationResponse?: (response: NotificationResponse) => void,
  ): Promise<void> {
    if (!Notifications || !onNotificationResponse) return;
    try {
      const lastResponse =
        await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) {
        const id = lastResponse.notification.request.identifier;
        if (!this.handledNotificationResponseIds.has(id)) {
          this.handledNotificationResponseIds.add(id);
          onNotificationResponse(lastResponse);
        }
      }
    } catch {
      // ignore
    }
  }

  removeNotificationListeners(): void {
    this.notificationListener?.remove();
    this.notificationListener = null;
    this.responseListener?.remove();
    this.responseListener = null;
  }

  async clearAllNotifications(): Promise<void> {
    if (!Notifications) return;
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch {
      // ignore
    }
  }

  /**
   * Aligns the launcher icon badge with notifications still in the system tray.
   * Clearing all notifications from the tray does not reset the badge automatically;
   * call this when the app becomes active so the badge matches what is actually shown.
   */
  async syncAppIconBadgeWithPresentedNotifications(): Promise<void> {
    if (!Notifications) return;
    try {
      const presented = await Notifications.getPresentedNotificationsAsync();
      await Notifications.setBadgeCountAsync(presented.length);
    } catch (error) {
      console.warn(
        "📬 [Notification] syncAppIconBadgeWithPresentedNotifications failed:",
        error,
      );
    }
  }

  async getPermissionsStatus(): Promise<{ status: string }> {
    if (!Notifications) return { status: "undetermined" };
    return await Notifications.getPermissionsAsync();
  }

  async requestPermissions(): Promise<{ status: string }> {
    if (!Notifications) return { status: "undetermined" };
    return await Notifications.requestPermissionsAsync();
  }
}

export const notificationService = new NotificationService();
export default notificationService;
