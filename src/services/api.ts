// API service for handling HTTP requests

import axios, { AxiosRequestConfig, Method } from "axios";
import { ToastService } from "../components/toast";
import { API_CONFIG } from "../constants";
import { getApiErrorMessage } from "../utils/apiError";
import { logEnvConfig } from "../utils/env";
import {
  getTokenForAPI,
  handleSessionExpiry,
  isSessionExpiryError,
} from "./tokenManager";

interface RequestOptions {
  method?: Method;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  timeout?: number;
}

class ApiService {
  private axiosInstance;

  constructor() {
    logEnvConfig();
    console.log("🔧 Initializing API Service with config:", {
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
    });
    console.log("CALLLED 222");

    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor for logging and dynamic headers
    this.axiosInstance.interceptors.request.use(
      (config) => {
        config.headers = config.headers || {};

        console.log("🌐 API Request:", {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          fullURL: `${config.baseURL}${config.url}`,
          headers: config.headers,
        });
        return config;
      },
      (error) => {
        console.error("❌ Request Error:", error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and 401 handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log("✅ API Response:", {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
        return response;
      },
      (error) => {
        console.warn("❌ Response Error:", {
          message: error.message,
          status: error.response?.status,
          url: error.config?.url,
          data: error.response?.data,
        });

        // Handle session expiry - automatically logout user
        if (isSessionExpiryError(error)) {
          console.log(
            "🚪 Session expired detected in API interceptor - handling logout"
          );
          handleSessionExpiry().catch((logoutError) => {
            console.error("❌ Error during automatic logout:", logoutError);
          });
        }

        return Promise.reject(error);
      }
    );
  }

  private async formDataRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T | undefined> {
    const {
      method = "GET",
      headers = {
        "Content-Type": "multipart/form-data",
      },
      body,
      params,
      timeout,
    } = options;
    // Use longer timeout for file uploads (5 minutes = 300000ms)
    // FormData requests typically involve file uploads which can take longer
    const uploadTimeout = timeout || 300000;
    // Get token from centralized token managerz
    const token = await getTokenForAPI();
    // Add authorization header if token exists
    // Don't set Content-Type for FormData - let axios set it with boundary
    const requestHeaders: any = {
      ...headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    const config: AxiosRequestConfig = {
      url: endpoint,
      method,
      headers: requestHeaders,
      params,
      timeout: uploadTimeout,
      data: body,
    };
    try {
      console.log(":rocket: Making FormData API request:", {
        endpoint,
        method,
        hasToken: !!token,
        timeout: uploadTimeout,
        timeoutMinutes: Math.round(uploadTimeout / 60000),
        hasBody: !!body,
        bodyType: body?.constructor?.name,
      });

      const startTime = Date.now();
      const response = await this.axiosInstance.request<T>(config);
      const duration = Date.now() - startTime;
      console.log("✅ FormData request completed:", {
        endpoint,
        duration: `${Math.round(duration / 1000)}s`,
        status: response.status,
      });
      return response.data;
    } catch (error: any) {
      console.warn("💥 API request failed:", {
        endpoint,
        method,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      ToastService.showError(getApiErrorMessage(error));

      if (error.response) {
        return error.response.data;
      }
      // Network error or timeout
      console.warn("🌐 Network error details:", {
        code: error.code,
        message: error.message,
        isNetworkError: !error.response,
      });
      return undefined;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T | undefined> {
    const {
      method = "GET",
      headers = {
        "Content-Type": "application/json",
      },
      body,
      params,
      timeout,
    } = options;

    // Get token from centralized token manager
    const token = await getTokenForAPI();
    const requestHeaders = {
      ...headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const config: AxiosRequestConfig = {
      url: endpoint,
      method,
      headers: requestHeaders,
      params,
      timeout,
      data: body,
    };

    try {
      console.log("🚀 Making API request:", {
        endpoint,
        method,
        hasToken: !!token,
        timeout: timeout || API_CONFIG.TIMEOUT,
      });

      const response = await this.axiosInstance.request<T>(config);
      return response.data;
    } catch (error: any) {
      console.warn("💥 API request failed:", {
        endpoint,
        method,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      ToastService.showError(getApiErrorMessage(error));

      if (error.response) {
        return error.response.data;
      }

      // Network error or timeout
      console.warn("🌐 Network error details:", {
        code: error.code,
        message: error.message,
        isNetworkError: !error.response,
      });

      return undefined;
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<T | undefined> {
    return this.request<T>(endpoint, { method: "GET", params, headers });
  }

  async post<T>(
    endpoint: string,
    body: any,
    headers?: Record<string, string>,
    params?: Record<string, any>
  ): Promise<T | undefined> {
    return this.request<T>(endpoint, { method: "POST", body, headers, params });
  }

  async put<T>(
    endpoint: string,
    body: any,
    headers?: Record<string, string>,
    params?: Record<string, any>
  ): Promise<T | undefined> {
    return this.request<T>(endpoint, { method: "PUT", body, headers, params });
  }

  async putFormData<T>(
    endpoint: string,
    body: any,
    headers?: Record<string, string>,
    params?: Record<string, any>
  ): Promise<T | undefined> {
    return this.formDataRequest<T>(endpoint, {
      method: "PUT",
      body,
      headers,
      params,
    });
  }

  async delete<T>(
    endpoint: string,
    params?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<T | undefined> {
    return this.request<T>(endpoint, { method: "DELETE", params, headers });
  }

  async patch<T>(
    endpoint: string,
    body: any,
    headers?: Record<string, string>,
    params?: Record<string, any>
  ): Promise<T | undefined> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body,
      headers,
      params,
    });
  }

  async postFormData<T>(
    endpoint: string,
    body: any,
    headers?: Record<string, string>,
    params?: Record<string, any>,
    timeout?: number
  ): Promise<T | undefined> {
    return this.formDataRequest<T>(endpoint, {
      method: "POST",
      body,
      headers,
      params,
      timeout,
    });
  }

  async patchFormData<T>(
    endpoint: string,
    body: any,
    headers?: Record<string, string>,
    params?: Record<string, any>,
    timeout?: number
  ): Promise<T | undefined> {
    return this.formDataRequest<T>(endpoint, {
      method: "PATCH",
      body,
      headers,
      params,
      timeout,
    });
  }

  // Test method to verify API connectivity
  async testConnection(): Promise<boolean> {
    try {
      console.log("🧪 Testing API connection...");
      const response = await this.axiosInstance.get("/health", {
        timeout: 5000,
      });
      console.log("✅ API connection test successful:", response.status);
      return true;
    } catch (error: any) {
      console.error("❌ API connection test failed:", error.message);
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService;
