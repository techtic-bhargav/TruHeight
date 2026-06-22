/**
 * Notification handlers - routes by notification type.
 */
import type { NotificationData } from "./notificationService";

export class NotificationHandlers {
  private router: { push: (href: string) => void } | null = null;

  setRouter(router: { push: (href: string) => void } | null): void {
    this.router = router;
  }

  handleNotification(notification: NotificationData): void {
    console.log("📬 [Notification] Handling notification type:", {
      type: notification.type,
      title: notification.title,
      data: notification.data,
    });
    switch (notification.type) {
      case "admin_notification":
        this.handleAdminNotification(notification);
        break;
      case "badge_earned":
        this.handleBadgeEarnedNotification(notification);
        break;
      case "daily_habit_reminder":
        this.handleDailyHabitReminderNotification(notification);
        break;
      case "monthly_height_reminder":
        this.handleMonthlyHeightReminderNotification(notification);
        break;
      case "monthly_weight_reminder":
        this.handleMonthlyWeightReminderNotification(notification);
        break;
      case "subscription":
        this.handleSubscriptionNotification(notification);
        break;
      default:
        break;
    }
  }

  private navigateTo(href: string): void {
    if (!this.router) {
      console.warn("📬 [Notification] Router not ready, cannot navigate:", href);
      return;
    }
    this.router.push(href);
    console.log("📬 [Notification] Navigated to:", href);
  }

  private handleAdminNotification(notification: NotificationData): void {
    console.log("📬 [Notification] Type set: admin_notification");
    this.navigateTo("/notification");
  }

  private handleBadgeEarnedNotification(notification: NotificationData): void {
    console.log("📬 [Notification] Type set: badge_earned");
    this.navigateTo("/(tabs)/badges");
  }

  private handleDailyHabitReminderNotification(
    notification: NotificationData,
  ): void {
    console.log("📬 [Notification] Type set: daily_habit_reminder");
    this.navigateTo("/(tabs)/routine");
  }

  private handleMonthlyHeightReminderNotification(
    notification: NotificationData,
  ): void {
    console.log("📬 [Notification] Type set: monthly_height_reminder");
    this.navigateTo("/notification");
  }

  private handleMonthlyWeightReminderNotification(
    notification: NotificationData,
  ): void {
    console.log("📬 [Notification] Type set: monthly_weight_reminder");
    this.navigateTo("/notification");
  }

  private handleSubscriptionNotification(notification: NotificationData): void {
    console.log("📬 [Notification] Type set: subscription");
    this.navigateTo("/managesubscription");
  }
}

export const notificationHandlers = new NotificationHandlers();
export default notificationHandlers;
