// Intercept requests to check and refresh expired access tokens, ensuring seamless access
// to protected API endpoints.
import axios from "./axios";
import { getRefreshToken, isAccessTokenExpired, setAuthUser } from "./auth"; // Import authentication-related functions
import { API_BASEURL } from "./constants";
import Cookies from "js-cookie";

const useAxios = () => {
  // Retrieve the access and refresh tokens from cookies
  const accessToken = Cookies.get("access_token");
  const refreshToken = Cookies.get("refresh_token");

  // Create an Axios instance with base URL and access token in the headers
  const axiosInstance = axios.create({
    baseURL: API_BASEURL,
    headers: { Authorization: `Bearer${accessToken}` },
    //headers.Authorization: adds JWT token for authenticated API calls using Bearer scheme
  });
  // Add an interceptor to the Axios instance
  axiosInstance.interceptors.request.use(async (req) => {
    // Intercepts every outgoing request to modify or inspect it before sending
    // Useful for injecting dynamic headers like auth tokens or logging requests
    // Check if the access token is expired
    if (!isAccessTokenExpired(accessToken)) {
      return req; // If not expired, return the original request given as argument
    }

    // If the access token is expired, refresh it
    const response = await getRefreshToken(refreshToken);
    // Update the application with the new access and refresh tokens
    setAuthUser(response.access, response.refresh);
    // Update the request's 'Authorization' header with the new access token
    req.headers.Authorization = `Bearer${response.access}`; //is it response.data.access?
    return req;
  });
  return axiosInstance; // Return the custom Axios instance
};
export default useAxios; // Export the custom Axios instance creator function
