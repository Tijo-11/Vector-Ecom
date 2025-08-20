//: Creating a useAxios utility function to handle authenticated API requests in the React frontend of
//•	Purpose: Intercept requests to check and refresh expired access tokens, ensuring seamless access
// to protected API endpoints.
import axios from "./axios"; //default export so name can be different
import { getRefreshToken, isAccessTokenExpired, setAuthUser } from "./auth"; // Import authentication-related functions
import { API_BASEURL } from "./constants";
import Cookies from "js-cookie";

// Define a custom Axios instance creator function
const useAxios = () => {
  // Retrieve the access and refresh tokens from cookies
  const accessToken = Cookies.get("access_token");
  const refreshToken = Cookies.get("refresh_token");

  // Create an Axios instance with base URL and access token in the headers
  const axiosInstance = axios.create({
    baseURL: API_BASEURL,
    headers: { Authorization: `Bearer${accessToken}` },
    //headers.Authorization: adds JWT token for authenticated API calls using Bearer scheme
    //Use this instance to avoid repeating config in every request.
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

/***************************************************************************************** */
/* 
🧱 axios.js: Global Axios Configuration
This file sets up a base Axios instance with default settings used across the app.

✅ Centralizes config like baseURL, timeout, and headers

✅ Useful for unauthenticated or public requests

✅ Keeps things DRY (Don’t Repeat Yourself)

Example use case: Used in services like getPosts(), fetchProducts(), etc., where no user token is needed.

🔐 useAxios.js: Authenticated Axios Hook or Instance
This file likely creates an Axios instance dynamically, often inside a custom React hook, based on user-specific data like an access token.

🔒 Adds Authorization: Bearer ${accessToken} header

🔄 Can be reactive—updates when token changes

🧠 Often used in components that require user authentication

Example use case: Used in useUserData(), useOrders(), etc., where secure endpoints require a valid token.

🧩 Why Both?
Using both allows your app to:

Separate public and authenticated API logic

Avoid leaking tokens into requests that don’t need them

Keep your code modular and maintainable
**************************************************************************/
