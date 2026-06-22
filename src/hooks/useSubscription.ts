/**
 * useSubscription – subscription status, plans, purchase, restore.
 * Displays data from backend (profile) + IAP store; triggers upgrade/restore only.
 */
import { verifyPurchase } from "@/api/endpoints/subscriptions";
import { getProfile } from "@/api/endpoints/users";
import {
  buildSubscriptionStatus,
  getAvailablePurchases,
  getSubscriptionProducts,
  initialize,
  logVerifyPurchaseRequest,
  purchaseSubscription,
  type IAPPlan,
  type SubscriptionStatusData,
} from "@/services/iapService";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

/** Extract numeric price string from display price (e.g. "$9.99" or "$9.99/mo" → "9.99") */
function extractNumericPrice(priceString: string): string {
  if (!priceString) return "";
  const match = priceString.match(/\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+\.?\d*/);
  return match ? match[0].replace(/,/g, "") : "";
}

export interface UseSubscriptionReturn {
  subscriptionStatus: SubscriptionStatusData | null;
  plans: IAPPlan[];
  isLoading: boolean;
  isInitializing: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  error: string | null;
  loadSubscriptionStatus: () => Promise<SubscriptionStatusData | null>;
  loadPlans: () => Promise<void>;
  refresh: () => Promise<void>;
  purchase: (productId: string) => Promise<{ success: boolean; error?: string }>;
  restore: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatusData | null>(null);
  const [plans, setPlans] = useState<IAPPlan[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptionStatus = useCallback(async (): Promise<SubscriptionStatusData | null> => {
    setError(null);
    try {
      const [profileRes, appPurchases] = await Promise.all([
        getProfile(),
        getAvailablePurchases(),
      ]);
      const user = profileRes?.data?.user;
      const sub = user?.subscription;
      const isTruHeight =
        user?.is_truheight_subscriber ?? (user as any)?.isTruHeightSubscriber ?? false;
      const status = buildSubscriptionStatus(
        sub,
        !!isTruHeight,
        Array.isArray(appPurchases) ? appPurchases : [],
      );
      setSubscriptionStatus(status);
      return status;
    } catch (e) {
      console.warn("loadSubscriptionStatus failed:", e);
      setError((e as Error)?.message || "Failed to load subscription status");
      return null;
    }
  }, []);

  const loadPlans = useCallback(async () => {
    setError(null);
    try {
      const list = await getSubscriptionProducts();
      setPlans(list);
    } catch (e) {
      console.warn("loadPlans failed:", e);
      setError((e as Error)?.message || "Failed to load plans");
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadPlans(), loadSubscriptionStatus()]);
  }, [loadPlans, loadSubscriptionStatus]);

  const purchase = useCallback(
    async (productId: string): Promise<{ success: boolean; error?: string }> => {
      setError(null);
      setIsPurchasing(true);
      try {
        const result = await purchaseSubscription(productId);
        if (result.success) {
          const currentProductId = result.productId || productId;
          const plan = plans.find((p) => p.productId === currentProductId);
          const priceStr = extractNumericPrice(plan?.price ?? "");
          const priceNum = parseFloat(priceStr) || 0;
          const priceCurrency = plan?.currency ?? "USD";
          logVerifyPurchaseRequest(
            result,
            currentProductId,
            priceStr,
            priceCurrency,
          );
          try {
            const verifyRequestBody = {
              platform: Platform.OS,
              product_id: currentProductId,
              price: priceNum,
              price_currency: priceCurrency,
              receipt_data: result.receipt ?? "",
              purchase_token: result.purchaseToken ?? "",
            };
            console.log("[Subscription] verify-purchase request:", JSON.stringify(verifyRequestBody, null, 2));
            const verifyResponse = await verifyPurchase(verifyRequestBody);
            console.log("[Subscription] verify-purchase response:", JSON.stringify(verifyResponse ?? null, null, 2));
          } catch (verifyError: unknown) {
            const err = verifyError as { response?: { data?: unknown }; message?: string };
            console.warn("[Subscription] verify-purchase API failed:", err?.message ?? verifyError);
            if (err?.response?.data != null) {
              console.log("[Subscription] verify-purchase error response:", JSON.stringify(err.response.data, null, 2));
            }
          }
          const updatedStatus = await loadSubscriptionStatus();
          if (updatedStatus) {
            console.log("[Subscription] Purchase successful. Subscription details:", JSON.stringify(updatedStatus, null, 2));
          }
          return { success: true };
        }
        return { success: false, error: result.error };
      } catch (e) {
        const msg = (e as Error)?.message || "Purchase failed";
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsPurchasing(false);
      }
    },
    [loadSubscriptionStatus, plans],
  );

  const restore = useCallback(async () => {
    setError(null);
    setIsRestoring(true);
    try {
      const updatedStatus = await loadSubscriptionStatus();
      if (updatedStatus && updatedStatus.status === "Active") {
        console.log("[Subscription] Restore successful. Subscription details:", JSON.stringify(updatedStatus, null, 2));
      }
    } catch (e) {
      setError((e as Error)?.message || "Restore failed");
    } finally {
      setIsRestoring(false);
    }
  }, [loadSubscriptionStatus]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsInitializing(true);
      try {
        await initialize();
        if (cancelled) return;
        await Promise.all([loadPlans(), loadSubscriptionStatus()]);
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadPlans, loadSubscriptionStatus]);

  const isLoading = isInitializing;

  return {
    subscriptionStatus,
    plans,
    isLoading,
    isInitializing,
    isPurchasing,
    isRestoring,
    error,
    loadSubscriptionStatus,
    loadPlans,
    refresh,
    purchase,
    restore,
  };
}
