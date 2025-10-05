import axios from "axios";

// Create an Axios instance with custom configuration
const apiInstance = axios.create({
  baseURL: "http://localhost:8000/api/",
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
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add a response interceptor to handle token refresh
apiInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If token expired (401) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log("🔄 Access token expired, attempting refresh...");

      try {
        const refreshToken = getCookie("refresh_token");
        console.log("🔑 Refresh token found:", refreshToken ? "Yes" : "No");

        if (refreshToken) {
          console.log("📤 Sending refresh request to backend...");

          // Try to refresh the token
          const response = await axios.post(
            "http://localhost:8000/api/token/refresh/",
            { refresh: refreshToken }
          );

          const newAccessToken = response.data.access;
          console.log("✅ New access token received");

          // Set new token in cookie
          document.cookie = `access_token=${newAccessToken}; path=/; max-age=${
            60 * 5
          }`; // 5 minutes
          console.log("🍪 Cookie updated with new access token");

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          console.log("🔁 Retrying original request...");
          return apiInstance(originalRequest);
        } else {
          console.log("❌ No refresh token found, redirecting to login");
          throw new Error("No refresh token available");
        }
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError);
        // If refresh fails, clear cookies and redirect to login
        document.cookie = "access_token=; path=/; max-age=0";
        document.cookie = "refresh_token=; path=/; max-age=0";
        console.log("🚪 Redirecting to login page...");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiInstance;
