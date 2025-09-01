import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export default function UserData() {
  const access_token = Cookies.get("access_token");
  const refresh_token = Cookies.get("refresh_token");

  if (access_token && refresh_token) {
    try {
      const token = refresh_token;
      const decoded = jwtDecode(token);
      return decoded;
    } catch (error) {
      console.error("Error decoding token:", error);
      return {};
    }
  } else {
    console.log("User token does not exist");
    return {};
  }
}
