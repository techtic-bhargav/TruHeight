import { userLogin } from "@/api/endpoints/auth";
import { LoaderService } from "@/components/loader";
import { ToastService } from "@/components/toast";
import { TruHeightButton } from "@/components/tru-height-button";
import { TruHeightTextField } from "@/components/tru-height-text-field";
import { FontFamilies } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import { getPushTokenForBackend } from "@/services/pushTokenService";
import { setAuthToken } from "@/services/tokenManager";
import { useUserStore } from "@/store";
import { getDeviceType, getOrCreateDeviceId } from "@/utils/deviceId";
import { validateSignInForm } from "@/utils/validations";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const handleSignIn = async () => {
    const result = validateSignInForm(email, password);
    setErrors(result.errors);
    if (!result.isValid) return;

    Keyboard.dismiss();

    let didNavigate = false;
    try {
      LoaderService.show();
      const deviceId = await getOrCreateDeviceId();
      const pushToken = await getPushTokenForBackend();
      console.log("pushToken", pushToken);
      const response = await userLogin({
        email: email.trim(),
        password,
        device_token: pushToken || "",
        device_type: getDeviceType(),
        device_id: deviceId,
      });
      console.log("response", response?.data);

      const isSuccess =
        response?.success === true || response?.status === "success";
      if (isSuccess) {
        const data = response?.data;
        const token =
          data?.token ?? data?.access_token ?? data?.data?.access_token;
        const user = data?.user ?? data?.data?.user;
        const isEmailVerified = user?.is_email_verified ?? true;
        const isOnboardingComplete = user?.is_onboarding_complete ?? true;

        if (token) await setAuthToken(token);
        useUserStore
          .getState()
          .setUser({ ...(user ?? {}), token: token ?? null });
        useUserStore.getState().setIsAuthenticated(true);
        ToastService.showSuccess("Login successful!");

        if (!isEmailVerified) {
          didNavigate = true;
          router.replace({
            pathname: "/verifyemail",
            params: { email: user?.email ?? email.trim() },
          });
          setTimeout(() => LoaderService.hide(), 400);
          return;
        }
        if (!isOnboardingComplete) {
          didNavigate = true;
          router.replace({
            pathname: "/chooseprofile",
            params: { noBack: "1" },
          });
          setTimeout(() => LoaderService.hide(), 400);
          return;
        }
        didNavigate = true;
        router.replace("/(tabs)");
        setTimeout(() => LoaderService.hide(), 400);
        return;
      }

      // API validation: show in toast only, not field validation
      const msg = response?.message ?? response?.error;
      ToastService.showError(
        msg
          ? Array.isArray(msg)
            ? msg.join(", ")
            : msg
          : "Sign in failed. Please try again.",
      );
    } catch {
      // Toast already shown by API interceptor
    } finally {
      if (!didNavigate) LoaderService.hide();
    }
  };

  // Clear errors when user starts typing; disallow leading blank space
  const handleEmailChange = (text: string) => {
    const trimmed = text.replace(/^\s+/, "");
    setEmail(trimmed);
    if (errors.email) {
      setErrors({ ...errors, email: undefined });
    }
  };

  const handlePasswordChange = (text: string) => {
    const trimmed = text.replace(/^\s+/, "");
    setPassword(trimmed);
    if (errors.password) {
      setErrors({ ...errors, password: undefined });
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors.onboardingBackground },
      ]}
    >
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: Colors.naturalBlack }]}>
              Sign in to Tru{""}
            </Text>
            <Text style={[styles.title, { color: Colors.brandText }]}>
              Height
            </Text>
            <Text style={[styles.registeredMark, { color: Colors.brandText }]}>
              ®
            </Text>
          </View>

          <View style={styles.subtitleRow}>
            <Text
              style={[
                styles.subtitle,
                styles.subtitleInline,
                { color: Colors.textFieldPlaceholder },
              ]}
            >
              New user?{" "}
            </Text>
            <Pressable
              onPress={() => router.push("/createaccount")}
              accessibilityRole="link"
              style={({ pressed }) => [
                styles.linkPressable,
                { opacity: pressed ? 1 : 1 },
              ]}
            >
              <Text style={[styles.link, { color: Colors.naturalBlack }]}>
                Create account
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.form}>
          <TruHeightTextField
            label="Email address"
            value={email}
            onChangeText={handleEmailChange}
            placeholder="Email address"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            inputMode="email"
            error={errors.email}
          />

          <View style={styles.passwordField}>
            <TruHeightTextField
              label="Password"
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="Password"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              secureTextEntry
              secureToggle
              error={errors.password}
            />
          </View>

          <Pressable
            accessibilityRole="link"
            onPress={() => router.push("/(auth)/forgotpassword")}
            style={({ pressed }) => [
              styles.forgotWrap,
              { opacity: pressed ? 1 : 1 },
            ]}
          >
            <Text style={[styles.forgot, { color: Colors.naturalBlack }]}>
              Forgot Password?
            </Text>
          </Pressable>

          <TruHeightButton onPress={handleSignIn} title={"Sign In"} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 56 : 42,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  registeredMark: {
    fontSize: 12,
    fontFamily: FontFamilies.butlerBold,
    lineHeight: 18,
    marginLeft: 2,
    marginTop: -2,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 18,
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontFamily: FontFamilies.butlerBold,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: FontFamilies.ownersRegular,
  },
  subtitleRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  subtitleInline: {
    marginTop: 0,
  },
  linkPressable: {},
  link: {
    textDecorationLine: "underline",
    fontSize: 16,
    fontFamily: FontFamilies.ownersRegular,
  },
  form: {
    marginTop: 8,
  },
  passwordField: {
    marginTop: 14,
  },
  forgotWrap: {
    alignSelf: "flex-end",
    paddingVertical: 10,
    paddingHorizontal: 2,
    marginTop: 4,
  },
  forgot: {
    fontSize: 16,
    textDecorationLine: "underline",
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.naturalBlack,
    marginBottom: 16,
  },
});
