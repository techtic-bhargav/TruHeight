import { userSignup } from "@/api/endpoints/auth";
import { LoaderService } from "@/components/loader";
import { ToastService } from "@/components/toast";
import { TruHeightButton } from "@/components/tru-height-button";
import { TruHeightTextField } from "@/components/tru-height-text-field";
import { FontFamilies } from "@/constants/fonts";
import { Images } from "@/constants/images";
import { Colors } from "@/constants/theme";
import { getPushTokenForBackend } from "@/services/pushTokenService";
import { getDeviceType, getOrCreateDeviceId } from "@/utils/deviceId";
import { validateCreateAccountForm } from "@/utils/validations";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const SUCCESS_TOAST_DURATION_MS = 2000;

export default function CreateAccountScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [confirmAge, setConfirmAge] = useState(false);
  const [acknowledgeEducational, setAcknowledgeEducational] = useState(false);

  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    acceptTerms?: string;
    confirmAge?: string;
    acknowledgeEducational?: string;
  }>({});

  const lastNameRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const canGoBack = useMemo(() => true, []);

  const handleBack = () => {
    if (canGoBack) {
      router.back();
      return;
    }
    router.replace("/login");
  };

  const clearApiError = () => {
    if (apiError) setApiError(null);
  };

  const handleCreateAccount = async () => {
    setApiError(null);
    const result = validateCreateAccountForm({
      firstName,
      lastName,
      username,
      email,
      password,
      confirmPassword,
      acceptTerms,
      confirmAge,
      acknowledgeEducational,
    });

    setErrors(result.errors);
    if (!result.isValid) return;

    setIsSubmitting(true);
    try {
      LoaderService.show();
      const deviceId = await getOrCreateDeviceId();
      const pushToken = await getPushTokenForBackend();
      const response = await userSignup({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
        terms_and_conditions_accepted: acceptTerms,
        educational_use_only: acknowledgeEducational,
        device_token: pushToken || "",
        device_type: getDeviceType(),
        device_id: deviceId,
      });

      const isSuccess =
        response?.success === true || response?.status === "success";
      if (isSuccess) {
        setIsSubmitting(false);
        setSuccessMessage("Account created successfully!");
        setTimeout(() => {
          setSuccessMessage(null);
          router.push({
            pathname: "/verifyemail",
            params: { email: email.trim() },
          });
        }, SUCCESS_TOAST_DURATION_MS);
        return;
      }

      // API validation: show in toast only, not field validation
      const msg = response?.message ?? response?.error;
      ToastService.showError(
        msg
          ? Array.isArray(msg)
            ? msg.join(", ")
            : msg
          : "Something went wrong. Please try again.",
      );
    } catch {
      // Toast already shown by API interceptor
    } finally {
      LoaderService.hide();
      setIsSubmitting(false);
    }
  };

  // Clear checkbox errors when toggled
  const handleAcceptTermsToggle = () => {
    setAcceptTerms((v) => !v);
    if (errors.acceptTerms) {
      setErrors({ ...errors, acceptTerms: undefined });
    }
  };

  const handleConfirmAgeToggle = () => {
    setConfirmAge((v) => !v);
    if (errors.confirmAge) {
      setErrors({ ...errors, confirmAge: undefined });
    }
  };

  const handleAcknowledgeEducationalToggle = () => {
    setAcknowledgeEducational((v) => !v);
    if (errors.acknowledgeEducational) {
      setErrors({ ...errors, acknowledgeEducational: undefined });
    }
  };

  // No leading space; first/last name: only single space allowed (collapse multiple). Same validation behavior as login.
  const handleFirstNameChange = (text: string) => {
    const normalized = text.replace(/^\s+/, "").replace(/\s+/g, " ");
    setFirstName(normalized);
    clearApiError();
    if (errors.firstName) setErrors((e) => ({ ...e, firstName: undefined }));
  };

  const handleLastNameChange = (text: string) => {
    const normalized = text.replace(/^\s+/, "").replace(/\s+/g, " ");
    setLastName(normalized);
    clearApiError();
    if (errors.lastName) setErrors((e) => ({ ...e, lastName: undefined }));
  };

  const handleUsernameChange = (text: string) => {
    const trimmed = text.replace(/^\s+/, "");
    setUsername(trimmed);
    clearApiError();
    if (errors.username) setErrors((e) => ({ ...e, username: undefined }));
  };

  const handleEmailChange = (text: string) => {
    const trimmed = text.replace(/^\s+/, "");
    setEmail(trimmed);
    clearApiError();
    if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
  };

  const handlePasswordChange = (text: string) => {
    const trimmed = text.replace(/^\s+/, "");
    setPassword(trimmed);
    clearApiError();
    if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
    if (errors.confirmPassword && trimmed === confirmPassword) {
      setErrors((e) => ({ ...e, confirmPassword: undefined }));
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    const trimmed = text.replace(/^\s+/, "");
    setConfirmPassword(trimmed);
    clearApiError();
    if (errors.confirmPassword)
      setErrors((e) => ({ ...e, confirmPassword: undefined }));
  };

  const handleNavigateToSignIn = () => {
    router.replace("/login");
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
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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

          <View style={styles.header}>
            <Text style={[styles.title, { color: Colors.naturalBlack }]}>
              Create Account
            </Text>

            <View style={styles.subtitleRow}>
              <Text
                style={[styles.subtitle, { color: stylesVars.textSecondary }]}
              >
                Already have an account?{" "}
              </Text>
              <Pressable
                onPress={handleNavigateToSignIn}
                accessibilityRole="link"
                style={({ pressed }) => [
                  styles.linkPressable,
                  { opacity: pressed ? 1 : 1 },
                ]}
              >
                <Text style={[styles.link, { color: Colors.naturalBlack }]}>
                  Sign In
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.rowField}>
                <TruHeightTextField
                  label="First Name"
                  value={firstName}
                  onChangeText={handleFirstNameChange}
                  placeholder="First name"
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                  error={errors.firstName}
                />
              </View>
              <View style={styles.rowField}>
                <TruHeightTextField
                  ref={lastNameRef}
                  label="Last Name"
                  value={lastName}
                  onChangeText={handleLastNameChange}
                  placeholder="Last name"
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => usernameRef.current?.focus()}
                  error={errors.lastName}
                />
              </View>
            </View>

            <View style={styles.fieldSpacing}>
              <TruHeightTextField
                ref={usernameRef}
                label="Username"
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="Username"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                error={errors.username}
              />
            </View>

            <View style={styles.fieldSpacing}>
              <TruHeightTextField
                ref={emailRef}
                label="Email address"
                value={email}
                onChangeText={handleEmailChange}
                placeholder="Email address"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                inputMode="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                error={errors.email}
              />
            </View>

            <View style={styles.fieldSpacing}>
              <TruHeightTextField
                ref={passwordRef}
                label="Password"
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Password"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="none"
                secureTextEntry
                secureToggle
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                error={errors.password}
              />
            </View>

            <View style={styles.fieldSpacing}>
              <TruHeightTextField
                ref={confirmPasswordRef}
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                placeholder="Confirm Password"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="none"
                secureTextEntry
                secureToggle
                returnKeyType="done"
                error={errors.confirmPassword}
              />
            </View>

            <View style={styles.checklist}>
              <View>
                <CheckboxRow
                  checked={acceptTerms}
                  onToggle={handleAcceptTermsToggle}
                  label={
                    <Text
                      style={[
                        styles.checkboxLabel,
                        { color: Colors.naturalBlack },
                      ]}
                    >
                      I accept the{" "}
                      <Text
                        style={[
                          styles.checkboxLabel,
                          styles.checkboxLink,
                          { color: Colors.naturalBlack },
                        ]}
                        accessibilityRole="link"
                        onPress={() =>
                          router.push({
                            pathname: "/cmswebview",
                            params: { type: "terms" },
                          })
                        }
                        suppressHighlighting
                      >
                        Terms of Service
                      </Text>{" "}
                      and{" "}
                      <Text
                        style={[
                          styles.checkboxLabel,
                          styles.checkboxLink,
                          { color: Colors.naturalBlack },
                        ]}
                        accessibilityRole="link"
                        onPress={() =>
                          router.push({
                            pathname: "/cmswebview",
                            params: { type: "privacy" },
                          })
                        }
                        suppressHighlighting
                      >
                        Privacy Policy
                      </Text>
                      .
                    </Text>
                  }
                />
                {errors.acceptTerms && (
                  <Text style={styles.checkboxError}>{errors.acceptTerms}</Text>
                )}
              </View>
              <View>
                <CheckboxRow
                  checked={confirmAge}
                  onToggle={handleConfirmAgeToggle}
                  label="I confirm that I am 13+ years old."
                />
                {errors.confirmAge && (
                  <Text style={styles.checkboxError}>{errors.confirmAge}</Text>
                )}
              </View>
              <View>
                <CheckboxRow
                  checked={acknowledgeEducational}
                  onToggle={handleAcknowledgeEducationalToggle}
                  label="This app is for educational use, not medical advice."
                />
                {errors.acknowledgeEducational && (
                  <Text style={styles.checkboxError}>
                    {errors.acknowledgeEducational}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.buttonWrap}>
              <TruHeightButton
                onPress={handleCreateAccount}
                title={isSubmitting ? "Creating account…" : "Create Account"}
                disabled={isSubmitting}
              />
            </View>

            <Pressable
              accessibilityRole="link"
              onPress={handleNavigateToSignIn}
              style={styles.footerLinkWrap}
            >
              <Text
                style={[styles.footerLinkText, { color: Colors.naturalBlack }]}
              >
                TruHeight subscribers automatically enjoy{" "}
                <Text style={styles.footerLinkText}>
                  premium access to the app.
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

type CheckboxRowProps = {
  checked: boolean;
  onToggle: () => void;
  label: string | React.ReactNode;
};

function CheckboxRow({ checked, onToggle, label }: CheckboxRowProps) {
  const isCustomLabel = typeof label !== "string";
  return (
    <Pressable
      style={styles.checkboxRow}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      hitSlop={6}
    >
      <Image
        source={checked ? Images.check : Images.uncheck}
        style={styles.checkboxIcon}
        contentFit="contain"
      />
      {isCustomLabel ? (
        <View style={styles.checkboxLabelWrap}>{label}</View>
      ) : (
        <Text style={[styles.checkboxLabel, { color: Colors.naturalBlack }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const stylesVars = {
  textPrimary: "#2C2C2C",
  textSecondary: "#8C867F",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 56 : 42,
    paddingBottom: 60,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    marginBottom: 10,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  header: {
    paddingTop: 6,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontFamily: FontFamilies.butlerBold,
  },
  subtitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FontFamilies.ownersRegular,
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
  row: {
    flexDirection: "row",
    columnGap: 12,
  },
  rowField: {
    flex: 1,
  },
  fieldSpacing: {
    marginTop: 14,
  },
  successWrap: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(25, 135, 84, 0.15)",
    borderRadius: 8,
  },
  successText: {
    fontSize: 14,
    fontFamily: FontFamilies.ownersRegular,
    color: "#198754",
  },
  apiErrorWrap: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(220, 53, 69, 0.12)",
    borderRadius: 8,
  },
  apiErrorText: {
    fontSize: 14,
    fontFamily: FontFamilies.ownersRegular,
    color: "#DC3545",
  },
  checklist: {
    marginTop: 18,
    rowGap: 10,
  },
  checkboxError: {
    marginTop: 4,
    marginLeft: 24,
    fontSize: 12,
    fontFamily: FontFamilies.ownersRegular,
    color: "#DC3545", // Red color for errors
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkboxLabelWrap: {
    flex: 1,
  },
  checkboxLink: {
    textDecorationLine: "underline",
  },
  checkboxIcon: {
    width: 14,
    height: 14,
    marginTop: 1,
    marginRight: 10,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: FontFamilies.ownersRegular,
  },
  buttonWrap: {
    marginTop: 24,
  },
  footerLinkWrap: {
    marginTop: 18,
  },
  footerLinkText: {
    fontSize: 16,
    lineHeight: 18,
    textAlign: "center",
    fontFamily: FontFamilies.ownersRegular,
    textDecorationLine: "underline",
  },
});
