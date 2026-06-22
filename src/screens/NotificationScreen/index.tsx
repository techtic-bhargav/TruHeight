import {
    getUserNotifications,
    readAllNotifications,
    readNotification,
    type UserNotificationItem,
} from "@/api/endpoints/users";
import { LoaderService } from "@/components/loader";
import { ToastService } from "@/components/toast";
import { FontFamilies } from "@/constants/fonts";
import { Images } from "@/constants/images";
import { Colors } from "@/constants/theme";
import { useNotificationCountStore } from "@/store";
import { Image } from "expo-image";
import { type Href, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  isNew: boolean;
}

function formatNotificationTimestamp(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const absDiffMs = Math.abs(diffMs);
    const diffSeconds = Math.floor(absDiffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 1) {
      return "Now";
    }
    if (diffHours < 1) {
      return `${diffMinutes}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    // Check for "Yesterday"
    const yesterday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1,
    );
    const sameDayAsYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate();
    if (sameDayAsYesterday) {
      return "Yesterday";
    }

    // Fallback: D-MMM (e.g. 8-Mar, 7-Mar)
    const day = date.getDate();
    const monthShortNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthLabel = monthShortNames[date.getMonth()] ?? "";
    return `${day}-${monthLabel}`;
  } catch {
    return "";
  }
}

export default function NotificationScreen() {
  const router = useRouter();
  const setUnreadCount = useNotificationCountStore((s) => s.setUnreadCount);
  const decrementUnreadCount = useNotificationCountStore(
    (s) => s.decrementUnreadCount,
  );
  const incrementUnreadCount = useNotificationCountStore(
    (s) => s.incrementUnreadCount,
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        LoaderService.show();
        const res = await getUserNotifications({ only_unread: false });
        if (!mounted) return;
        if (res?.status === "success" && res.data?.notifications) {
          if (typeof res.data?.unread_count === "number") {
            setUnreadCount(res.data.unread_count);
          }
          const mapped: Notification[] = res.data.notifications.map(
            (item: UserNotificationItem) => ({
              id: item.id,
              title: item.title,
              description: item.body,
              timestamp: formatNotificationTimestamp(item.created_at),
              isNew: !item.is_read,
            }),
          );
          setNotifications(mapped);
        } else {
          setNotifications([]);
        }
      } catch {
        if (!mounted) return;
        setNotifications([]);
      } finally {
        if (mounted) {
          setLoading(false);
          LoaderService.hide();
        }
      }
    };

    fetchNotifications();
    return () => {
      mounted = false;
    };
  }, []);

  const handleBack = () => router.back();

  const handleReadAll = async () => {
    if (loading) return;
    try {
      setLoading(true);
      LoaderService.show();
      const res = await readAllNotifications();
      if (res?.status === "success") {
        ToastService.showSuccess("All notifications are read.");
        setUnreadCount(0);
        // Optimistically mark all as read in UI
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            isNew: false,
          })),
        );
      } else {
        ToastService.showError(
          (res as any)?.message ?? "Failed to mark notifications as read.",
        );
      }
    } catch {
      ToastService.showError("Failed to mark notifications as read.");
    } finally {
      setLoading(false);
      LoaderService.hide();
    }
  };

  const getNotificationRoute = (title: string): Href | null => {
    if (title === "🎉 New Badge Earned!") {
      return "/(tabs)/badges";
    }
    if (title === "Nutrition reminder") {
      return "/(tabs)/routine";
    }
    if (title === "Subscription cancelled" || title === 'Subscription update' || title === "Subscription update" || title === "Subscription expired") {
      return "/(profile)/managesubscription";
    }
    return null;
  };

  const handleNotificationPress = async (notification: Notification) => {
    const targetRoute = getNotificationRoute(notification.title);

    if (!notification.isNew) {
      if (targetRoute) {
        router.push(targetRoute);
      }
      return;
    }

    const notificationId = notification.id;

    // Optimistically mark as read in UI
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId
          ? {
            ...n,
            isNew: false,
          }
          : n,
      ),
    );

    try {
      decrementUnreadCount(1);
      LoaderService.show();
      await readNotification(notificationId);
    } catch {
      // If API fails, revert optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? {
              ...n,
              isNew: true,
            }
            : n,
        ),
      );
      incrementUnreadCount(1);
      ToastService.showError("Failed to mark notification as read.");
    } finally {
      LoaderService.hide();
      if (targetRoute) {
        router.push(targetRoute);
      }
    }
  };

  return (
    console.log("notifications notifications", notifications),

    <View
      style={[
        styles.container,
        { backgroundColor: Colors.onboardingBackground },
      ]}
    >
      <StatusBar style="dark" />

      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            style={styles.backButton}
          >
            <Image
              source={Images.back}
              style={styles.backIcon}
              contentFit="contain"
            />
          </Pressable>
          {
            notifications.length > 0 &&

            <Pressable onPress={handleReadAll} hitSlop={12}>
              <Text style={[styles.readAllText, { color: Colors.naturalBlack }]}>
                Read All
              </Text>
            </Pressable>}
        </View>

        <Text style={[styles.title, { color: Colors.naturalBlack }]}>
          Notifications
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.notificationsList}>
          {notifications.map((notification) => (
            <Pressable
              key={notification.id}
              onPress={() => handleNotificationPress(notification)}
              style={({ pressed }) => [
                styles.notificationCard,
                {
                  backgroundColor: notification.isNew
                    ? "#FFFFFF"
                    : Colors.textFieldBackground,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: "transparent" },
                ]}
              >
                <Image
                  source={Images.notificationBell}
                  style={styles.bellIcon}
                  contentFit="contain"
                />
              </View>

              <View style={styles.contentWrapper}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.notificationTitle,
                      { color: Colors.naturalBlack },
                    ]}
                    numberOfLines={1}
                  >
                    {notification.title}
                  </Text>
                  <View style={styles.metaContainer}>
                    <Text
                      style={[
                        styles.timestamp,
                        { color: Colors.textFieldPlaceholder },
                      ]}
                      numberOfLines={1}
                    >
                      {notification.timestamp}
                    </Text>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: notification.isNew
                            ? Colors.statusDotActive
                            : Colors.statusDotInactive,
                        },
                      ]}
                    />
                  </View>
                </View>

                <Text
                  style={[
                    styles.notificationDescription,
                    { color: Colors.textFieldPlaceholder },
                  ]}
                >
                  {notification.description}
                </Text>
              </View>
            </Pressable>
          ))}
          {!loading && notifications.length === 0 && (
            <Text
              style={[
                styles.notificationDescription,
                { color: Colors.textFieldPlaceholder, textAlign: "center" },
              ]}
            >
              No notifications found.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: Platform.OS === "ios" ? 64 : 50,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    left: -8,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  readAllText: {
    fontSize: 14,
    fontFamily: FontFamilies.ownersRegular,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontFamily: FontFamilies.butlerBold,
  },
  notificationsList: {
    gap: 16,
  },
  notificationCard: {
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    gap: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bellIcon: {
    width: 32,
    height: 32,
  },
  contentWrapper: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    gap: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: FontFamilies.ownersMedium,
    flex: 1,
  },
  notificationDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FontFamilies.ownersRegular,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: FontFamilies.ownersRegular,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
