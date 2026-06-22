/**
 * IAP service – subscription init, products, purchase, restore.
 * Uses react-native-iap; frontend-only (no payment processing).
 */
import { SUBSCRIPTION_PRODUCT_IDS } from "@/constants/iap";
import { Platform } from "react-native";
import {
  getAvailablePurchases as getAvailablePurchasesFromStore,
  getSubscriptions,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestSubscription,
} from "react-native-iap";

export type SubscriptionStatus =
  | "Active"
  | "Expired"
  | "Cancelled"
  | "Free";

export interface SubscriptionStatusData {
  status: SubscriptionStatus;
  planType?: "monthly" | "yearly";
  accessLevel: "Free" | "Premium";
  startDate?: string;
  nextRenewalDate?: string;
  source?: "TruHeight" | "App Store";
  productId?: string;
}

export interface IAPPlan {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  billingPeriod: "monthly" | "yearly";
}

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  transactionId?: string;
  receipt?: string;
  purchaseToken?: string;
  transactionDate?: number;
  error?: string;
}

/** Android verify-purchase request shape (for logging / backend) */
export interface AndroidVerifyPurchaseRequest {
  platform: "android";
  purchase_token: string;
  product_id: string;
  price: string;
  price_currency: string;
}

/** iOS verify-purchase request shape (for logging / backend) */
export interface IOSVerifyPurchaseRequest {
  platform: "ios";
  receipt_data: string;
  product_id: string;
  price: string;
  price_currency: string;
}

/**
 * Build and log verify-purchase request for the respective store (Android/iOS).
 * Use this after a successful purchase to print the payload you would send to a verify-purchase API.
 */
export function logVerifyPurchaseRequest(
  purchaseResult: PurchaseResult,
  currentProductId: string,
  price: string,
  priceCurrency: string,
): void {
  if (Platform.OS === "android") {
    const androidRequest: AndroidVerifyPurchaseRequest = {
      platform: "android",
      purchase_token:
        purchaseResult.purchaseToken || purchaseResult.receipt || "",
      product_id: currentProductId,
      price,
      price_currency: priceCurrency,
    };
    console.log(
      "[IAP] Verify purchase request (Android):",
      JSON.stringify(androidRequest, null, 2),
    );
  } else {
    const iosRequest: IOSVerifyPurchaseRequest = {
      platform: "ios",
      receipt_data:
        purchaseResult.receipt || purchaseResult.purchaseToken || "",
      product_id: currentProductId,
      price,
      price_currency: priceCurrency,
    };
    console.log(
      "[IAP] Verify purchase request (iOS):",
      JSON.stringify(iosRequest, null, 2),
    );
  }
}

type PurchaseResolvers = Map<
  string,
  { resolve: (p: unknown) => void; reject: (e: unknown) => void }
>;

let purchaseUpdateSub: { remove: () => void } | null = null;
let purchaseErrorSub: { remove: () => void } | null = null;
const pendingResolvers: PurchaseResolvers = new Map();

const USER_CANCELLED_IAP_MESSAGE = "__IAP_USER_CANCELLED__";

/** True when the user closed the sheet without paying (not a real failure). */
function isUserCancelledPurchaseError(error: unknown): boolean {
  if (error == null) return false;
  const e = error as Record<string, unknown>;
  const code = e.code;
  if (code === "E_USER_CANCELLED" || code === "USER_CANCELED") return true;
  // iOS StoreKit SKErrorPaymentCancelled = 2
  if (code === 2 || code === "2") return true;
  const responseCode = e.responseCode;
  if (responseCode === 2 || responseCode === "2") return true;
  const msg = String(e.message ?? "");
  if (/skerrordomain\s*error\s*2/i.test(msg)) return true;
  if (/user\s*cancell?ed/i.test(msg)) return true;
  return false;
}

function setupListeners(): void {
  if (purchaseUpdateSub) purchaseUpdateSub.remove();
  if (purchaseErrorSub) purchaseErrorSub.remove();

  purchaseUpdateSub = purchaseUpdatedListener((purchase: any) => {
    const productId =
      purchase?.productId || purchase?.productIdentifier || "";
    const resolver = pendingResolvers.get(productId) || (pendingResolvers.size === 1 ? Array.from(pendingResolvers.values())[0] : null);
    if (resolver) {
      pendingResolvers.delete(productId);
      resolver.resolve(purchase);
    }
  });

  purchaseErrorSub = purchaseErrorListener((error: any) => {
    const msg = isUserCancelledPurchaseError(error)
      ? USER_CANCELLED_IAP_MESSAGE
      : error?.message ||
        (error?.code === "E_USER_CANCELLED" || error?.code === "USER_CANCELED"
          ? "User canceled the purchase"
          : "Purchase failed");
    pendingResolvers.forEach((r, id) => {
      pendingResolvers.delete(id);
      r.reject(new Error(msg));
    });
  });
}

let isInitialized = false;
let initPromise: Promise<boolean> | null = null;

const ANDROID_INIT_RETRY_DELAY_MS = 1500;
const MAX_INIT_ATTEMPTS = Platform.OS === "android" ? 2 : 1;

export async function initialize(): Promise<boolean> {
  if (isInitialized) return true;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    for (let attempt = 1; attempt <= MAX_INIT_ATTEMPTS; attempt++) {
      try {
        const connected = await initConnection();
        if (connected) {
          setupListeners();
          isInitialized = true;
          return true;
        }
        if (Platform.OS === "android" && attempt < MAX_INIT_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, ANDROID_INIT_RETRY_DELAY_MS));
        } else {
          return false;
        }
      } catch (e) {
        console.warn(`IAP init failed (attempt ${attempt}):`, e);
        if (Platform.OS === "android" && attempt < MAX_INIT_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, ANDROID_INIT_RETRY_DELAY_MS));
        } else {
          return false;
        }
      }
    }
    return false;
  })();
  return initPromise;
}

/** User-facing message when IAP is not available (e.g. init failed on Android). */
export function getIAPUnavailableMessage(): string {
  return Platform.OS === "android"
    ? "Purchases aren't available. Install the app from Google Play, ensure you're signed in, and try again."
    : "Purchases aren't available on this device. Please try again.";
}

/**
 * Map known Google Play / store errors to a clear message for the user.
 * "Not configured for billing" = app was not installed from Google Play.
 */
function normalizePurchaseErrorMessage(raw: string | undefined): string {
  if (raw === USER_CANCELLED_IAP_MESSAGE) return "";
  if (!raw) return "Purchase failed. Please try again.";
  if (isUserCancelledPurchaseError({ message: raw })) return "";
  const lower = raw.toLowerCase();
  if (
    lower.includes("not configured for billing") ||
    lower.includes("not configured for google play")
  ) {
    return Platform.OS === "android"
      ? "Subscriptions only work when the app is installed from Google Play. Install from the Play Store (e.g. Internal testing) to use in-app purchases."
      : raw;
  }
  if (lower.includes("item") && lower.includes("could not be found")) {
    return Platform.OS === "android"
      ? "Subscription not available. Install the app from Google Play (Internal testing) and try again."
      : raw;
  }
  return raw;
}

/** Fallback plans when store returns no products (e.g. Android not ready or testing). */
function getFallbackPlans(): IAPPlan[] {
  const [monthlyId, yearlyId] = SUBSCRIPTION_PRODUCT_IDS;
  return [
    {
      productId: monthlyId,
      title: "Monthly",
      description: "Billed every month",
      price: "$9.99",
      currency: "USD",
      billingPeriod: "monthly",
    },
    {
      productId: yearlyId,
      title: "Yearly",
      description: "Billed every year",
      price: "$49.99",
      currency: "USD",
      billingPeriod: "yearly",
    },
  ];
}

export async function getSubscriptionProducts(): Promise<IAPPlan[]> {
  const ok = await initialize();
  if (!ok) return getFallbackPlans();

  try {
    const list = await getSubscriptions({
      skus: [...SUBSCRIPTION_PRODUCT_IDS],
    });
    console.log("list---", list);
    
    if (list?.length) {
      return list.map((sub: any) => {
        const id = sub?.productId || sub?.id || sub?.subscriptionId || "";
        const idLower = id.toLowerCase();
        const billingPeriod: "monthly" | "yearly" =
          idLower.includes("yearly") || idLower.includes("annual")
            ? "yearly"
            : "monthly";
        const price =
          sub?.localizedPrice || sub?.displayPrice || sub?.price || (billingPeriod === "monthly" ? "$9.99/mo" : "$49.99/yr");
        const title = sub?.title || (billingPeriod === "monthly" ? "Monthly" : "Yearly");
        return {
          productId: id,
          title: (title || "").replace(/\s*\([^)]*\)\s*/g, "").trim(),
          description: sub?.description || (billingPeriod === "monthly" ? "Billed every month" : "Billed every year"),
          price: String(price),
          currency: sub?.currency || "USD",
          billingPeriod,
        };
      });
    }
    return getFallbackPlans();
  } catch (e) {
    console.warn("getSubscriptions failed:", e);
    return getFallbackPlans();
  }
}

export async function getAvailablePurchases(): Promise<any[]> {
  const ok = await initialize();
  if (!ok) return [];
  try {
    const purchases = await getAvailablePurchasesFromStore({
      onlyIncludeActiveItems: true,
    });
    return purchases ?? [];
  } catch (e) {
    console.warn("getAvailablePurchases failed:", e);
    return [];
  }
}

export function buildSubscriptionStatus(
  profileSubscription: string | undefined,
  isTruHeightSubscriber: boolean,
  appPurchases: any[],
): SubscriptionStatusData {
  const sub = (profileSubscription || "").toLowerCase();
  const hasAppPurchase = appPurchases.some((p) =>
    SUBSCRIPTION_PRODUCT_IDS.includes(p?.productId as any),
  );

  if (isTruHeightSubscriber && (sub === "premium" || sub === "active" || sub === "truheight")) {
    return {
      status: "Active",
      accessLevel: "Premium",
      source: "TruHeight",
    };
  }

  if (hasAppPurchase && appPurchases.length > 0) {
    const matching = appPurchases.filter((x) =>
      SUBSCRIPTION_PRODUCT_IDS.includes(x?.productId as any),
    );
    // Use most recent purchase (by transactionDate) so upgrade monthly↔yearly shows correct plan
    const sorted = [...matching].sort((a, b) => {
      const tA = a?.transactionDate ?? 0;
      const tB = b?.transactionDate ?? 0;
      return tB - tA;
    });
    const p = sorted[0];
    const productId = p?.productId || "";
    const planType: "monthly" | "yearly" =
      productId.toLowerCase().includes("yearly") ||
      productId.toLowerCase().includes("annual")
        ? "yearly"
        : "monthly";
    const transactionDate = p?.transactionDate;
    const startDate = transactionDate
      ? new Date(transactionDate).toISOString().slice(0, 10)
      : undefined;
    const nextRenewalDate = planType === "monthly"
      ? undefined
      : undefined; // Backend can provide; optional here

    return {
      status: "Active",
      planType,
      accessLevel: "Premium",
      startDate,
      nextRenewalDate,
      source: "App Store",
      productId,
    };
  }

  if (sub === "cancelled" || sub === "canceled") {
    return { status: "Cancelled", accessLevel: "Free" };
  }
  if (sub === "expired") {
    return { status: "Expired", accessLevel: "Free" };
  }

  return { status: "Free", accessLevel: "Free" };
}

/**
 * Android subscription offer: product ID as returned by Play + offer token.
 * Using the store-returned productId avoids "item could not be found" mismatches.
 */
type AndroidOffer = { productId: string; offerToken: string };

/**
 * Get Android subscription offer for a product (required by Google Play Billing).
 * Fetches subscriptions and returns the store's productId and first offer's offerToken.
 */
async function getAndroidSubscriptionOffer(
  productId: string,
): Promise<AndroidOffer | null> {
  try {
    const list = await getSubscriptions({ skus: [...SUBSCRIPTION_PRODUCT_IDS] });
    if (!list?.length) {
      console.warn("getAndroidSubscriptionOffer: no subscriptions returned from Play");
      return null;
    }
    const sub = list.find(
      (s: any) =>
        (s?.productId || s?.id || "").toString() === productId.toString(),
    ) as any;
    if (!sub) {
      console.warn("getAndroidSubscriptionOffer: product not in list", {
        productId,
        available: list.map((s: any) => s?.productId || s?.id),
      });
      return null;
    }
    const details = sub?.subscriptionOfferDetails as Array<{ offerToken?: string }> | undefined;
    const token = details?.[0]?.offerToken;
    const storeProductId = sub?.productId || sub?.id || productId;
    if (!token) {
      console.warn("getAndroidSubscriptionOffer: no offer token", {
        productId: storeProductId,
        hasDetails: !!details,
        detailsLength: details?.length,
      });
      return null;
    }
    return { productId: storeProductId, offerToken: token };
  } catch (e) {
    console.warn("getAndroidSubscriptionOffer failed:", e);
    return null;
  }
}

export async function purchaseSubscription(
  productId: string,
): Promise<PurchaseResult> {
  const ok = await initialize();
  if (!ok) {
    return { success: false, error: getIAPUnavailableMessage() };
  }

  let request: { sku: string } | { subscriptionOffers: Array<{ sku: string; offerToken: string }> };
  if (Platform.OS === "android") {
    const offer = await getAndroidSubscriptionOffer(productId);
    if (!offer) {
      return {
        success: false,
        error:
          "Subscription not available. Install the app from Google Play (internal testing) and ensure you're signed in with a tester account.",
      };
    }
    request = {
      subscriptionOffers: [{ sku: offer.productId, offerToken: offer.offerToken }],
    };
  } else {
    request = { sku: productId };
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      if (pendingResolvers.has(productId)) {
        pendingResolvers.delete(productId);
        resolve({
          success: false,
          error: "Purchase timed out. Please try again.",
        });
      }
    }, 90000);

    pendingResolvers.set(productId, {
      resolve: (purchase: any) => {
        clearTimeout(timeout);
        resolve({
          success: true,
          productId: purchase?.productId,
          transactionId: purchase?.transactionId,
          receipt: purchase?.transactionReceipt || purchase?.receipt || purchase?.purchaseToken,
          purchaseToken: purchase?.purchaseToken,
          transactionDate: purchase?.transactionDate,
        });
      },
      reject: (err: any) => {
        clearTimeout(timeout);
        const errMsg = normalizePurchaseErrorMessage(err?.message);
        resolve(
          errMsg
            ? { success: false, error: errMsg }
            : { success: false },
        );
      },
    });

    requestSubscription(request).catch((err) => {
      if (pendingResolvers.has(productId)) {
        pendingResolvers.delete(productId);
        clearTimeout(timeout);
        const errMsg = normalizePurchaseErrorMessage((err as Error)?.message);
        resolve(
          errMsg
            ? { success: false, error: errMsg }
            : { success: false },
        );
      }
    });
  });
}

export async function restorePurchases(): Promise<PurchaseResult[]> {
  const ok = await initialize();
  if (!ok) return [];

  const raw = await getAvailablePurchasesFromStore({
    onlyIncludeActiveItems: true,
  }).catch(() => []);
  const purchases = Array.isArray(raw) ? raw : [];
  const subscriptionPurchases = purchases.filter((p) =>
    SUBSCRIPTION_PRODUCT_IDS.includes(p?.productId as any),
  );

  return subscriptionPurchases.map((p: any) => ({
    success: true,
    productId: p?.productId,
    transactionId: p?.transactionId,
    receipt: p?.purchaseToken || p?.transactionReceipt || p?.receipt,
    purchaseToken: p?.purchaseToken,
    transactionDate: p?.transactionDate,
  }));
}
