import {
  getLeaderboardChildTeen,
  getLeaderboardParent,
  type LeaderboardUser,
} from "@/api/endpoints/users";
import { LoaderService } from "@/components/loader";
import { NotificationBellButton } from "@/components/NotificationBellButton";
import {
  TruSubscriptionToggle,
  type SubscriptionType,
} from "@/components/tru-subscription-toggle";
import { FontFamilies } from "@/constants/fonts";
import { Images } from "@/constants/images";
import { Colors } from "@/constants/theme";
import { useTrackLeaderboardActivityOnFocus } from "@/hooks/useTrackLeaderboardActivity";
import { globalStyles } from "@/styles/global";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// URLs to treat as invalid placeholders - use local avatar instead
const PLACEHOLDER_URL_PATTERNS = [
  "dummyimage.com",
  "placeholder",
  "placehold.co",
];

const isValidAvatarUrl = (url: string | null): boolean => {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return !PLACEHOLDER_URL_PATTERNS.some((p) => lower.includes(p));
};

// Only dynamic image from API; no default avatar set
const getAvatarSource = (user: LeaderboardUser): { uri: string } | null => {
  const url = user.profile_image_url;
  if (url && isValidAvatarUrl(url)) return { uri: url };
  return null;
};

export default function LeaderboardScreen() {
  const router = useRouter();
  useTrackLeaderboardActivityOnFocus();
  const [leaderboardType, setLeaderboardType] = useState<"child" | "parent">(
    "child",
  );
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRowLayout, setCurrentUserRowLayout] = useState<{
    y: number;
    height: number;
  } | null>(null);
  const [showSticky, setShowSticky] = useState(true);
  /** When false, sticky area is unmounted so no gap remains when bar is hidden */
  const [stickyAreaVisible, setStickyAreaVisible] = useState(true);
  const scrollContentRef = useRef<View>(null);
  const currentUserRowRef = useRef<View>(null);
  const stickyOpacity = useRef(new Animated.Value(1)).current;
  const stickyTranslateY = useRef(new Animated.Value(0)).current;

  const fetchLeaderboard = useCallback(async (type: "child" | "parent") => {
    setError(null);
    setTopUsers([]);
    setCurrentUser(null);
    setCurrentUserRowLayout(null);
    setShowSticky(true);
    setStickyAreaVisible(true);
    LoaderService.show();
    try {
      const res =
        type === "child"
          ? await getLeaderboardChildTeen({ page: 1, limit: 100 })
          : await getLeaderboardParent({ page: 1, limit: 100 });
      if (res?.status === "success" && res?.data) {
        if (res.data.top_users) setTopUsers(res.data.top_users);
        else setTopUsers([]);
        if (res.data.current_user) setCurrentUser(res.data.current_user);
        else setCurrentUser(null);
      } else {
        setTopUsers([]);
        setCurrentUser(null);
      }
    } catch {
      setError("Failed to load leaderboard");
      setTopUsers([]);
      setCurrentUser(null);
    } finally {
      LoaderService.hide();
    }
  }, []);

  // Refetch leaderboard every time the user visits this tab
  useFocusEffect(
    useCallback(() => {
      fetchLeaderboard(leaderboardType);
    }, [leaderboardType, fetchLeaderboard]),
  );

  const topThree = topUsers.slice(0, 3);
  const listData = topUsers.slice(3);

  const handleScroll = useCallback(
    (e: {
      nativeEvent: {
        contentOffset: { y: number };
        layoutMeasurement: { height: number };
      };
    }) => {
      if (!currentUser || currentUser.rank <= 3) return;
      const { contentOffset, layoutMeasurement } = e.nativeEvent;
      const scrollY = contentOffset.y;
      const viewportHeight = layoutMeasurement.height;
      if (currentUserRowLayout) {
        const { y, height } = currentUserRowLayout;
        const rowVisible =
          scrollY <= y + height && scrollY + viewportHeight >= y;
        setShowSticky((prev) => (prev !== !rowVisible ? !rowVisible : prev));
      }
    },
    [currentUser, currentUserRowLayout],
  );

  useEffect(() => {
    if (!currentUser || currentUser.rank <= 3) return;
    if (showSticky) {
      setStickyAreaVisible(true);
      Animated.parallel([
        Animated.timing(stickyOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(stickyTranslateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(stickyOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(stickyTranslateY, {
          toValue: -36,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setStickyAreaVisible(false);
      });
    }
  }, [showSticky, currentUser, stickyOpacity, stickyTranslateY]);

  const measureCurrentUserRow = useCallback(() => {
    const row = currentUserRowRef.current;
    const content = scrollContentRef.current;
    if (!row || !content || !currentUser || currentUser.rank <= 3) return;
    row.measureLayout(
      content as unknown as number,
      (_x: number, y: number, _w: number, height: number) => {
        setCurrentUserRowLayout({ y, height });
      },
      () => {},
    );
  }, [currentUser]);

  const renderItem = ({ item }: { item: LeaderboardUser }) => {    
    const isCurrentUserRow =
      !!currentUser && item.user_id === currentUser.user_id;
    return (
      <View
        ref={isCurrentUserRow ? currentUserRowRef : undefined}
        style={[styles.row, item.is_current_user && styles.currentUserRow]}
        onLayout={isCurrentUserRow ? measureCurrentUserRow : undefined}
      >
        <Text
          style={[styles.rank, item.is_current_user && styles.currentUserText]}
        >
          {item.rank}
        </Text>

        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Image
              source={getAvatarSource(item) ?? Images.placeholder}
              placeholder={Images.placeholder}
              placeholderContentFit="cover"
              transition={200}
              style={styles.avatar}
              contentFit="cover"
              contentPosition="center"
            />
          </View>
          <Text
            style={[
              styles.name,
              item.is_current_user && styles.currentUserText,
            ]}
          >
            {item.username}
          </Text>
        </View>

        <View style={styles.streakContainer}>
          <Text
            style={[
              styles.streak,
              item.is_current_user && styles.currentUserText,
            ]}
          >
            {item.current_streak_count}
          </Text>
          <MaterialCommunityIcons name="fire" size={20} color="#FF6B35" />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View
          ref={scrollContentRef}
          collapsable={false}
          style={styles.scrollContentInner}
        >
          {/* TOP 3 HEADER IMAGE + PROFILES + TOGGLE - wrapped with globalStyles.headerRediusView */}
          <View
            style={[
              globalStyles.headerRediusView,
              { backgroundColor: Colors.routineHeaderBackground },
            ]}
          >
            {/* HEADER */}
            <View style={styles.header}>
              <Text style={styles.title}>Leaderboard</Text>
              <NotificationBellButton
                style={styles.notificationButton}
                iconStyle={styles.notificationIcon}
              />
            </View>

            <View style={styles.topThreeContainer}>
              <Image
                source={Images["leaderboardHeader"]}
                style={styles.leaderboardHeaderImage}
                contentFit="contain"
                placeholder={Images.placeholder}
              />

              <View style={styles.topProfilesRow}>
                {/* 2nd place - left */}
                <View style={styles.profileColumn}>
                  <View style={styles.smallAvatarContainer}>
                    <Image
                      source={
                        topThree[1]
                          ? (getAvatarSource(topThree[1]) ?? Images.placeholder)
                          : Images.placeholder
                      }
                      placeholder={Images.placeholder}
                      placeholderContentFit="cover"
                      transition={200}
                      style={styles.smallAvatar}
                      contentFit="cover"
                      contentPosition="center"
                    />
                  </View>
                  <Text style={styles.podiumNameLeft} numberOfLines={1}>
                    {topThree[1]?.username}
                  </Text>
                  {topThree[1] != null && (
                    <View style={styles.podiumStreakLeft}>
                      <Text style={styles.podiumScore}>
                        {topThree[1]?.current_streak_count}
                      </Text>
                      <MaterialCommunityIcons
                        name="fire"
                        size={16}
                        color="#FF6B35"
                      />
                    </View>
                  )}
                </View>

                {/* 1st place - center */}
                <View style={styles.profileColumnCenter}>
                  <Image
                    source={Images.crown}
                    style={styles.crown}
                    contentFit="contain"
                  />
                  <View style={styles.largeAvatarContainer}>
                    <Image
                      source={
                        topThree[0]
                          ? (getAvatarSource(topThree[0]) ?? Images.placeholder)
                          : Images.placeholder
                      }
                      placeholder={Images.placeholder}
                      placeholderContentFit="cover"
                      transition={200}
                      style={styles.largeAvatar}
                      contentFit="cover"
                      contentPosition="center"
                    />
                  </View>
                  <Text style={styles.firstName} numberOfLines={1}>
                    {topThree[0]?.username}
                  </Text>
                  {topThree[0] != null && (
                    <View style={styles.podiumStreakCenter}>
                      <Text style={styles.firstScore}>
                        {topThree[0]?.current_streak_count}
                      </Text>
                      <MaterialCommunityIcons
                        name="fire"
                        size={16}
                        color="#FF6B35"
                      />
                    </View>
                  )}
                </View>

                {/* 3rd place - right */}
                <View style={styles.profileColumn}>
                  <View style={styles.smallAvatarContainer2}>
                    <Image
                      source={
                        topThree[2]
                          ? (getAvatarSource(topThree[2]) ?? Images.placeholder)
                          : Images.placeholder
                      }
                      placeholder={Images.placeholder}
                      placeholderContentFit="cover"
                      transition={200}
                      style={styles.smallAvatar}
                      contentFit="cover"
                      contentPosition="center"
                    />
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {topThree[2]?.username}
                  </Text>
                  {topThree[2] != null && (
                    <View style={styles.podiumStreak}>
                      <Text style={styles.podiumScore}>
                        {topThree[2]?.current_streak_count}
                      </Text>
                      <MaterialCommunityIcons
                        name="fire"
                        size={16}
                        color="#FF6B35"
                      />
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* TOGGLE */}
            <View style={styles.toggleContainer}>
              <TruSubscriptionToggle
                selected={leaderboardType === "child" ? "monthly" : "lifetime"}
                onSelect={(type: SubscriptionType) => {
                  if (type === "monthly") {
                    setLeaderboardType("child");
                    fetchLeaderboard("child");
                  } else {
                    setLeaderboardType("parent");
                    fetchLeaderboard("parent");
                  }
                }}
                monthlyLabel="Child"
                lifetimeLabel="Parent"
              />
            </View>
          </View>

          {/* RANK HEADER */}
          <View style={styles.rankHeader}>
            <Text style={styles.rankLabel}>RANK</Text>
            <Text style={styles.rankLabel}>SCORE</Text>
          </View>
          <View style={styles.rankDivider} />

          {/* LIST */}
          {error ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <FlatList
              data={listData}
              renderItem={renderItem}
              keyExtractor={(item, index) =>
                `${item.user_id}-${item.rank}-${index}`
              }
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Sticky current user bar at bottom when current_user exists (rank >= 4); animates out when row scrolls into view; area unmounts after hide so no gap */}
      {currentUser && currentUser.rank >= 4 && stickyAreaVisible
        ? (() => {
            const user = currentUser;
            return (
              <Animated.View
                style={[
                  styles.stickyCurrentUserWrap,
                  {
                    opacity: stickyOpacity,
                    transform: [{ translateY: stickyTranslateY }],
                  },
                ]}
                pointerEvents={showSticky ? "auto" : "none"}
              >
                <View style={[styles.row, styles.stickyCurrentUserRow]}>
                  <Text style={[styles.rank, styles.stickyCurrentUserText]}>
                    {user.rank}
                  </Text>
                  <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                      <Image
                        source={getAvatarSource(user) ?? Images.placeholder}
                        placeholder={Images.placeholder}
                        placeholderContentFit="cover"
                        transition={200}
                        style={styles.avatar}
                        contentFit="cover"
                        contentPosition="center"
                      />
                    </View>
                    <Text style={[styles.name, styles.stickyCurrentUserText]}>
                      {user.username}
                    </Text>
                  </View>
                  <View style={styles.streakContainer}>
                    <Text style={[styles.streak, styles.stickyCurrentUserText]}>
                      {user.current_streak_count}
                    </Text>
                    <MaterialCommunityIcons
                      name="fire"
                      size={20}
                      color="#FF6B35"
                    />
                  </View>
                </View>
              </Animated.View>
            );
          })()
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.homeBackground,
  },
  title: {
    fontSize: 32,
    fontFamily: FontFamilies.butlerBold,
    color: Colors.naturalBlack,
    letterSpacing: -0.5,
  },
  notificationBadge: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationIcon: {
    width: 48,
    height: 48,
    marginRight: 15,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  scrollContentInner: {
    flexGrow: 1,
  },
  topThreeContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: 260,
    position: "relative",
  },
  leaderboardHeaderImage: {
    width: SCREEN_WIDTH,
    height: 260,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  topProfilesRow: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    alignItems: "flex-end",
    zIndex: 10,
  },
  profileColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: 0,
    marginBottom: 20,
  },
  profileColumnCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 25,
    minWidth: 0,
  },
  crown: {
    position: "absolute",
    top: -30,
    alignSelf: "center",
    zIndex: 10,
    width: 40,
    height: 40,
  },
  largeAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.naturalBlack,
    marginBottom: 24,
    backgroundColor: Colors.textFieldBackground,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  largeAvatar: {
    width: "100%",
    height: "100%",
    alignSelf: "center",
  },
  smallAvatarContainer: {
    width: 60,
    height: 60,
    marginRight: 50,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.naturalBlack,
    marginBottom: 5,
    backgroundColor: Colors.textFieldBackground,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  smallAvatarContainer2: {
    width: 60,
    height: 60,
    marginLeft: 50,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.naturalBlack,
    marginBottom: 5,
    backgroundColor: Colors.textFieldBackground,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  smallAvatar: {
    width: "100%",
    height: "100%",
    alignSelf: "center",
  },
  firstName: {
    fontSize: 10,
    fontFamily: FontFamilies.ownersBold,
    color: Colors.naturalBlack,
    textAlign: "center",
  },
  firstScore: {
    fontSize: 16,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.naturalBlack,
  },
  podiumName: {
    fontSize: 10,
    fontFamily: FontFamilies.ownersBold,
    color: Colors.naturalBlack,
    textAlign: "center",
    marginLeft: 40,
  },
  podiumNameLeft: {
    fontSize: 10,
    fontFamily: FontFamilies.ownersBold,
    color: Colors.naturalBlack,
    textAlign: "center",
    marginRight: 40,
  },
  podiumScore: {
    fontSize: 16,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.naturalBlack,
  },
  podiumStreak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 40,
  },
  podiumStreakLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 40,
  },
  podiumStreakCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  toggleContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.textFieldPlaceholder,
  },
  rankHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginTop: 12,
  },
  rankDivider: {
    height: 1,
    backgroundColor: Colors.textFieldPlaceholder + "40",
    marginHorizontal: 24,
    marginVertical: 16,
  },
  rankLabel: {
    fontSize: 12,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.naturalBlack,
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.textFieldBackground,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    marginHorizontal: 24,
    justifyContent: "space-between",
  },
  currentUserRow: {
    backgroundColor: Colors.homeTooltipBg,
  },
  stickyCurrentUserWrap: {
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: Colors.onboardingBackground,
  },
  stickyCurrentUserRow: {
    backgroundColor: Colors.homeTooltipBg,
    marginBottom: 0,
  },
  stickyCurrentUserText: {
    color: Colors.naturalBlack,
  },
  rank: {
    width: 32,
    fontSize: 24,
    fontFamily: FontFamilies.butlerBold,
    color: Colors.naturalBlack,
  },
  currentUserText: {
    color: "#FFFFFF",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.naturalBlack,
    marginRight: 12,
    backgroundColor: Colors.textFieldBackground,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  name: {
    fontSize: 16,
    fontFamily: FontFamilies.ownersMedium,
    color: Colors.naturalBlack,
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  streak: {
    fontSize: 18,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.naturalBlack,
  },
  header: {
    // flexDirection: "row",
    // alignItems: "center",
    // justifyContent: "space-between",
    // paddingHorizontal: 24,
    // marginTop: 75,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 75,
    marginBottom: 20,
    marginHorizontal: 15,
  },
  notificationButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
