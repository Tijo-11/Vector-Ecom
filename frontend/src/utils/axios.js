import axios from "axios";
import log from "./logger";

// Create an Axios instance with custom configuration
const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Helper function to get cookie value by name
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

// Add a request interceptor to attach JWT token to every request
apiInstance.interceptors.request.use(
  (config) => {
    const token = getCookie("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh
apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      log.debug("Access token expired, attempting refresh...");

      try {
        const refreshToken = getCookie("refresh_token");
        log.debug("Refresh token found:", !!refreshToken);

        if (refreshToken) {
          log.debug("Sending refresh request to backend...");

          const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/token/refresh/`,
            { refresh: refreshToken }
          );

          const newAccessToken = response.data.access;
          log.debug("New access token received");

          document.cookie = `access_token=${newAccessToken}; path=/; max-age=${
            60 * 5
          }`;
          log.debug("Cookie updated with new access token");

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          log.debug("Retrying original request...");
          return apiInstance(originalRequest);
        } else {
          log.warn("No refresh token found, redirecting to login");
          throw new Error("No refresh token available");
        }
      } catch (refreshError) {
        log.error("Token refresh failed:", refreshError);
        document.cookie = "access_token=; path=/; max-age=0";
        document.cookie = "refresh_token=; path=/; max-age=0";
        log.warn("Redirecting to login page...");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiInstance;
