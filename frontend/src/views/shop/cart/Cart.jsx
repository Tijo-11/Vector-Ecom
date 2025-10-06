import React, { useState, useEffect } from "react";
import CartItem from "./CartItem";
import CartSummary from "./CartSummary";
import { Link } from "react-router-dom";
import apiInstance from "../../../utils/axios";
import { useAuthStore } from "../../../store/auth";
import cartID from "../ProductDetail/cartId";
import log from "loglevel";

function Cart() {
  const [cart, setCart] = useState([]);
  const user = useAuthStore((state) => state.user);
  const cart_id = cartID();
  const [cartTotal, setCartTotal] = useState({});

  useEffect(() => {
    const fetchCartData = async (cartId, userId) => {
      try {
        const url = userId
          ? `/cart-list/${cartId}/${userId}/`
          : `/cart-list/${cartId}/`;
        const response = await apiInstance.get(url);
        setCart(response.data || []);
        log.debug(response.data);
      } catch (error) {
        log.error("Error fetching cart items:", error);
      }
    };

    if (cart_id && cart_id !== "undefined") {
      if (user && user.user_id) {
        fetchCartData(cart_id, user.user_id);
      } else {
        fetchCartData(cart_id, null);
      }
    }
  }, [cart_id, user]);

  return (
    <div className="container mx-auto mt-10">
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
