import { create } from "zustand";
// Zustand is a lightweight state management library for React. The `create` function is used
// to build custom hooks that manage shared state across components without boilerplate or context providers.

import { mountStoreDevtool } from "simple-zustand-devtools";
// simple-zustand-devtools is a handy utility that lets you inspect and debug your Zustand store right
// from the browser’s developer tools. It helps track state changes and actions for easier debugging.

const useAuthStore = create((set, get) => ({
  // allUserData: Stores the full decoded user information (e.g., user_id, username) from the JWT.
  allUserData: null,

  // loading: Tracks loading state (e.g., during login requests). Initialized as false.
  loading: false,

  // user: Stores a simplified user object (commonly used fields like user_id and username).
  // This is derived when we set `allUserData`, so components can access it directly.
  user: null,

  // isLoggedIn: Boolean flag that directly tracks if a user session is active (true when allUserData is not null).
  isLoggedIn: false,

  // setUser: Updates `allUserData`, `user`, and `isLoggedIn` in one go whenever login/logout happens.
  setUser: (user) =>
    set({
      allUserData: user,
      user: user
        ? {
            user_id: user.user_id || null,
            username: user.username || null,
            vendor_id: user.vendor_id || null,
          }
        : null,
      isLoggedIn: !!user,
      isVendor: user?.vendor_id > 0,   // To check vendor
    }),

  // setLoading: Updates the loading state during API calls (true while waiting, false after response).
  setLoading: (loading) => set({ loading }),
}));

// Conditionally attach Zustand devtools in the development environment:
if (import.meta.env.DEV) {
  // import.meta.env.DEV is a Vite-specific way to check if the app is running in development mode.
  mountStoreDevtool("Store", useAuthStore);
  // Mounts Zustand devtools with the name "Store". This helps visualize state in browser devtools.
}

export { useAuthStore };
