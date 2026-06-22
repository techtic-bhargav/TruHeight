import apiService from "../../services/api";

export interface ActiveSubscriptionPlan {
  source?: string;
  provider?: string;
  plan?: string;
  status?: string;
  product_id?: string;
  amount?: number;
  currency?: string;
  started_at?: string;
  expires_at?: string;
  current_period_start?: string;
  current_period_end?: string;
  [key: string]: unknown;
}

export interface ActiveSubscriptionResponse {
  has_active_subscription?: boolean;
  subscription_status?: string;
  active_plans?: ActiveSubscriptionPlan[];
  is_monthly?: boolean;
  is_annual?: boolean;
  is_truheight_subscriber?: boolean;
  [key: string]: unknown;
}

/** Request body for POST /api/v1/subscriptions/verify-purchase */
export interface VerifyPurchaseRequest {
  platform: string;
  product_id: string;
  price: number;
  price_currency: string;
  receipt_data: string;
  purchase_token: string;
}

export interface VerifyPurchaseResponse {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

/**
 * Verify a completed in-app purchase with the backend.
 * Call this after a successful purchase so the server can validate and activate the subscription.
 */
export const verifyPurchase = (
  data: VerifyPurchaseRequest
): Promise<VerifyPurchaseResponse | undefined> => {
  return apiService.post<VerifyPurchaseResponse>(
    "/subscriptions/verify-purchase",
    data
  );
};

export const getActiveSubscription =
  (): Promise<ActiveSubscriptionResponse | undefined> => {
    return apiService.get<ActiveSubscriptionResponse>("/subscriptions/active");
  };
