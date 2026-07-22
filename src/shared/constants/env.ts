export const apiUrls = {
  staging: 'https://api.staging.fitcall.me/api/v1',
  production: 'https://api.fitcall.me/api/v1',
} as const;

export const env = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? apiUrls.staging,
  GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  // Gates the subscription paywall on the booking flow. Disabled by default
  // (unset/anything but "true") until the IAP products are live in the stores;
  // set to "true" to require a subscription before booking. See useBookingGate.
  PAYWALL_ENABLED: process.env.EXPO_PUBLIC_PAYWALL_ENABLED === 'true',
} as const;
