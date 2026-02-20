import React, { useState, useEffect } from "react";
import CheckoutForm from "./CheckoutForm";
import CartSummary from "../cart/CartSummary";
import apiInstance from "../../../utils/axios";
import { useAuthStore } from "../../../store/auth";
import cartID from "../ProductDetail/CartId";
import log from "loglevel";
import { Link } from "react-router-dom";
import { MapPin, ArrowLeft } from "lucide-react";

function Address() {
  const [cart, setCart] = useState([]);
  const [loadingCart, setLoadingCart] = useState(true);
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
        // Handle paginated responses
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];
        setCart(data);
      } catch (error) {
        log.error("Error fetching cart items:", error);
      } finally {
        setLoadingCart(false);
      }
    };

    if (cart_id && cart_id !== "undefined") {
      fetchCartData(cart_id, user?.user_id);
    } else {
      setLoadingCart(false);
    }
  }, [cart_id, user]);

  return (
    <div className="bg-gray-50 min-h-screen py-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            to="/cart"
            className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Shipping Information
          </h1>
        </div>

        {loadingCart ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-gray-500 font-medium">Loading your cart...</p>
          </div>
        ) : cart.length < 1 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <Link to="/products" className="text-blue-600 hover:underline">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Checkout Form */}
            <div className="w-full lg:w-2/3">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="bg-blue-50 p-2 rounded-full">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Delivery Address
                    </h2>
                    <p className="text-sm text-gray-500">
                      Where should we send your order?
                    </p>
                  </div>
                </div>

                <CheckoutForm />
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="w-full lg:w-1/3">
              <div className="lg:sticky lg:top-24">
                <CartSummary cartItems={cart} setCartTotal={setCartTotal} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Address;
