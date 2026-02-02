// CartItem.jsx
import React, { useState, useEffect, useRef, useContext } from "react";
import apiInstance from "../../../utils/axios";
import { useAuthStore } from "../../../store/auth";
import cartID from "../ProductDetail/cartId";
import UserCountry from "../ProductDetail/UserCountry";
import { toast } from "../../../utils/toast";
import { CartContext } from "../../../plugin/Context";
import Swal from "sweetalert2";
import log from "loglevel";

function CartItem({ cartItems, setCart, setCartTotal }) {
  const [productQuantities, setProductQuantities] = useState({});
  const [updatingItems, setUpdatingItems] = useState({});
  const debounceTimeouts = useRef({});
  const user = useAuthStore((state) => state.user);
  const cart_id = cartID();
  const currentAddress = UserCountry();
  const [cartCount, setCartCount] = useContext(CartContext);

  // Shared fetch function that handles both paginated and non-paginated responses
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
      log.error("Error fetching cart items in CartItem:", error);
      return [];
    }
  };

  useEffect(() => {
    const initial = {};
    cartItems.forEach((c) => {
      initial[c.product.id] = c.qty;
    });
    setProductQuantities(initial);
  }, [cartItems]);

  useEffect(() => {
    return () => {
      Object.values(debounceTimeouts.current).forEach(clearTimeout);
    };
  }, []);

  const updateCart = async (
    product_id,
    qty_value,
    price,
    color,
    size,
  ) => {
    const qty = Number(qty_value);
    if (isNaN(qty) || qty <= 0) return;

    const cartItem = cartItems.find((c) => c.product.id === product_id);
    if (!cartItem) return;

    const currentStock = cartItem.product.stock_qty || 0;

    if (qty > currentStock) {
      Swal.fire({
        icon: "warning",
        title: "Cannot Update",
        text: `Only ${currentStock} unit(s) available.`,
        confirmButtonColor: "#2563eb",
      });
      setProductQuantities((prev) => ({ ...prev, [product_id]: currentStock }));
      return;
    }

    setUpdatingItems((prev) => ({ ...prev, [product_id]: true }));

    const previousCount = cartCount;
    setCartCount((prev) => prev + qty - cartItem.qty);

    const formData = {
      product: product_id,
      user: user?.user_id || null,
      qty,
      price,
      // shipping_amount: 0, // Handled by backend
      color: color || null,
      size: size || null,
      cart_id,
      country: currentAddress?.country || null,
    };

    try {
      const response = await apiInstance.post("/cart/", formData);

      if (response.data.message && response.data.message.includes("adjusted")) {
        toast.fire({
          icon: "warning",
          title: "Quantity Adjusted",
          text: "Stock changed – updated to maximum available.",
        });
      } else {
        toast.fire({ icon: "success", title: "Cart updated" });
      }

      // Properly fetch fresh cart items (handles pagination)
      const updatedItems = await fetchCartItems();
      setCart(updatedItems);

      const totalQty = updatedItems.reduce(
        (sum, item) => sum + (item.qty || 0),
        0,
      );
      setCartCount(totalQty);

      // Fetch totals with fallback for empty cart (404)
      let totals = {
        itemCount: updatedItems.length || 0,
        mrp_total: 0,
        discounted_total: 0,
        shipping: 0,
        grand_total: 0,
      };
      try {
        const totalResponse = await apiInstance.get(`/cart-detail/${cart_id}/`);
        totals = {
          ...totals,
          mrp_total: totalResponse.data?.mrp_total || 0,
          discounted_total: totalResponse.data?.discounted_total || 0,
          shipping: totalResponse.data?.shipping || 0,
          grand_total: totalResponse.data?.grand_total || 0,
        };
      } catch (totalError) {
        log.warn(
          "Failed to fetch cart totals (likely empty cart):",
          totalError,
        );
      }
      setCartTotal(totals);
    } catch (error) {
      log.error("Error updating cart:", error);
      setCartCount(previousCount);
      toast.fire({ icon: "error", title: "Update failed" });
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [product_id]: false }));
    }
  };

  const handleIncrease = (product_id) => {
    const currentQty = Number(productQuantities[product_id] || 1);
    const cartItem = cartItems.find((c) => c.product.id === product_id);
    const maxStock = cartItem?.product.stock_qty || 0;

    if (currentQty + 1 > maxStock) {
      Swal.fire({
        icon: "warning",
        title: "Stock Limit Exceeded",
        text: `Only ${maxStock} unit(s) available for "${cartItem.product.title}".`,
        confirmButtonColor: "#2563eb",
        timer: 5000,
        timerProgressBar: true,
      });
      return;
    }

    const newQty = currentQty + 1;
    setProductQuantities((prev) => ({ ...prev, [product_id]: newQty }));

    if (debounceTimeouts.current[product_id])
      clearTimeout(debounceTimeouts.current[product_id]);
    debounceTimeouts.current[product_id] = setTimeout(() => {
      updateCart(
        product_id,
        newQty,
        cartItem.product.price,
        cartItem.color,
        cartItem.size,
      );
    }, 600);
  };

  const handleDecrease = (product_id) => {
    const currentQty = Number(productQuantities[product_id] || 1);
    if (currentQty <= 1) return;

    const newQty = currentQty - 1;
    setProductQuantities((prev) => ({ ...prev, [product_id]: newQty }));

    const cartItem = cartItems.find((c) => c.product.id === product_id);
    if (debounceTimeouts.current[product_id])
      clearTimeout(debounceTimeouts.current[product_id]);
    debounceTimeouts.current[product_id] = setTimeout(() => {
      updateCart(
        product_id,
        newQty,
        cartItem.product.price,
        cartItem.color,
        cartItem.size,
      );
    }, 600);
  };

  const handleInputChange = (e, product_id) => {
    let value = e.target.value.replace(/[^0-9]/g, "");
    if (value === "") {
      setProductQuantities((prev) => ({ ...prev, [product_id]: "" }));
      return;
    }

    const num = Number(value);
    const cartItem = cartItems.find((c) => c.product.id === product_id);
    const maxStock = cartItem?.product.stock_qty || 0;

    if (num > maxStock) {
      Swal.fire({
        icon: "warning",
        title: "Stock Limit Exceeded",
        text: `Only ${maxStock} unit(s) available. Quantity capped.`,
        confirmButtonColor: "#2563eb",
        timer: 5000,
        timerProgressBar: true,
      });
      value = maxStock.toString();
    } else if (num < 1) {
      value = "1";
    }

    setProductQuantities((prev) => ({ ...prev, [product_id]: value }));

    if (debounceTimeouts.current[product_id])
      clearTimeout(debounceTimeouts.current[product_id]);
    debounceTimeouts.current[product_id] = setTimeout(() => {
      updateCart(
        product_id,
        value || 1,
        cartItem.product.price,
        cartItem.color,
        cartItem.size,
      );
    }, 600);
  };

  // Fully working remove button
  const handleDeleteCartItem = async (item_id) => {
    const previousCart = [...cartItems];
    const previousCount = cartCount;

    const deleteUrl = user?.user_id
      ? `/cart-delete/${cart_id}/${item_id}/${user.user_id}/`
      : `/cart-delete/${cart_id}/${item_id}/`;

    try {
      // Delete the item
      await apiInstance.delete(deleteUrl);

      // Properly fetch fresh cart items (handles pagination)
      const updatedItems = await fetchCartItems();
      setCart(updatedItems);

      // Update global cart count
      const totalQty = updatedItems.reduce(
        (sum, item) => sum + (item.qty || 0),
        0,
      );
      setCartCount(totalQty);

      // Update totals with fallback
      let totals = {
        itemCount: updatedItems.length || 0,
        mrp_total: 0,
        discounted_total: 0,
        shipping: 0,
        grand_total: 0,
      };
      try {
        const totalResponse = await apiInstance.get(`/cart-detail/${cart_id}/`);
        totals = {
          ...totals,
          mrp_total: totalResponse.data?.mrp_total || 0,
          discounted_total: totalResponse.data?.discounted_total || 0,
          shipping: totalResponse.data?.shipping || 0,
          grand_total: totalResponse.data?.grand_total || 0,
        };
      } catch (totalError) {
        log.warn(
          "Failed to fetch totals after delete (likely empty cart):",
          totalError,
        );
      }
      setCartTotal(totals);

      toast.fire({ icon: "success", title: "Item removed from cart" });
    } catch (error) {
      log.error("Error removing cart item:", error);
      // Rollback on failure
      setCart(previousCart);
      setCartCount(previousCount);
      toast.fire({ icon: "error", title: "Failed to remove item" });
    }
  };

  return (
    <>
      {cartItems.map((c) => {
        const currentQty = productQuantities[c.product.id] ?? c.qty;
        const maxStock = c.product.stock_qty || 0;
        const atMax = Number(currentQty) >= maxStock;

        const originalPrice = parseFloat(c.product?.price ?? 0);
        const discount = parseFloat(c.product?.offer_discount ?? 0);
        const offerPrice =
          discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;

        return (
          <div
            key={c.id}
            className="md:flex items-stretch py-8 md:py-10 lg:py-8 border-t border-gray-50"
          >
            <div className="md:w-4/12 2xl:w-1/4 w-full">
              <img
                src={c.product.image}
                alt={c.product.title}
                className="h-full object-cover md:block hidden rounded-[10px]"
              />
              <img
                src={c.product.image}
                alt={c.product.title}
                className="md:hidden w-full h-full object-cover rounded-[10px]"
              />
            </div>
            <div className="md:pl-3 md:w-8/12 2xl:w-3/4 flex flex-col justify-center">
              <p className="text-xs leading-3 text-gray-800 md:pt-0 pt-4">
                {c.product.sku || "N/A"}
              </p>
              <div className="flex items-center justify-between w-full">
                <p className="text-base font-black leading-none text-gray-800">
                  {c.product.title}
                </p>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button
                        onClick={() => handleDecrease(c.product.id)}
                        disabled={
                          Number(currentQty) <= 1 || updatingItems[c.product.id]
                        }
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        value={currentQty}
                        onChange={(e) => handleInputChange(e, c.product.id)}
                        disabled={updatingItems[c.product.id]}
                        className="w-16 text-center py-2 focus:outline-none disabled:bg-gray-100"
                      />
                      <button
                        onClick={() => handleIncrease(c.product.id)}
                        disabled={atMax || updatingItems[c.product.id]}
                        title={atMax ? "Stock limit reached" : ""}
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                    {updatingItems[c.product.id] && (
                      <div className="flex items-center text-blue-600 text-sm">
                        <svg
                          className="animate-spin h-4 w-4 mr-1"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Updating...
                      </div>
                    )}
                  </div>
                  {atMax && (
                    <p className="text-orange-600 text-xs font-medium mt-1">
                      Maximum stock reached ({maxStock} available)
                    </p>
                  )}
                </div>
              </div>
              {c.size && c.size !== "no size" && (
                <p className="text-xs leading-3 text-gray-600 py-4">
                  Size: {c.size}
                </p>
              )}
              {c.color && c.color !== "no color" && (
                <p className="text-xs leading-3 text-gray-600 py-4">
                  Color: {c.color}
                </p>
              )}
              <div className="flex items-center justify-between pt-5">
                <div className="flex items-center">
                  <p
                    onClick={() => handleDeleteCartItem(c.id)}
                    className="text-xs leading-3 underline text-red-500 hover:text-red-600 cursor-pointer"
                  >
                    Remove
                  </p>
                </div>
                <p className="text-base font-black leading-none text-gray-800">
                  {discount > 0 ? (
                    <>
                      <span className="line-through text-gray-500 mr-2">
                        £{originalPrice.toFixed(2)}
                      </span>
                      £{offerPrice.toFixed(2)}
                    </>
                  ) : (
                    `£${originalPrice.toFixed(2)}`
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

export default CartItem;
