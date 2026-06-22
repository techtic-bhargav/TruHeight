import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoaderOverlay } from '@/components/loader';
import { NoConnectionOverlay } from '@/components/NoConnectionOverlay';
import { NotificationSetup } from '@/components/NotificationSetup';
import { ToastOverlay } from '@/components/toast';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { useColorScheme } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// On Android, fonts are embedded via expo-font config plugin (res/font + ReactFontManager).
// useFonts() is only used on iOS and web to avoid Android asset-name vs fontFamily mismatch.
const fontMap = Platform.select({
  android: {},
  default: {
    'Butler-Black': require('@/assets/fonts/Butler_Black.otf'),
    'Butler-ExtraBold': require('@/assets/fonts/Butler_ExtraBold.otf'),
    'Butler-Bold': require('@/assets/fonts/Butler_Bold.otf'),
    'Butler-Medium': require('@/assets/fonts/Butler_Medium.otf'),
    'Butler-Regular': require('@/assets/fonts/Butler_Regular.otf'),
    'Butler-Light': require('@/assets/fonts/Butler_Light.otf'),
    'Butler-UltraLight': require('@/assets/fonts/Butler_Ultra_Light.otf'),
    'OwnersText-Black': require('@/assets/fonts/OwnersText-Black.ttf'),
    'OwnersText-BlackItalic': require('@/assets/fonts/OwnersText-BlackItalic.ttf'),
    'OwnersText-Bold': require('@/assets/fonts/OwnersText-Bold.ttf'),
    'OwnersText-BoldItalic': require('@/assets/fonts/OwnersText-BoldItalic.ttf'),
    'OwnersText-Medium': require('@/assets/fonts/OwnersText-Medium.ttf'),
    'OwnersText-MediumItalic': require('@/assets/fonts/OwnersText-MediumItalic.ttf'),
    'OwnersText-Regular': require('@/assets/fonts/OwnersText-Regular.ttf'),
    'OwnersText-RegularItalic': require('@/assets/fonts/OwnersText-RegularItalic.ttf'),
    'OwnersText-Light': require('@/assets/fonts/OwnersText-Light.ttf'),
    'OwnersText-LightItalic': require('@/assets/fonts/OwnersText-LightItalic.ttf'),
    'OwnersText-XLight': require('@/assets/fonts/OwnersText-XLight.ttf'),
    'OwnersText-XLightItalic': require('@/assets/fonts/OwnersText-XLightItalic.ttf'),
  },
});

export const unstable_settings = {
  anchor: 'onboarding',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts(fontMap);

  // Android: hide status bar while splash is visible
  useEffect(() => {
    if (Platform.OS === 'android') {
      RNStatusBar.setHidden(true, 'none');
    }
    return () => {
      if (Platform.OS === 'android') {
        RNStatusBar.setHidden(false, 'none');
      }
    };
  }, []);

  useEffect(() => {
    // Enable edge-to-edge mode
    SystemUI.setBackgroundColorAsync('#00000000');

    if (fontsLoaded) {
      // Android: at least 3s splash. iOS: keep 3.5s (fonts load fast, causes blink)
      const minSplashTime = Platform.OS === 'android' ? 3000 : 3500;
      const timer = setTimeout(() => {
        if (Platform.OS === 'android') {
          RNStatusBar.setHidden(false, 'none');
        }
        SplashScreen.hideAsync();
      }, minSplashTime);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <ProfileProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <NotificationSetup />
              <LoaderOverlay />
              <NoConnectionOverlay />
              <ToastOverlay />
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  animationDuration: 300,
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="login" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="(routine)/creatingRoutine"
                  options={{ gestureEnabled: false }}
                />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                <Stack.Screen name="cmswebview" />
              </Stack>
              <StatusBar
                style="dark"
                hidden={false}
                translucent={Platform.OS !== 'android'}
              />
            </ThemeProvider>
          </ProfileProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
