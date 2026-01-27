import { create } from "zustand";
import { mountStoreDevtool } from "simple-zustand-devtools";

const useAuthStore = create((set) => ({
  allUserData: null,
  loading: false,
  user: null,
  isLoggedIn: false,

  setUser: (user) =>
    set({
      allUserData: user,
      user: user
        ? {
            user_id: user.user_id || null,
            username: user.username || null,
            vendor_id: user.vendor_id || null,
            is_admin: user.is_admin || false,
          }
        : null,
      isLoggedIn: !!user,
      isVendor: user?.vendor_id > 0,
      isAdmin: user?.is_admin === true,
    }),

  setLoading: (loading) => set({ loading }),
}));

if (import.meta.env.DEV) {
  mountStoreDevtool("Store", useAuthStore);
}

export { useAuthStore };
