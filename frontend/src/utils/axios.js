import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../store/auth";
import log from "./logger";

// Function to check if access token is expired
const isAccessTokenExpired = (accessToken) => {
  try {
    const decodedToken = jwtDecode(accessToken);
    return decodedToken.exp < Date.now() / 1000;
  } catch (err) {
    return true;
  }
};

// Global variables for handling refresh concurrency
let isRefreshing = false;
let refreshSubscribers = [];

// Helper functions for refresh management
const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Async function to refresh token
const refreshAccessToken = async () => {
  const refreshToken = Cookies.get("refresh_token");
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }
  log.debug("Refreshing access token...");
  const refreshUrl = new URL(
    "user/token/refresh/",
    import.meta.env.VITE_API_URL
  ).toString();
  const response = await axios.post(refreshUrl, { refresh: refreshToken });
  const newAccessToken = response.data.access;
  const newRefreshToken = response.data.refresh; // May or may not be present if rotating
  // Set cookies consistently with auth.js
  Cookies.set("access_token", newAccessToken, { expires: 1, secure: true });
  if (newRefreshToken) {
    Cookies.set("refresh_token", newRefreshToken, { expires: 7, secure: true });
  }
  // Update Zustand store
  const user = jwtDecode(newAccessToken) || null;
  if (user) {
    useAuthStore.getState().setUser(user);
    localStorage.setItem("userData", JSON.stringify(user));
  }
  useAuthStore.getState().setLoading(false);
  return newAccessToken;
};

// Create the Axios instance
const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor: Add token and proactively refresh if expired
apiInstance.interceptors.request.use(
  async (config) => {
    let accessToken = Cookies.get("access_token");
    if (accessToken) {
      if (isAccessTokenExpired(accessToken)) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const newToken = await refreshAccessToken();
            onRefreshed(newToken);
            accessToken = newToken;
          } catch (error) {
            log.error("Token refresh failed:", error);
            useAuthStore.getState().setUser(null);
            window.location.href = "/login";
            return Promise.reject(error);
          } finally {
            isRefreshing = false;
          }
        } else {
          // Wait for ongoing refresh
          accessToken = await new Promise((resolve) => {
            subscribeTokenRefresh(resolve);
          });
        }
      }
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 as fallback
apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      log.debug("Received 401, attempting refresh...");
      try {
        let newToken;
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            newToken = await refreshAccessToken();
            onRefreshed(newToken);
          } finally {
            isRefreshing = false;
          }
        } else {
          newToken = await new Promise((resolve) => {
            subscribeTokenRefresh(resolve);
          });
        }
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiInstance(originalRequest);
      } catch (refreshError) {
        log.error("Token refresh failed:", refreshError);
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        useAuthStore.getState().setUser(null);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiInstance;
