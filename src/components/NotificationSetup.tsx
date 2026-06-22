/**
 * Sets up push notification listeners and routes taps to TruHeight screens.
 * Handles both Firebase Cloud Messaging (FCM) and Expo notifications.
 * Mount once in root layout.
 */
import { firebaseMessagingService } from "@/services/firebaseMessaging";
import { notificationHandlers } from "@/services/notificationHandlers";
import {
  notificationService,
  type NotificationData,
  type NotificationResponse,
} from "@/services/notificationService";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";

function getNotificationDataFromResponse(
  response: NotificationResponse,
): NotificationData {
  const content = response.notification.request.content;
  const data = (content.data || {}) as Record<string, unknown>;
  const type = (data.type as NotificationData["type"]) ?? "admin_notification";
  return {
    type,
    title: content.title ?? "",
    body: content.body ?? "",
    data,
    sound: true,
  };
}

function remoteMessageToNotificationData(remoteMessage: any): NotificationData {
  const data = (remoteMessage?.data || {}) as Record<string, unknown>;
  const type = (data.type as NotificationData["type"]) ?? "admin_notification";
  const title =
    remoteMessage?.notification?.title ??
    (data.title as string) ??
    "";
  const body =
    remoteMessage?.notification?.body ??
    (data.body as string) ??
    "";
  return {
    type,
    title,
    body,
    data,
    sound: true,
  };
}

export function NotificationSetup() {
  const router = useRouter();

  useEffect(() => {
    const syncBadge = () => {
      notificationService.syncAppIconBadgeWithPresentedNotifications();
    };
    syncBadge();
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "active") {
        syncBadge();
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const routerRef = router as { push: (href: string) => void };
    notificationHandlers.setRouter(routerRef);

    console.log("📬 [Notification] Setting up notification handlers...");

    // Request permission early so notifications work when user reaches login/onboarding
    firebaseMessagingService.requestPermission().then((ok) => {
      if (ok) {
        notificationService.requestPermissions().then((permission) => {
          console.log("📬 [Notification] Expo notification permission:", permission.status);
        });
        firebaseMessagingService.getFCMToken().then((token) => {
          if (token) console.log("📬 [Notification] Token ready:", token.substring(0, 40) + "...");
        });
      }
    });

    // 1. Firebase message handlers (FCM – foreground, background, opened)
    const unsubscribeFirebase = firebaseMessagingService.setupMessageHandlers(
      async (remoteMessage) => {
        // Foreground: show local notification
        console.log("📬 [Notification] Foreground message -> showing local notification:", {
          title: remoteMessage?.notification?.title,
          body: remoteMessage?.notification?.body,
        });
        const notifData = remoteMessageToNotificationData(remoteMessage);
        await notificationService.sendLocalNotification(notifData);
      },
      (remoteMessage) => {
        // User tapped notification (from background/quit)
        console.log("📬 [Notification] User tapped notification (app was backgrounded/quit):", {
          title: remoteMessage?.notification?.title,
          data: remoteMessage?.data,
        });
        const notifData = remoteMessageToNotificationData(remoteMessage);
        notificationHandlers.handleNotification(notifData);
      },
    );

    // 2. Expo notification listeners (for taps on locally shown notifications)
    notificationService.setupNotificationListeners(
      (notification) => {
        console.log("📬 [Notification] Expo: notification received in app:", {
          title: notification.request.content.title,
          body: notification.request.content.body,
        });
      },
      (response) => {
        console.log("📬 [Notification] Expo: user tapped notification:", {
          title: response.notification.request.content.title,
        });
        const notificationData = getNotificationDataFromResponse(response);
        notificationHandlers.handleNotification(notificationData);
      },
    );

    console.log("📬 [Notification] Handlers registered successfully");

    // 3. Token refresh listener
    const unsubscribeTokenRefresh =
      firebaseMessagingService.setupTokenRefreshListener((token) => {
        if (token) {
          // TODO: Call backend to update device token if you have an endpoint
          console.log("📱 FCM token refreshed");
        }
      });

    return () => {
      unsubscribeFirebase();
      unsubscribeTokenRefresh();
      notificationService.removeNotificationListeners();
      notificationHandlers.setRouter(null);
    };
  }, [router]);

  return null;
}
