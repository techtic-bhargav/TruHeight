import { TruHeightButton } from "@/components/tru-height-button";
import { FontFamilies } from "@/constants/fonts";
import { Images } from "@/constants/images";
import { Colors } from "@/constants/theme";
import firebaseMessagingService from "@/services/firebaseMessaging";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const onboardingData = [
  {
    gif: Images.onboardingScreen2,
    title: "Track Height & Weight",
    description:
      "Easily measure and record your child's growth with our intuitive measurement tools.",
  },
  {
    gif: Images.onboardingScreen3,
    title: "Build Healthy Habits",
    description:
      "Track daily supplements, sleep, nutrition, and activity to support growth.",
  },
  {
    gif: Images.onboardingScreen1,
    title: "Visualize Progress",
    description:
      "See growth trends with charts comparing to CDC percentile standards.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const backgroundColor = Colors.onboardingBackground;
  const textColor = Colors.onboardingText;
  const secondaryTextColor = "#464543";
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    setCurrentPage(page);
  };

  const handleLogin = () => {
    router.replace("/login");
  };

  useEffect(() => {
    getDeviceToken()
  }, [])

  const getDeviceToken = async () => {
    const deviceToken = await firebaseMessagingService.getFCMToken();
    console.log('deviceToken', deviceToken);
  }
  

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar style="dark" />

      {/* Horizontal ScrollView for pages */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      >
        {onboardingData.map((item, index) => (
          <View key={index} style={styles.pageContainer}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Main Illustration Area: screen GIF */}
              <View style={styles.illustrationContainer}>
                <View style={styles.illustrationPlaceholder}>
                  <Image
                    source={item.gif}
                    style={styles.illustrationImage}
                    contentFit="contain"
                  />
                </View>
              </View>

              {/* Title */}
              <Text
                style={[
                  styles.title,
                  {
                    color: textColor,
                  },
                ]}
              >
                {item.title}
              </Text>

              {/* Description */}
              <Text
                style={[
                  styles.description,
                  {
                    color: secondaryTextColor,
                    fontFamily: FontFamilies.ownersRegular,
                  },
                ]}
              >
                {item.description}
              </Text>
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots - Fixed Position */}
      <View style={styles.paginationContainer}>
        <View style={styles.pagination}>
          {onboardingData.map((_, dotIndex) => (
            <View
              key={dotIndex}
              style={[
                styles.dot,
                dotIndex === currentPage && styles.dotActive,
                {
                  backgroundColor:
                    dotIndex === currentPage
                      ? Colors.onboardingDotActive
                      : Colors.onboardingDot,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Fixed Bottom Section with Button */}
      <View style={[styles.bottomSection, { backgroundColor }]}>
        <TruHeightButton
          onPress={() => router.push("/createaccount")}
          title={"Let's Start"}
        />
        <Pressable
          onPress={handleLogin}
          accessibilityRole="link"
          style={({ pressed }) => [
            { opacity: pressed ? 1 : 1 },
            Platform.OS === "android" && { marginBottom: 30 },
          ]}
        >
          <Text
            style={[
              styles.loginLink,
              {
                color: secondaryTextColor,
                fontFamily: FontFamilies.ownersRegular,
              },
            ]}
          >
            Already have an account?
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageContainer: {
    width: width,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 180, // Space for fixed bottom section
  },
  illustrationContainer: {
    height: height * 0.45,
    marginVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    marginTop: 50,
  },
  illustrationPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  illustrationImage: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 20,
    fontFamily: FontFamilies.butlerBold,
  },
  description: {
    fontSize: 18,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 40,
  },
  paginationContainer: {
    position: "absolute",
    bottom: 180,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    alignItems: "center",
    gap: 16,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 10,
  },
});
