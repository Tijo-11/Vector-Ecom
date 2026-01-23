// Updated Cart.jsx (Added global cart count sync + initial loading state for better UX)

import React, { useState, useEffect, useContext } from "react";
import CartItem from "./CartItem";
import CartSummary from "./CartSummary";
import { Link } from "react-router-dom";
import apiInstance from "../../../utils/axios";
import { useAuthStore } from "../../../store/auth";
import cartID from "../ProductDetail/cartId";
import log from "loglevel";
import { CartContext } from "../../../plugin/Context"; // ← Added

function Cart() {
  const [cart, setCart] = useState([]);
  const [cartMessage, setCartMessage] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [loading, setLoading] = useState(true); // ← New: page loading state
  const user = useAuthStore((state) => state.user);
  const cart_id = cartID();
  const [cartTotal, setCartTotal] = useState({});
  const [, setCartCount] = useContext(CartContext); // ← Added to sync global count

  const fetchCartData = async () => {
    if (!cart_id || cart_id === "undefined") return [];
    try {
      const url = user?.user_id
        ? `/cart-list/${cart_id}/${user.user_id}/`
        : `/cart-list/${cart_id}/`;
      const response = await apiInstance.get(url);
      return response.data || [];
    } catch (error) {
      log.error("Error fetching cart items:", error);
      return [];
    }
  };

  const validateAndAdjustCart = async () => {
    if (isAdjusting) return;
    setIsAdjusting(true);

    try {
      const currentCart = await fetchCartData();
      let adjustedItems = [];
      let hasAdjustments = false;

      for (const item of currentCart) {
        const availableStock = item.product?.stock_qty || 0;
        const currentQty = item.qty || 0;

        if (currentQty > availableStock) {
          hasAdjustments = true;
          adjustedItems.push(
            item.product.title || `Item ID ${item.product.id}`,
          );

          const perUnitShipping =
            currentQty > 0 ? item.shipping_amount / currentQty : 0;

          const payload = {
            product: item.product.id,
            qty: availableStock,
            price: item.price,
            shipping_amount: perUnitShipping,
            country: item.country,
            cart_id: cart_id,
            size: item.size || "",
            color: item.color || "",
          };

          if (user?.user_id) payload.user = user.user_id;

          try {
            await apiInstance.post("/cart/", payload);
          } catch (err) {
            log.error("Failed to adjust cart item:", err.response?.data || err);
          }
        }
      }

      // Refetch fresh data
      const updatedCart = await fetchCartData();
      setCart(updatedCart);

      // Sync global cart count
      const totalQty = updatedCart.reduce(
        (sum, item) => sum + (item.qty || 0),
        0,
      );
      setCartCount(totalQty);

      if (hasAdjustments && adjustedItems.length > 0) {
        setCartMessage(
          `Stock updated: Quantity adjusted/removed for: ${adjustedItems.join(", ")}`,
        );
        setTimeout(() => setCartMessage(""), 10000);
      }
    } catch (error) {
      log.error("Error in validateAndAdjustCart:", error);
    } finally {
      setIsAdjusting(false);
      setLoading(false); // ← Page is now loaded
    }
  };

  useEffect(() => {
    validateAndAdjustCart();

    const interval = setInterval(validateAndAdjustCart, 15000);
    const handleFocus = () => validateAndAdjustCart();

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [cart_id, user]);

  if (loading) {
    return (
      <div className="container mx-auto mt-10 text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
        <p className="mt-4 text-lg">Loading your cart...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-10">
      {cartMessage && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-4 rounded mb-6 text-center font-medium">
          {cartMessage}
        </div>
      )}

      <div className="sm:flex shadow-md my-10">
        {cart.length < 1 ? (
          <div className="w-full sm:w-3/4 bg-white px-10 py-10">
            <h1 className="font-semibold text-2xl">Your cart is empty</h1>
            <Link
              to="/"
              className="flex font-semibold text-indigo-600 text-sm mt-10"
            >
              <svg
                className="fill-current mr-2 text-indigo-600 w-4"
                viewBox="0 0 448 512"
              >
                <path d="M134.059 296H436c6.627 0 12-5.373 12-12v-56c0-6.627-5.373-12-12-12H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029 239.029c-9.373 9.373-9.373 24.569 0 33.941l86.059 86.059c15.119 15.119 40.971 4.411 40.971-16.971V296z" />
              </svg>
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="w-full sm:w-3/4 bg-white px-10 py-10">
              <div className="flex justify-between border-b pb-8">
                <h1 className="font-semibold text-2xl">Shopping Cart</h1>
                <h2 className="font-semibold text-2xl">{cart.length} Items</h2>
              </div>
              <CartItem
                cartItems={cart}
                setCart={setCart}
                setCartTotal={setCartTotal}
              />
              <Link
                to="/"
                className="flex font-semibold text-indigo-600 text-sm mt-10"
              >
                <svg
                  className="fill-current mr-2 text-indigo-600 w-4"
                  viewBox="0 0 448 512"
                >
                  <path d="M134.059 296H436c6.627 0 12-5.373 12-12v-56c0-6.627-5.373-12-12-12H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029 239.029c-9.373 9.373-9.373 24.569 0 33.941l86.059 86.059c15.119 15.119 40.971 4.411 40.971-16.971V296z" />
                </svg>
                Continue Shopping
              </Link>
            </div>
            <CartSummary cartItems={cart} setCartTotal={setCartTotal} />
          </>
        )}
      </div>
    </div>
  );
}

export default Cart;
