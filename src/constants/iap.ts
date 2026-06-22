/**
 * IAP product IDs – must match App Store Connect / Google Play Console.
 */
export const SUBSCRIPTION_PRODUCT_IDS = [
  "com.app.truheight.monthly",
  "com.app.truheight.yearly",
] as const;

export type SubscriptionProductId = (typeof SUBSCRIPTION_PRODUCT_IDS)[number];
