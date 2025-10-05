// src/utils/auth.js
import { useAuthStore } from "../store/auth";
import apiInstance from "./axios";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import { generateRandomString } from "../views/shop/ProductDetail/cartId";

const Toast = Swal.mixin({
  toast: true,
  position: "top",
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: true,
});

// Removed syncCartAfterLogin - handled by CartInitializer

export const login = async (email, password) => {
  try {
    const { data, status } = await apiInstance.post("user/token/", {
      email,
      password,
    });

    if (status === 200) {
      setAuthUser(data.access, data.refresh);
      localStorage.removeItem("random_string");
      Toast.fire({
        icon: "success",
        title: "Login Successful",
      });
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error.response?.data?.detail || "something went wrong",
    };
  }
};

export const register = async (
  full_name,
  email,
  phone,
  password,
  password2
) => {
  try {
    const { data } = await apiInstance.post("user/register/", {
      full_name,
      email,
      phone,
      password,
      password2,
    });

    await login(email, password);

    Toast.fire({
      icon: "success",
      title: "Signed Up Successfully",
    });

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error.response?.data?.detail || "Something went wrong",
    };
  }
};

export const logout = () => {
  const accessToken = Cookies.get("access_token");

  if (accessToken) {
    try {
      const user = jwtDecode(accessToken);
      if (user && user.user_id) {
        localStorage.removeItem(`cart_id_user_${user.user_id}`);
      }
    } catch (err) {
      console.error("Error decoding token during logout:", err);
    }
  }

  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  localStorage.removeItem("userData");

  localStorage.setItem("random_string", generateRandomString());

  useAuthStore.getState().setUser(null);

  Toast.fire({
    icon: "success",
    title: "You have been logged out.",
  });
};

export const setUser = async () => {
  const accessToken = Cookies.get("access_token");
  const refreshToken = Cookies.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return;
  }

  if (isAccessTokenExpired(accessToken)) {
    const response = await getRefreshToken(refreshToken);
    setAuthUser(response.access, response.refresh);
  } else {
    setAuthUser(accessToken, refreshToken);
  }
};

export const setAuthUser = (access_token, refresh_token) => {
  Cookies.set("access_token", access_token, { expires: 1, secure: true });
  Cookies.set("refresh_token", refresh_token, { expires: 7, secure: true });

  const user = jwtDecode(access_token) || null;

  if (user) {
    useAuthStore.getState().setUser(user);
    localStorage.setItem("userData", JSON.stringify(user));
  }
  useAuthStore.getState().setLoading(false);
};

export const getRefreshToken = async (refresh_token) => {
  const response = await apiInstance.post("user/token/refresh/", {
    refresh: refresh_token,
  });
  return response.data;
};

export const isAccessTokenExpired = (accessToken) => {
  try {
    const decodedToken = jwtDecode(accessToken);
    return decodedToken.exp < Date.now() / 1000;
  } catch (err) {
    return true;
  }
};
