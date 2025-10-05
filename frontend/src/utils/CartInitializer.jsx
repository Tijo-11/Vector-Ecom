import { useEffect, useContext, useState } from "react";
import { CartContext } from "../plugin/Context";
import { useAuthStore } from "../store/auth";
import CartId, {
  generateRandomString,
} from "../views/shop/ProductDetail/cartId";
import apiInstance from "./axios";

const CartInitializer = () => {
  const [cartCount, setCartCount] = useContext(CartContext);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, isLoggedIn } = useAuthStore();

  // Reset initialization on auth change
  useEffect(() => {
    setIsInitialized(false);
  }, [isLoggedIn, user?.user_id]);

  useEffect(() => {
    const initializeCart = async () => {
      if (isInitialized) return;

      let currentCartId = CartId();

      if (isLoggedIn && user?.user_id) {
        const userCartKey = `cart_id_user_${user.user_id}`;

        try {
          // CRITICAL: Don't send any anonymous cart_id - just fetch user's cart from backend
          const mergeResponse = await apiInstance.post("/cart-merge/", {
            user_id: user.user_id,
            cart_id: null, // Never send anonymous cart
          });

          const { cart_id, cart_count, start_new } = mergeResponse.data;

          if (start_new || !cart_id) {
            // No active cart → start new
            currentCartId = generateRandomString();
            localStorage.setItem(userCartKey, currentCartId);
            setCartCount(0);
          } else {
            // Use cart from backend
            currentCartId = cart_id;
            localStorage.setItem(userCartKey, currentCartId);
            setCartCount(cart_count || 0);
          }

          // Clean up any anonymous cart reference
          localStorage.removeItem("random_string");

          console.log("User cart loaded:", {
            cart_id: currentCartId,
            cart_count,
          });
        } catch (err) {
          console.error("Cart merge error:", err);
          // Fallback: Generate new if error
          if (!currentCartId) {
            currentCartId = generateRandomString();
            localStorage.setItem(userCartKey, currentCartId);
          }
          setCartCount(0);
        }
      } else {
        // Anonymous user
        if (!currentCartId) {
          currentCartId = generateRandomString();
          localStorage.setItem("random_string", currentCartId);
        }
      }

      // Fetch count
      await fetchCartItems(currentCartId);
      setIsInitialized(true);
    };

    const fetchCartItems = async (cartId) => {
      if (!cartId) {
        setCartCount(0);
        return;
      }

      const url =
        isLoggedIn && user?.user_id
          ? `/cart-list/${cartId}/${user.user_id}/`
          : `/cart-list/${cartId}/`;

      try {
        const res = await apiInstance.get(url);
        const totalQty = res.data.reduce((sum, item) => sum + item.qty, 0);
        setCartCount(totalQty);
        console.log("Cart fetched:", { url, totalQty });
      } catch (err) {
        console.error("Cart fetch error:", err);
        setCartCount(0);
      }
    };

    initializeCart();
  }, [isLoggedIn, user?.user_id, setCartCount, isInitialized]);

  return null;
};

export default CartInitializer;
