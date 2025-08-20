import { create } from "zustand"; //Zustand is a lightweight state management library for React. The create
// function is used to build custom hooks that manage shared state across components—without boilerplate
// or context providers.
import { mountStoreDevtool } from "simple-zustand-devtools";
//simple-zustand-devtools is a handy utility that lets you inspect and debug your Zustand store right from
// your browser's developer tools. Once you mount it, you can track state changes, see actions, and get a
// clearer view of your app’s state flow.

const useAuthStore = create((set, get) => ({
  //set: Function to update the store’s state.get: Function to retrieve the current state.
  allUserData: null, //Stores user information (e.g., user_id, username). Initialized as null
  loading: false, //Tracks loading state (e.g., during login). Initialized as false
  //Define a user function to return user-related data:
  user: () => ({
    user_id: get().allUserData?.user_id || null, // Uses optional chaining to safely access user_id; returns
    // null if allUserData is undefined
    username: get().allUserData?.username || null,
  }),
  //Define a setUser function to update allUserData:
  setUser: (user) => ({ allUserData: user }),
  // Define a setLoading function to update the loading state:
  setLoading: (loading) => set({ loading }),
  isLoggedIn: () => get().allUserData !== null,
  //Checks if user is logged in — returns true if allUserData exists (i.e., not null),
  // meaning a user session is active.
}));
//Conditionally attach Zustand dev tools in the development environment:
if (import.meta.env.DEV) {
  //import.meta.env.DEV is a Vite-specific way to check if the app is running in
  // development mode.
  mountStoreDevtool("Store", useAuthStore); //This conditional ensures the devtools are only active during
  // development, keeping production builds clean and performant.
}

export { useAuthStore };
