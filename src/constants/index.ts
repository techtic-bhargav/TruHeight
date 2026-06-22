// App-wide constants and configuration
import { getEnvConfig } from "../utils/env";

const envConfig = getEnvConfig();

export const STORAGE_KEYS = {
  USER_TOKEN: "user_token",
  USER_DATA: "user_data",
  SETTINGS: "app_settings",
  THEME: "app_theme",
  GROWTH_CHART_UNIT: "growth_chart_unit",
  FAMILY_NAME: "family_name",
  FAMILY_ID: "family_id",
  DEVICE_ID: "device_id",
  EXPO_PUSH_TOKEN: "expo_push_token",
  FCM_TOKEN: "fcm_token",
};

export const APP_CONFIG = {
  APP_NAME: envConfig.APP.NAME,
  VERSION: envConfig.APP.VERSION,
  BUILD_NUMBER: envConfig.APP.BUILD_NUMBER,
};

export const API_CONFIG = {
  BASE_URL: envConfig.API.BASE_URL,
  TIMEOUT: envConfig.API.TIMEOUT,
  RETRY_ATTEMPTS: envConfig.API.RETRY_ATTEMPTS,
};

export const GOOGLE_PLACES_API = {
  // AUTOCOMPLETE_URL: "https://places.googleapis.com/v1/places:autocomplete",
  // PLACE_DETAILS_BASE_URL: "https://places.googleapis.com/v1/places",
};

export const GOOGLE_MAPS_API = {
  // GEOCODING_BASE_URL: "https://maps.googleapis.com/maps/api/geocode/json",
  // REVERSE_GEOCODING_BASE_URL:
  //   "https://maps.googleapis.com/maps/api/geocode/json",
};
