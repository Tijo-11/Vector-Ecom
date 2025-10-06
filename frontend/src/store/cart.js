// import { create } from "zustand";
// // Zustand is a lightweight state management library for React. The `create` function is used
// // to build custom hooks that manage shared state across components without boilerplate or context providers.

// import { mountStoreDevtool } from "simple-zustand-devtools";
// // simple-zustand-devtools is a handy utility that lets you inspect and debug your Zustand store right
// // from the browser’s developer tools. It helps track state changes and actions for easier debugging.

// import apiInstance from "../utils/axios";
// // Import apiInstance for making API calls to fetch cart items, consistent with ProductOptions.jsx

// import UserData from "../plugin/UserData";
// // Import UserData to get user_id for logged-in users

// import CartId from "../views/shop/ProductDetail/cartId";
// // Import CartId to get cart_id for non-logged-in users

// const useCartStore = create((set) => ({
//   // cartItems: Stores the array of cart items fetched from the /cart/ API.
//   // Each item includes fields like productId, user_id, qty, price, shipping_amount, country, size, color, cart_id.
//   cartItems: [],

//   // loading: Tracks loading state (e.g., during cart fetch requests). Initialized as false.
//   loading: false,

//   // fetchCartItems: Fetches cart items from the /cart/ API, filtered by user_id (if logged in) or cart_id (if not logged in).
//   fetchCartItems: async () => {
//     set({ loading: true });
//     try {
//       const userData = UserData();
//       const cartId = CartId();
//       const params = userData.user_id
//         ? { user_id: userData.user_id }
//         : { cart_id: cartId };
//       const response = await apiInstance.get("cart/", { params });
//       set({ cartItems: response.data || [], loading: false });
//     } catch (error) {
//       console.error("Error fetching cart items:", error);
//       set({ cartItems: [], loading: false });
//     }
//   },
// }));

// // Conditionally attach Zustand devtools in the development environment:
// if (import.meta.env.DEV) {
//   // import.meta.env.DEV is a Vite-specific way to check if the app is running in development mode.
//   mountStoreDevtool("CartStore", useCartStore);
//   // Mounts Zustand devtools with the name "CartStore". This helps visualize state in browser devtools.
// }

// export { useCartStore };
