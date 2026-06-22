/**
 * Centralized Token Management Service
 *
 * This service provides a single source of truth for token management
 * to prevent token inconsistencies and replacement issues.
 */

import { router } from "expo-router";
import { useUserStore } from "../store";
import storageService from "./storage";

class TokenManager {
  private static instance: TokenManager;
  private cachedToken: string | null = null;
  private tokenPromise: Promise<string | null> | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Get the current authentication token
   * This is the single method that should be used throughout the app
   */
  public async getToken(): Promise<string | null> {
    // If we already have a cached token, return it immediately
    if (this.cachedToken) {
      return this.cachedToken;
    }

    // If there's already a token fetch in progress, wait for it
    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    // Start fetching the token
    this.tokenPromise = this.fetchToken();
    const token = await this.tokenPromise;
    this.tokenPromise = null;

    return token;
  }

  /**
   * Get token synchronously from cache (for immediate use)
   * Returns null if token is not cached
   */
  public getCachedToken(): string | null {
    return this.cachedToken;
  }

  /**
   * Get token from Zustand store (synchronous)
   * This is for cases where you need immediate access without async operations
   */
  public getTokenFromStore(): string | null {
    const user = useUserStore.getState().user;
    return user?.token || null;
  }

  /**
   * Set the authentication token
   */
  public async setToken(token: string): Promise<void> {
    try {
      // Update cache
      this.cachedToken = token;

      // Update storage
      await storageService.setUserToken(token);

      // Update user store
      const currentUser = useUserStore.getState().user;
      if (currentUser) {
        const updatedUser = { ...currentUser, token };
        useUserStore.getState().setUser(updatedUser);
      }
    } catch (error) {
      console.error("Error setting token:", error);
      throw error;
    }
  }

  /**
   * Clear the authentication token
   */
  public async clearToken(): Promise<void> {
    try {
      // Clear cache
      this.cachedToken = null;

      // Clear storage
      await storageService.removeUserToken();

      // Update user store
      const currentUser = useUserStore.getState().user;
      if (currentUser) {
        const updatedUser = { ...currentUser, token: null };
        useUserStore.getState().setUser(updatedUser);
      }
    } catch (error) {
      console.error("Error clearing token:", error);
      throw error;
    }
  }

  /**
   * Check if user has a valid token
   */
  public async hasValidToken(): Promise<boolean> {
    const token = await this.getToken();
    return !!token && token.trim().length > 0;
  }

  /**
   * Refresh the token cache from storage
   * Use this when you suspect the cache might be stale
   */
  public async refreshTokenCache(): Promise<string | null> {
    try {
      // Clear current cache
      this.cachedToken = null;

      // Fetch fresh token
      const token = await this.fetchToken();
      return token;
    } catch (error) {
      console.error("Error refreshing token cache:", error);
      return null;
    }
  }

  /**
   * Internal method to fetch token from storage
   */
  private async fetchToken(): Promise<string | null> {
    try {
      // First try to get from user store (fastest)
      const storeToken = this.getTokenFromStore();
      if (storeToken) {
        this.cachedToken = storeToken;
        return storeToken;
      }

      // If not in store, get from storage
      const storageToken = await storageService.getUserToken();
      if (storageToken) {
        this.cachedToken = storageToken;

        // Update user store with the token from storage
        const currentUser = useUserStore.getState().user;
        if (currentUser && !currentUser.token) {
          const updatedUser = { ...currentUser, token: storageToken };
          useUserStore.getState().setUser(updatedUser);
        }

        return storageToken;
      }

      // No token found
      this.cachedToken = null;
      return null;
    } catch (error) {
      console.error("Error fetching token:", error);
      this.cachedToken = null;
      return null;
    }
  }

  /**
   * Get token for API requests
   * This method ensures we always have the most up-to-date token
   */
  public async getTokenForAPI(): Promise<string | null> {
    // For API requests, we want the most current token
    // So we refresh the cache first
    await this.refreshTokenCache();
    return this.cachedToken;
  }

  /**
   * Handle session expiry - automatically logout user
   * This should be called when a 401 "Session expired" error is detected
   */
  public async handleSessionExpiry(): Promise<void> {
    try {
      console.log("🚪 Session expired detected - logging out user");

      // Clear the token
      await this.clearToken();

      // Get logout function from store
      const { logout } = useUserStore.getState();

      // Perform logout
      await logout();

      // Pop back to onboarding screen (welcome/slides)
      router.dismissTo("/onboarding");
    } catch (error) {
      console.error("❌ Error during session expiry logout:", error);
      // Even if logout fails, try to pop to onboarding
      try {
        router.dismissTo("/onboarding");
      } catch (navError) {
        console.error("❌ Error navigating to onboarding:", navError);
      }
    }
  }

  /**
   * Check if error is a session expiry error
   * Requires BOTH: 401 status AND matching token expiration message
   * Excludes wrong password/invalid credentials errors
   */
  public isSessionExpiryError(error: any): boolean {
    // First check if status is 401 - if not, return false immediately
    if (error?.response?.status !== 401) {
      return false;
    }

    // If status is 401, check error message in various locations
    const rawMessage =
      error?.response?.data?.message ??
      error?.response?.data?.error ??
      error?.message ??
      error?.toString() ??
      "";
    const errorMessage = (
      Array.isArray(rawMessage) ? rawMessage[0] : rawMessage
    ).toString().toLowerCase();

    // Exclude wrong password/invalid credentials errors
    const excludePatterns = [
      "invalid credentials",
      "wrong password",
      "incorrect password",
      "invalid password",
      "password incorrect",
      "email or password",
      "invalid email",
      "user not found",
      "authentication failed",
      "login failed",
    ];

    // If error message matches exclude patterns, it's not a token expiry
    if (excludePatterns.some((pattern) => errorMessage.includes(pattern))) {
      return false;
    }

    // Check for various token expiration/revocation/account-deleted messages
    const tokenExpiredPatterns = [
      "session expired",
      "token expired",
      "access token has expired",
      "access token expired",
      "token has expired",
      "authentication token expired",
      "jwt expired",
      "token invalid",
      "token has been revoked",
      "please login again",
      "your account has been deleted",
      "please contact support for assistance",
    ];

    // Only return true if BOTH: 401 status AND matching error message pattern
    return tokenExpiredPatterns.some((pattern) =>
      errorMessage.includes(pattern)
    );
  }

  /**
   * Initialize token manager
   * Call this when the app starts to populate the cache
   */
  public async initialize(): Promise<void> {
    try {
      await this.refreshTokenCache();
    } catch (error) {
      console.error("Error initializing token manager:", error);
    }
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();

// Export convenience functions for common use cases
export const getAuthToken = () => tokenManager.getToken();
export const getCachedAuthToken = () => tokenManager.getCachedToken();
export const getStoreAuthToken = () => tokenManager.getTokenFromStore();
export const setAuthToken = (token: string) => tokenManager.setToken(token);
export const clearAuthToken = () => tokenManager.clearToken();
export const hasValidAuthToken = () => tokenManager.hasValidToken();
export const getTokenForAPI = () => tokenManager.getTokenForAPI();
export const handleSessionExpiry = () => tokenManager.handleSessionExpiry();
export const isSessionExpiryError = (error: any) =>
  tokenManager.isSessionExpiryError(error);

export default tokenManager;
