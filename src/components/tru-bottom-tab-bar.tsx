import { getProfile } from "@/api/endpoints/users";
import { FontFamilies } from "@/constants/fonts";
import { Images } from "@/constants/images";
import { Colors } from "@/constants/theme";
import { useProfileRefreshStore } from "@/store";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_ICON_SIZE = 24;
const ACTIVE_ICON_WRAPPER_SIZE = 38;

const TAB_CONFIG = [
  {
    name: "index",
    label: "Home",
    imageSource: Images.icHome,
    selectedImageSource: Images.homeSelected,
    isProfile: false,
  },
  {
    name: "leaderboard",
    label: "Leaderboard",
    imageSource: Images.icLeaderboard,
    selectedImageSource: Images.leaderboardSelected,
    isProfile: false,
  },
  {
    name: "routine",
    label: "Routine",
    imageSource: Images.icRoutine,
    selectedImageSource: Images.routineSelected,
    isProfile: false,
  },
  {
    name: "badges",
    label: "Badges",
    imageSource: Images.icBadges,
    selectedImageSource: Images.badgeSelected,
    isProfile: false,
  },
  {
    name: "profile",
    label: "Profile",
    imageSource: null,
    isProfile: true,
  },
] as const;

export function TruBottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const profileRefreshTrigger = useProfileRefreshStore(
    (s) => s.profileRefreshTrigger,
  );

  useEffect(() => {
    let cancelled = false;
    getProfile().then((res) => {
      if (cancelled || res?.status !== "success" || !res?.data?.user) return;
      const { user, selected_child } = res.data;
      const url =
        user.role === "parent" && selected_child?.profile_image_url
          ? selected_child.profile_image_url
          : (user.profile_image_url ?? null);
      setProfileImageUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [profileRefreshTrigger]);

  return (
    <View style={{ backgroundColor: Colors.homeBackground }}>
      <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const config =
              TAB_CONFIG.find((c) => c.name === route.name) ?? TAB_CONFIG[0];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            const activeColor = Colors.naturalBlack;
            const inactiveColor = Colors.tabIconDefault;

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={config.label}
                testID={`tab-${route.name}`}
                onPress={onPress}
                onLongPress={onLongPress}
                onPressIn={() => {
                  if (Platform.OS === "ios") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                style={styles.tabButton}
              >
                <View style={styles.tabContent}>
                  {config.isProfile ? (
                    <View
                      style={[
                        styles.profileIconWrapper,
                        !isFocused && styles.profileIconWrapperInactive,
                        isFocused && styles.profileIconWrapperActive,
                      ]}
                    >
                      <Image
                        key={profileImageUrl ?? "profile-fallback"}
                        source={
                          profileImageUrl
                            ? { uri: profileImageUrl }
                            : Images.placeholder
                        }
                        style={styles.profileAvatar}
                        contentFit="cover"
                        placeholder={Images.placeholder}
                        defaultSource={Images.placeholder}
                        transition={120}
                      />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.iconWrapper,
                        isFocused && styles.iconWrapperActive,
                      ]}
                    >
                      <Image
                        source={
                          isFocused && config.selectedImageSource
                            ? config.selectedImageSource
                            : config.imageSource!
                        }
                        style={styles.tabIconImage}
                        contentFit="contain"
                      />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.label,
                      { color: isFocused ? activeColor : inactiveColor },
                      isFocused && styles.labelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {config.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  iconWrapper: {
    width: ACTIVE_ICON_WRAPPER_SIZE,
    height: ACTIVE_ICON_WRAPPER_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapperActive: {
    backgroundColor: "rgba(104, 112, 118, 0.15)",
    borderRadius: ACTIVE_ICON_WRAPPER_SIZE / 2,
  },
  profileIconWrapper: {
    width: ACTIVE_ICON_WRAPPER_SIZE,
    height: ACTIVE_ICON_WRAPPER_SIZE,
    borderRadius: ACTIVE_ICON_WRAPPER_SIZE / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.textFieldBackground,
  },
  profileIconWrapperInactive: {
    borderWidth: 0,
    borderColor: "rgba(104, 112, 118, 0.35)",
  },
  profileIconWrapperActive: {
    borderWidth: 2,
    borderColor: Colors.naturalBlack,
  },
  profileAvatar: {
    width: ACTIVE_ICON_WRAPPER_SIZE,
    height: ACTIVE_ICON_WRAPPER_SIZE,
    borderRadius: ACTIVE_ICON_WRAPPER_SIZE / 2,
  },
  tabIconImage: {
    width: TAB_ICON_SIZE,
    height: TAB_ICON_SIZE,
  },
  label: {
    fontSize: 11,
    fontFamily: FontFamilies.ownersRegular,
  },
  labelActive: {
    fontFamily: FontFamilies.ownersMedium,
    fontWeight: "600",
  },
});
