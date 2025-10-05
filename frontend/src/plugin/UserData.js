import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export default function UserData() {
  const access_token = Cookies.get("access_token");
  const refresh_token = Cookies.get("refresh_token");

  if (access_token) {
    try {
      // Decode the ACCESS token, not refresh token
      const decoded = jwtDecode(access_token);
      return decoded;
    } catch (error) {
      console.error("Error decoding access token:", error);

      // If access token is invalid/expired, try to use refresh token as fallback
      if (refresh_token) {
        try {
          const decoded = jwtDecode(refresh_token);
          return decoded;
        } catch (refreshError) {
          console.error("Error decoding refresh token:", refreshError);
          return null;
        }
      }
      return null;
    }
  } else if (refresh_token) {
    // Only refresh token exists (rare case during token rotation)
    try {
      const decoded = jwtDecode(refresh_token);
      return decoded;
    } catch (error) {
      console.error("Error decoding refresh token:", error);
      return null;
    }
  } else {
    console.log("No authentication tokens found");
    return null;
  }
}
