import messaging from "@react-native-firebase/messaging";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { PermissionsAndroid, Platform } from "react-native";
import storageService from "./storage";

/**
 * Background handler - runs when app is in BACKGROUND or QUIT state.
 * Must be at module load.
 * - If message has a notification payload, system (FCM/APNs) already displays it.
 * - If message is data-only, we display a local notification manually.
 */
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  const hasNotificationPayload = !!(
    remoteMessage?.notification?.title || remoteMessage?.notification?.body
  );

  if (hasNotificationPayload) {
    console.log(
      "📬 [Notification] Background/Quit notification payload detected; skipping local duplicate",
    );
    return;
  }

  const title =
    (remoteMessage?.data as any)?.title ?? "Notification";
  const body =
    (remoteMessage?.data as any)?.body ?? "";
  console.log("📬 [Notification] Background/Quit - displaying:", { title, body });

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default Notifications",
        description: "Default notification channel",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title || "Notification",
        body,
        data: remoteMessage?.data || {},
        sound: true,
        badge: 1,
        ...(Platform.OS === "android"
          ? { channelId: "default", priority: "high" as const }
          : {}),
      },
      trigger: null,
    });
    console.log("📬 [Notification] Background notification displayed");
  } catch (e) {
    console.warn("📬 [Notification] Background notification failed:", e);
  }
});

class FirebaseMessagingService {
  private fcmToken: string | null = null;
  // Track handled notifications so each one is processed only once
  private handledNotificationIds: Set<string> = new Set();
  private unsubscribeHandlers: (() => void) | null = null;

  /**
   * Request notification permissions (required for iOS and Android 13+)
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === "ios") {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log("📱 Firebase Messaging: Authorization status:", authStatus);
        return true;
      } else {
        console.warn("📱 Firebase Messaging: Permission denied");
        return false;
      }
    }

    // Android 13+ (API 33+) requires POST_NOTIFICATIONS runtime permission.
    const androidVersion =
      typeof Platform.Version === "number"
        ? Platform.Version
        : parseInt(String(Platform.Version), 10);
    if (androidVersion < 33) {
      return true;
    }

    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      const granted = result === PermissionsAndroid.RESULTS.GRANTED;
      if (granted) {
        console.log("📱 Firebase Messaging (Android): Permission granted");
      } else {
        console.warn("📱 Firebase Messaging (Android): Permission denied");
      }
      return granted;
    } catch (error) {
      console.error(
        "❌ Firebase Messaging (Android): Error requesting permission:",
        error,
      );
      return false;
    }
  }

  /**
   * Get FCM token
   */
  async getFCMToken(): Promise<string | null> {
    try {
      console.log("🔥 Firebase Messaging: Starting FCM token retrieval...");
      console.log("🔥 Platform:", Platform.OS);
      console.log("🔥 Device info:", {
        isDevice: Device.isDevice,
        deviceName: Device.deviceName,
        osName: Device.osName,
        osVersion: Device.osVersion,
      });

      // Request permission first
      console.log("🔥 Firebase Messaging: Requesting permissions...");
      const hasPermission = await this.requestPermission();
      console.log("🔥 Firebase Messaging: Permission granted:", hasPermission);

      if (!hasPermission) {
        console.warn(
          "📱 Firebase Messaging: Permission not granted, cannot get token",
        );
        return null;
      }

      // Register device for remote messages (required on iOS before getToken)
      console.log("🔥 Firebase Messaging: Registering device for remote messages...");
      const registered = await this.registerForRemoteMessages();
      if (!registered) {
        console.warn("📱 Firebase Messaging: Failed to register for remote messages");
      }

      // Get the FCM token
      console.log("🔥 Firebase Messaging: Calling messaging().getToken()...");
      const token = await messaging().getToken();
      console.log(
        "🔥 Firebase Messaging: Token received, length:",
        token || 0,
      );

      if (token) {
        this.fcmToken = token;
        // Store the token in local storage
        await storageService.setItem("fcm_token", token);
        console.log("✅ Firebase Messaging: FCM Token retrieved successfully!");
        console.log("✅ FCM Token (full):", token);
        console.log(
          "✅ FCM Token (first 50 chars):",
          token.substring(0, 50) + "...",
        );
        console.log(
          "✅ FCM Token (last 20 chars):",
          "..." + token.substring(token.length - 20),
        );
        return token;
      } else {
        console.warn("📱 Firebase Messaging: No token available");
        return null;
      }
    } catch (error: any) {
      console.error("❌ Firebase Messaging: Error getting FCM token");
      console.error("❌ Error details:", error);
      console.error("❌ Error message:", error?.message);
      console.error("❌ Error code:", error?.code);
      console.error("❌ Error stack:", error?.stack);

      // Don't throw - gracefully handle Firebase not being initialized
      if (
        error?.code === "messaging/unregistered" ||
        error?.message?.includes("Firebase")
      ) {
        console.warn(
          "⚠️ Firebase Messaging may not be fully initialized. Token retrieval will be retried on next login/register.",
        );
      }
      return null;
    }
  }

  /**
   * Get stored FCM token
   */
  async getStoredFCMToken(): Promise<string | null> {
    if (this.fcmToken) {
      return this.fcmToken;
    }

    try {
      const storedToken = await storageService.getItem("fcm_token");
      if (storedToken) {
        this.fcmToken = storedToken as string;
        return storedToken as string;
      }
    } catch (error) {
      console.error(
        "❌ Firebase Messaging: Error getting stored token:",
        error,
      );
    }

    return null;
  }

  /**
   * Delete FCM token (useful for logout)
   */
  async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      this.fcmToken = null;
      await storageService.removeItem("fcm_token");
      console.log("🗑️ Firebase Messaging: Token deleted");
    } catch (error) {
      console.error("❌ Firebase Messaging: Error deleting token:", error);
    }
  }

  /**
   * Set up token refresh listener
   */
  setupTokenRefreshListener(
    onTokenRefresh?: (token: string) => void,
  ): () => void {
    const unsubscribe = messaging().onTokenRefresh(async (token) => {
      console.log(
        "🔄 Firebase Messaging: Token refreshed:",
        token.substring(0, 20) + "...",
      );
      this.fcmToken = token;
      await storageService.setItem("fcm_token", token);

      if (onTokenRefresh) {
        onTokenRefresh(token);
      }
    });

    // Return unsubscribe function
    return () => {
      unsubscribe();
    };
  }

  /**
   * Set up message handlers
   */
  setupMessageHandlers(
    onMessage?: (remoteMessage: any) => void,
    onNotificationOpened?: (remoteMessage: any) => void,
  ): () => void {
    console.log("🔥 Firebase Messaging: Setting up message handlers...");

    // Clean up existing handlers if any
    if (this.unsubscribeHandlers) {
      this.unsubscribeHandlers();
    }

    // Get unique ID from notification
    const getNotificationId = (remoteMessage: any): string => {
      return (
        remoteMessage?.messageId ||
        remoteMessage?.notificationId ||
        remoteMessage?.data?.notificationId ||
        `${remoteMessage?.data?.type || "unknown"}-${Date.now()}`
      );
    };

    // Handle foreground messages
    const unsubscribeMessage = messaging().onMessage(async (remoteMessage) => {
      const id = getNotificationId(remoteMessage);

      console.log("🔥 Firebase Messaging: Foreground message received:", {
        id,
        title: remoteMessage?.notification?.title,
        body: remoteMessage?.notification?.body,
        data: remoteMessage?.data,
        platform: Platform.OS,
      });

      // Ensure each notification is handled only once
      if (this.handledNotificationIds.has(id)) {
        console.log(
          "⚠️ Firebase Messaging: Duplicate notification ignored (already handled):",
          id,
        );
        return;
      }

      this.handledNotificationIds.add(id);

      console.log("✅ Firebase Messaging: Foreground message (first time):", {
        id,
        title: remoteMessage?.notification?.title,
        body: remoteMessage?.notification?.body,
        data: remoteMessage?.data,
      });

      // On Android, Firebase messages in foreground need to be converted to local notifications
      // to be displayed. Expo notifications will handle this automatically.
      if (onMessage) {
        onMessage(remoteMessage);
      }
    });

    // Background handler is registered at module load (top of file)

    // Handle notification opened when app was in background or quit state
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          const id = getNotificationId(remoteMessage);

          console.log("🔥 Firebase Messaging: Initial notification found:", {
            id,
            title: remoteMessage?.notification?.title,
            body: remoteMessage?.notification?.body,
          });

          // Check if already handled
          if (!this.handledNotificationIds.has(id)) {
            this.handledNotificationIds.add(id);
            console.log(
              "✅ Firebase Messaging: Processing initial notification (first time):",
              {
                id,
                title: remoteMessage?.notification?.title,
                data: remoteMessage?.data,
              },
            );

            if (onNotificationOpened) {
              onNotificationOpened(remoteMessage);
            }
          } else {
            console.log(
              "⚠️ Firebase Messaging: Initial notification already handled:",
              id,
            );
          }
        }
      });

    // Handle notification opened when app was in background
    const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(
      (remoteMessage) => {
        const id = getNotificationId(remoteMessage);

        console.log(
          "🔥 Firebase Messaging: Notification opened app from background:",
          {
            id,
            title: remoteMessage?.notification?.title,
            body: remoteMessage?.notification?.body,
          },
        );

        // Ensure each notification is handled only once
        if (this.handledNotificationIds.has(id)) {
          console.log(
            "⚠️ Firebase Messaging: Notification response ignored (already handled):",
            id,
          );
          return;
        }

        this.handledNotificationIds.add(id);

        console.log(
          "✅ Firebase Messaging: Notification opened (first time):",
          {
            id,
            title: remoteMessage?.notification?.title,
            data: remoteMessage?.data,
          },
        );

        if (onNotificationOpened) {
          onNotificationOpened(remoteMessage);
        }
      },
    );

    // Store unsubscribe function
    const unsubscribe = () => {
      unsubscribeMessage();
      unsubscribeNotificationOpened();
      this.unsubscribeHandlers = null;
    };

    this.unsubscribeHandlers = unsubscribe;

    console.log(
      "✅ Firebase Messaging: Message handlers registered successfully",
    );

    // Return unsubscribe function
    return unsubscribe;
  }

  /**
   * Remove message handlers
   */
  removeMessageHandlers(): void {
    if (this.unsubscribeHandlers) {
      this.unsubscribeHandlers();
      this.unsubscribeHandlers = null;
    }
  }

  /**
   * Check if notifications are enabled
   */
  async isNotificationEnabled(): Promise<boolean> {
    try {
      if (Platform.OS === "android") {
        const androidVersion =
          typeof Platform.Version === "number"
            ? Platform.Version
            : parseInt(String(Platform.Version), 10);
        if (androidVersion < 33) return true;
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        console.log("🔔 Notification permission status:", {
          hasPermission,
          platform: Platform.OS,
          androidVersion,
        });
        return hasPermission;
      }

      const authStatus = await messaging().requestPermission();
      const isEnabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      console.log("🔔 Notification permission status:", {
        authStatus,
        isEnabled,
        platform: Platform.OS,
      });
      return isEnabled;
    } catch (error) {
      console.error(
        "❌ Firebase Messaging: Error checking notification status:",
        error,
      );
      return false;
    }
  }

  /**
   * Register device for remote messages (required on iOS before getToken, recommended on Android)
   */
  async registerForRemoteMessages(): Promise<boolean> {
    try {
      await messaging().registerDeviceForRemoteMessages();
      console.log("✅ Device registered for remote messages");
      return true;
    } catch (error) {
      console.error("❌ Failed to register device for remote messages:", error);
      return false;
    }
  }

  /**
   * Comprehensive diagnostic for push notification issues
   */
  async diagnoseNotificationIssues(): Promise<void> {
    console.log("🔍 === PUSH NOTIFICATION DIAGNOSTIC ===");

    try {
      // 1. Check device info
      console.log("📱 Device Info:", {
        isDevice: Device.isDevice,
        deviceName: Device.deviceName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        platform: Platform.OS,
      });

      // 2. Check permissions
      const hasPermission = await this.isNotificationEnabled();
      console.log("🔔 Notification Permission:", hasPermission);

      // 3. Check if Firebase is available
      let isFirebaseAvailable = false;
      try {
        // Try to check if messaging is available
        const messagingInstance = messaging();
        if (messagingInstance) {
          // For Android, check if device is registered for remote messages
          if (Platform.OS === "android") {
            isFirebaseAvailable =
              await messagingInstance.isDeviceRegisteredForRemoteMessages;
          } else {
            // For iOS, assume it's available if we can get the messaging instance
            isFirebaseAvailable = true;
          }
        }
      } catch (error) {
        console.warn("🔥 Firebase Registration check failed:", error);
        isFirebaseAvailable = false;
      }
      console.log("🔥 Firebase Registration:", isFirebaseAvailable);

      // If not registered and on Android, try to register
      if (!isFirebaseAvailable && Platform.OS === "android") {
        console.log("🔄 Attempting to register device for remote messages...");
        const registrationSuccess = await this.registerForRemoteMessages();
        if (registrationSuccess) {
          // Re-check registration status
          try {
            isFirebaseAvailable =
              await messaging().isDeviceRegisteredForRemoteMessages;
            console.log(
              "🔥 Firebase Registration (after manual registration):",
              isFirebaseAvailable,
            );
          } catch (error) {
            console.warn("🔥 Re-check registration failed:", error);
          }
        }
      }

      // 4. Try to get FCM token
      let token = null;
      try {
        token = await this.getFCMToken();
      } catch (error) {
        console.warn("🎫 FCM Token retrieval failed:", error);
      }

      console.log("🎫 FCM Token Status:", {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? token.substring(0, 20) + "..." : "No token",
      });

      // 5. Check if app is in background/foreground
      console.log("📱 App State: Foreground (diagnostic running)");

      // 6. Additional Firebase checks
      try {
        const authStatus = await messaging().requestPermission();
        console.log("🔐 Firebase Auth Status:", authStatus);
      } catch (error) {
        console.warn("🔐 Firebase Auth Status check failed:", error);
      }

      // 7. Test notification capability
      if (Platform.OS === "android") {
        console.log("🤖 Android-specific checks:");
        console.log("- Google Play Services should be available");
        console.log("- POST_NOTIFICATIONS permission should be granted");
        console.log("- google-services.json should be properly configured");

        // Additional Android checks
        try {
          const isAutoInitEnabled = messaging().isAutoInitEnabled;
          console.log("🔧 Firebase Auto Init Enabled:", isAutoInitEnabled);
        } catch (error) {
          console.warn("🔧 Auto Init check failed:", error);
        }
      } else if (Platform.OS === "ios") {
        console.log("🍎 iOS-specific checks:");
        console.log("- APNs should be properly configured");
        console.log("- GoogleService-Info.plist should be included");
        console.log("- Push notification capability should be enabled");
      }

      console.log("🔍 === END DIAGNOSTIC ===");
    } catch (error) {
      console.error("❌ Error during diagnostic:", error);
    }
  }
}

// Export a singleton instance
export const firebaseMessagingService = new FirebaseMessagingService();
export default firebaseMessagingService;
