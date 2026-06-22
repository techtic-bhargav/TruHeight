import { getCmsPageBySlug, type CmsPageData } from "@/api/endpoints/cms";
import { ToastService } from "@/components/toast";
import { FontFamilies } from "@/constants/fonts";
import { Images } from "@/constants/images";
import { Colors } from "@/constants/theme";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const SLUG_BY_TYPE: Record<string, string> = {
  terms: "terms-and-conditions",
  privacy: "privacy-policy",
};

const DEFAULT_TITLE_BY_TYPE: Record<string, string> = {
  terms: "Terms and Conditions",
  privacy: "Privacy Policy",
};

function wrapHtmlContent(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    body { margin: 0; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body>${content || "<p>No content available.</p>"}</body>
</html>`;
}

export default function CmsWebViewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string }>();
  const type = params.type === "privacy" ? "privacy" : "terms";
  const slug = SLUG_BY_TYPE[type] ?? "terms-and-conditions";
  const defaultTitle = DEFAULT_TITLE_BY_TYPE[type] ?? "Terms and Conditions";

  const [page, setPage] = useState<CmsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchPage = useCallback(async () => {
    setLoadError(false);
    setLoading(true);
    try {
      const response = await getCmsPageBySlug(slug);
      if (response?.status === "success" && response?.data) {
        setPage(response.data);
      } else {
        setLoadError(true);
      }
    } catch {
      setLoadError(true);
      ToastService.showError("Failed to load page.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const handleRetry = () => {
    fetchPage();
  };

  const title = page?.title ?? defaultTitle;
  const htmlSource = page?.content
    ? { html: wrapHtmlContent(page.content) }
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Image
            source={Images.back}
            style={styles.backIcon}
            contentFit="contain"
          />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.backBtnSpacer} />
      </View>
      <View style={styles.webviewWrap}>
        {loading && !page ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.onboardingButton} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Unable to load this page.</Text>
            <Text style={styles.errorSubtext}>
              Please check your connection and try again.
            </Text>
            <Pressable onPress={handleRetry} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : htmlSource ? (
          <WebView
            source={htmlSource}
            style={styles.webview}
            originWhitelist={["*"]}
            scrollEnabled
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No content available.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.onboardingBackground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  backBtnSpacer: {
    width: 36,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.naturalBlack,
    textAlign: "center",
  },
  webviewWrap: {
    flex: 1,
    position: "relative",
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.onboardingBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.onboardingBackground,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.textFieldPlaceholder,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.onboardingBackground,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: FontFamilies.ownersBold,
    color: Colors.naturalBlack,
    textAlign: "center",
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: FontFamilies.ownersRegular,
    color: Colors.textFieldPlaceholder,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.onboardingButton,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 16,
    fontFamily: FontFamilies.ownersBold,
    color: "#FFFFFF",
  },
});
