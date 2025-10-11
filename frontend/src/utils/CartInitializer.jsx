import { useEffect, useContext, useState } from "react";
import { CartContext } from "../plugin/Context";
import { useAuthStore } from "../store/auth";
import CartId, {
  generateRandomString,
} from "../views/shop/ProductDetail/cartId";
import apiInstance from "./axios";
import log from "./logger";

const CartInitializer = () => {
  const [cartCount, setCartCount] = useContext(CartContext);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, isLoggedIn } = useAuthStore();

  // Reset initialization on auth change
  useEffect(() => {
    setIsInitialized(false);
  }, [isLoggedIn, user?.user_id]);

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
      log.debug("Cart fetched", { url, totalQty });
    } catch (err) {
      log.error("Cart fetch error", err);
      setCartCount(0);
    }
  };

  useEffect(() => {
    const initializeCart = async () => {
      if (isInitialized) return;

      let currentCartId = CartId();

      if (isLoggedIn && user?.user_id) {
        const userCartKey = `cart_id_user_${user.user_id}`;

        try {
          const mergeResponse = await apiInstance.post("/cart-merge/", {
            user_id: user.user_id,
            cart_id: currentCartId,
          });

          const { cart_id, cart_count, start_new } = mergeResponse.data;

          if (start_new || !cart_id) {
            currentCartId = generateRandomString();
            localStorage.setItem(userCartKey, currentCartId);
            setCartCount(0);
          } else {
            currentCartId = cart_id;
            localStorage.setItem(userCartKey, currentCartId);
            setCartCount(cart_count || 0);
          }

          localStorage.removeItem("random_string");
          log.debug("User cart loaded", { cart_id: currentCartId, cart_count });
        } catch (err) {
          log.error("Cart merge error", err);
          if (!currentCartId) {
            currentCartId = generateRandomString();
            localStorage.setItem(userCartKey, currentCartId);
          }
          setCartCount(0);
        }
      } else {
        if (!currentCartId) {
          currentCartId = generateRandomString();
          localStorage.setItem("random_string", currentCartId);
        }
      }

      await fetchCartItems(currentCartId);
      setIsInitialized(true);
    };

    initializeCart();

    // Listen for payment success event to reset cart
    const handlePaymentSuccess = () => {
      if (isLoggedIn && user?.user_id) {
        const userCartKey = `cart_id_user_${user.user_id}`;
        const newCartId = generateRandomString();
        localStorage.setItem(userCartKey, newCartId);
        setCartCount(0);
        setIsInitialized(false); // Force re-initialization
      } else {
        localStorage.removeItem("random_string");
        setCartCount(0);
      }
    };

    window.addEventListener("paymentSuccess", handlePaymentSuccess);

    return () => {
      window.removeEventListener("paymentSuccess", handlePaymentSuccess);
    };
  }, [isLoggedIn, user?.user_id, setCartCount, isInitialized]);

  return null;
};

export default CartInitializer;
