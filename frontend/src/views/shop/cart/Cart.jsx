import React, { useState, useEffect, useContext } from "react";
import CartItem from "./CartItem";
import CartSummary from "./CartSummary";
import { Link } from "react-router-dom";
import apiInstance from "../../../utils/axios";
import { useAuthStore } from "../../../store/auth";
import cartID from "../ProductDetail/CartId";
import log from "loglevel";
import { CartContext } from "../../../plugin/Context";
import { ShoppingBag, ArrowLeft } from "lucide-react";

function Cart() {
  const [cart, setCart] = useState([]);
  const [cartMessage, setCartMessage] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const cart_id = cartID();
  const [cartTotal, setCartTotal] = useState({});
  const [, setCartCount] = useContext(CartContext);

  const fetchCartItems = async () => {
    if (!cart_id || cart_id === "undefined") return [];

    try {
      let items = [];
      let nextUrl = user?.user_id
        ? `/cart-list/${cart_id}/${user.user_id}/`
        : `/cart-list/${cart_id}/`;

      while (nextUrl) {
        const response = await apiInstance.get(nextUrl);
        const data = response.data;

        let pageItems = [];

        if (Array.isArray(data)) {
          pageItems = data;
          nextUrl = null;
        } else if (data && data.results) {
          pageItems = data.results || [];
          nextUrl = data.next || null;
        }

        items = [...items, ...pageItems];
      }

      return items;
    } catch (error) {
      log.error("Error fetching cart items:", error);
      return [];
    }
  };

  const validateAndAdjustCart = async () => {
    if (isAdjusting) return;
    setIsAdjusting(true);

    try {
      const currentCart = await fetchCartItems();
      let adjustedItems = [];
      let hasAdjustments = false;

      for (const item of currentCart) {
        const availableStock = item.product?.stock_qty || 0;
        const currentQty = item.qty || 0;

        if (currentQty > availableStock) {
          hasAdjustments = true;
          adjustedItems.push(
            item.product?.title || `Item #${item.product?.id}`,
          );

          const newQty = availableStock;

          const payload = {
            product: item.product.id,
            qty: newQty,
            price: item.price,
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

      const updatedCart = await fetchCartItems();
      setCart(updatedCart);

      const totalQty = updatedCart.reduce(
        (sum, item) => sum + (item.qty || 0),
        0,
      );
      setCartCount(totalQty);

      if (hasAdjustments && adjustedItems.length > 0) {
        setCartMessage(
          `Stock updated: Quantity adjusted for: ${adjustedItems.join(", ")}`,
        );
        setTimeout(() => setCartMessage(""), 10000);
      }
    } catch (error) {
      log.error("Error in validateAndAdjustCart:", error);
    } finally {
      setIsAdjusting(false);
      setLoading(false);
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
  }, [cart_id, user?.user_id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Loading your bag...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Shopping Cart
          </h1>
          <span className="text-gray-500 font-medium">{cart.length} Items</span>
        </div>

        {cartMessage && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r shadow-sm flex items-start">
            <div className="flex-1 text-sm text-amber-800 font-medium">
              {cartMessage}
            </div>
          </div>
        )}

        {cart.length < 1 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center max-w-2xl mx-auto">
            <div className="mb-6 inline-flex p-6 bg-blue-50 rounded-full">
              <ShoppingBag className="w-16 h-16 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Looks like you haven't added anything to your cart yet. Explore
              our products and find something you love.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-all"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Cart Items */}
            <div className="w-full lg:w-2/3">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Items Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-6 pl-2">Product</div>
                  <div className="col-span-3 text-center">Quantity</div>
                  <div className="col-span-3 text-right pr-2">Total</div>
                </div>

                <div className="divide-y divide-gray-100">
                  <CartItem
                    cartItems={cart}
                    setCart={setCart}
                    setCartTotal={setCartTotal}
                  />
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/products"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Link>
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

export default Cart;
