// src/components/CartInitializer.jsx
import { useEffect, useContext } from "react";
import { CartContext } from "../plugin/Context";
import CartId from "../views/shop/ProductDetail/cartId";
import UserData from "../plugin/UserData";
import apiInstance from "../utils/axios";

const CartInitializer = () => {
  const [cartCount, setCartCount] = useContext(CartContext);
  const cart_id = CartId();
  const userData = UserData();

  useEffect(() => {
    // Add safety checks
    if (!cart_id) {
      console.log("No cart_id available yet");
      setCartCount(0);
      return;
    }

    const url = userData?.user_id
      ? `/cart-list/${cart_id}/${userData?.user_id}/`
      : `/cart-list/${cart_id}/`;

    console.log("Fetching cart from:", url);

    apiInstance
      .get(url)
      .then((res) => {
        console.log("Cart data received:", res.data);
        const totalQty = res.data.reduce((sum, item) => sum + item.qty, 0);
        setCartCount(totalQty);
      })
      .catch((err) => {
        console.error("Cart fetch error:", err);
        // Don't let cart errors break the app
        setCartCount(0);
      });
  }, [cart_id, userData?.user_id, setCartCount]);

  return null;
};

export default CartInitializer;
