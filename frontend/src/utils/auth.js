import { useAuthStore } from "../store/auth";
import apiInstance from "./axios"; // <-- import axios from "./axios"; works since it was an exported  as default.
//Better thing is import apiInstance from './axios';
// Imports the jwt-decode library to decode JSON Web Tokens (JWT) on the client side
import { jwtDecode } from "jwt-decode"; // ✅ Correct way to import a named export
//jwt-decode is a super useful library when you want to extract information from a JWT without verifying it.
//  It’s commonly used in frontend apps to read user data like user_id, email, or roles embedded in the token.
import cookies from "js-cookie"; //js-cookie is a lightweight JavaScript library that simplifies working with
// cookies in the browser. It’s perfect for storing tokens, user preferences, or session data without diving
// into the messy details of cookie syntax.
import Swal from "sweetalert2";
// Importing Swal (SweetAlert2) for displaying toast notifications # npm install sweetalert2

///////////////////////////////////////////////////////////////////////

// Configuring global toast notifications using Swal.mixin
//It’s a sleek, customizable replacement for window.alert() — perfect for React apps that want polished user
// feedback. You can explore more examples on SweetAlert2’s npm page
const Toast = Swal.mixin({
  //This line sets up a Toast object using Swal.mixin() to define default options for lightweight, non-blocking
  // notifications. You can now call Toast.fire({...}) with minimal config each time.
  toast: true,
  position: "top",
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: true,
});

//Function to handle user login
export const login = async (email, password) => {
  try {
    // Making a POST request to obtain user tokens
    const { data, status } = await apiInstance.post("user/token/", {
      //just pulling out the data and status from that response from json object response
      email,
      password,
    });
    // If the request is successful (status code 200), set authentication user and display success toast
    if (status === 200) {
      setAuthUser(data.access, data.refresh);

      // Displaying a success toast notification
      Toast.fire({
        icon: "success",
        title: "Login Successful",
      });
    } // Returning data and error information
    return { data, error: null };
  } catch (error) {
    return {
      // Handling errors and returning data and error information
      data: null,
      error: error.response?.data?.detail || "something went wrong",
    };
  }
};
// Function to handle user registration
export const Register = async (
  full_name,
  email,
  phone,
  password,
  password2
) => {
  try {
    // Making a POST request to register a new user
    const { data } = await apiInstance.post("user/register/", {
      full_name,
      email,
      phone,
      password,
      password2,
    });
    // Logging in the newly registered user and displaying success toast
    await login(email, password); //Auto-login after registration
    // Displaying a success toast notification
    Toast.fire({
      icon: "success",
      title: "Signed Up Successfully",
    });
    // Returning data and error information
    return { data, error: null };
  } catch (error) {
    // Handling errors and returning data and error information
    return {
      data: null,
      error: error.response?.data?.detail || "Something went wrong",
    };
  }
};

// Function to handle user logout
export const logout = () => {
  // Removing access and refresh tokens from cookies, resetting user state, and displaying success toast
  Cookies.remove("access_token"),
    Cookies.remove("refresh_token"),
    useAuthStore.getState().setUser(null);
  // Displaying a success toast notification
  Toast.fire({
    icon: "success",
    title: "You have been logged out.",
  });
};

// Function to set the authenticated user on page load
export const setUser = async () => {
  // Retrieving access and refresh tokens from cookies
  const accessToken = Cookies.get("access_token");
  const refreshToken = Cookies.get("refresh_token");
  // Checking if tokens are present
  if (!accessToken || !refreshToken) {
    return;
  }
  // If access token is expired, refresh it; otherwise, set the authenticated user
  if (isAccessTokenExpired) {
    const response = await getRefreshToken(refreshToken);
    setAuthUser(response.access, response.refresh);
  } else {
    setAuthUser(accessToken, refreshToken);
  }
};

// Function to set the authenticated user and update user state
export const setAuthUser = async (access_token, refresh_token) => {
  //Retrieving access and refresh tokens from cookies
  Cookies.set("access_token", access_token, { expires: 1, secure: true }); //expires: 1 means the cookie will expire in 1 day.
  Cookies.set("refresh_token", refresh_token, { expires: 7, secure: true });
  //secure: true ensures the cookie is only sent over HTTPS — great for production environments.
  // Decoding access token to get user information
  const user = jwtDecode(access_token) || null;
  // If user information is present, update user state; otherwise, set loading state to false
  if (user) {
    useAuthStore.getState().setUser(user);
    useAuthStore.getState().setLoading(false);
  }
};

// Function to refresh the access token using the refresh token
export const getRefreshToken = async (refresh_token) => {
  // Retrieving refresh token from cookies and making a POST request to refresh the access token
  const response = await apiInstance.post("user/token/refresh", {
    refresh: refresh_token,
  });
  return response.data; //Returns new access and refresh tokens.
};

// Function to check if the access token is expired
export const isAccessTokenExpired = (accessToken) => {
  try {
    // Decoding the access token and checking if it has expired
    const decodedToken = jwtDecode(accessToken);
    return decodedToken.exp < Date.now() / 1000;
    //Compares the token’s exp (expiry time in seconds) with the current time (converted to seconds).
    //.exp is a It’s a property of the decoded JWT (JSON Web Token) payload. Specifically:
    //It’s a Unix timestamp (in seconds) indicating when the token should expire
    //JWT payloads are just JSON objects, so their fields are accessed like regular object properties.
  } catch (err) {
    // Returning true if the token is invalid or expired
    return true;
  }
};

/********************************************************************* */
/*
🍪 js-cookie is a lightweight JavaScript library that simplifies working with cookies in the browser. It’s perfect for storing tokens, user preferences, or session data without diving into the messy details of cookie syntax.

Here’s a quick example:

js
import Cookies from 'js-cookie';

// Set a cookie
Cookies.set('token', 'abc123', { expires: 7 }); // Expires in 7 days

// Get a cookie
const token = Cookies.get('token');

// Remove a cookie
Cookies.remove('token');
You can also store JSON objects by stringifying them, or set secure flags for HTTPS-only cookies. 
*/
