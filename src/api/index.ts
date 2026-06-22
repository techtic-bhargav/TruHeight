import axios from "axios";
import { API_CONFIG } from "../constants";
import { getAuthToken } from "../store/auth";
import { useUserStore } from "../store";
import { useNavigationStore } from "../store/navigation";

const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    // Set dynamic Accept-Language header based on current language
    config.headers = config.headers || {};

    const token = await getAuthToken();
    console.log("🚀 ~ axiosInstance.interceptors.request.use ~ token:", token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for 401 handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - automatically logout user
    // if (error.response?.status === 401) {
    //   const currentPath = useNavigationStore.getState().currentPath;
    //   // Skip auto-logout if user is on login screen
    //   if (currentPath === '/auth/login') {
    //     return Promise.reject(error);
    //   }
    //   console.log('🚪 401 Unauthorized detected in axios instance - logging out user');
    //   const { logout } = useUserStore.getState();
    //   logout().catch(logoutError => {
    //     console.error('❌ Error during automatic logout:', logoutError);
    //   });
    // }
    return Promise.reject(error);
  }
);

export default axiosInstance;
