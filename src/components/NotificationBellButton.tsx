import { FontFamilies } from "@/constants/fonts";
import { Images } from "@/constants/images";
import { useNotificationCountStore } from "@/store";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

type Props = {
  style?: ViewStyle;
  iconStyle?: ViewStyle;
  hitSlop?: number;
  /** If not provided, navigates to /notification */
  onPress?: () => void;
};

export function NotificationBellButton({
  style,
  iconStyle,
  hitSlop = 12,
  onPress,
}: Props) {
  const router = useRouter();
  const unreadCount = useNotificationCountStore((s) => s.unreadCount);
  const fetchUnreadCount = useNotificationCountStore((s) => s.fetchUnreadCount);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount]),
  );

  const handlePress = onPress ?? (() => router.push("/notification"));

  return (
    <Pressable
      style={[styles.button, style]}
      hitSlop={hitSlop}
      onPress={handlePress}
    >
      <View style={styles.badgeContainer}>
        <Image
          source={Images.notification}
          style={[styles.icon, iconStyle]}
          contentFit="contain"
        />
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            {unreadCount <= 9 ? (
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            ) : (
              <Text style={styles.unreadBadgeText}>9+</Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  icon: {
    width: 48,
    height: 48,
  },
  unreadBadge: {
    position: "absolute",
    top: 6,
    right: 15,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 3,
    borderRadius: 20,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    lineHeight: 10,
    fontFamily: FontFamilies.ownersMedium,
    textAlign: "center",
    includeFontPadding: false,
  },
});
