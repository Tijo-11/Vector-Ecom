import React, { useState, useEffect, useRef, useContext } from "react";
import apiInstance from "../../../utils/axios";
import { useAuthStore } from "../../../store/auth";
import cartID from "../ProductDetail/cartId";
import UserCountry from "../ProductDetail/UserCountry";
import { toast } from "../../../utils/toast";
import { CartContext } from "../../../plugin/Context";
import Swal from "sweetalert2";
import log from "loglevel";
import { Trash2, Plus, Minus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

function CartItem({ cartItems, setCart, setCartTotal }) {
  const [productQuantities, setProductQuantities] = useState({});
  const [updatingItems, setUpdatingItems] = useState({});
  const debounceTimeouts = useRef({});
  const user = useAuthStore((state) => state.user);
  const cart_id = cartID();
  const currentAddress = UserCountry();
  const [cartCount, setCartCount] = useContext(CartContext);

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

  const updateCart = async (product_id, qty_value, price, color, size) => {
    const qty = Number(qty_value);
    if (isNaN(qty) || qty <= 0) return;

    const cartItem = cartItems.find((c) => c.product.id === product_id);
    if (!cartItem) return;

    const currentStock = cartItem.product.stock_qty || 0;
    if (qty > currentStock) {
      Swal.fire({
        icon: "warning",
        title: "Max Quantity Reached",
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
      color: color || null,
      size: size || null,
      cart_id,
      country: currentAddress?.country || null,
    };

    try {
      const response = await apiInstance.post("/cart/", formData);

      if (response.data.message && response.data.message.includes("adjusted")) {
        toast.fire({ icon: "warning", title: "Quantity Adjusted", text: "Stock limit applied." });
      } else {
        toast.fire({ icon: "success", title: "Cart updated" });
      }

      const updatedItems = await fetchCartItems();
      setCart(updatedItems);

      const totalQty = updatedItems.reduce((sum, item) => sum + (item.qty || 0), 0);
      setCartCount(totalQty);

      // Fetch Totals
      try {
        const totalResponse = await apiInstance.get(`/cart-detail/${cart_id}/`);
        setCartTotal({
            mrp_total: totalResponse.data?.mrp_total || 0,
            discounted_total: totalResponse.data?.discounted_total || 0,
            shipping: totalResponse.data?.shipping || 0,
            grand_total: totalResponse.data?.grand_total || 0,
        });
      } catch (err) {
        log.warn("Total fetch failed", err);
      }
    } catch (error) {
      log.error("Error updating cart:", error);
      setCartCount(previousCount);
      toast.fire({ icon: "error", title: "Update failed" });
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [product_id]: false }));
    }
  };

  const handleQtyChange = (product_id, newQty) => {
    const cartItem = cartItems.find((c) => c.product.id === product_id);
    const maxStock = cartItem?.product.stock_qty || 0;

    if (newQty < 1) return;
    if (newQty > maxStock) {
         Swal.fire({
            icon: "warning",
            title: "Max Quantity Reached",
            text: `Only ${maxStock} available.`,
            confirmButtonColor: "#2563eb",
         });
         return;
    }

    setProductQuantities((prev) => ({ ...prev, [product_id]: newQty }));

    if (debounceTimeouts.current[product_id]) clearTimeout(debounceTimeouts.current[product_id]);
    
    debounceTimeouts.current[product_id] = setTimeout(() => {
      updateCart(product_id, newQty, cartItem.product.price, cartItem.color, cartItem.size);
    }, 600);
  };

  const handleDeleteCartItem = async (item_id) => {
    const previousCart = [...cartItems];
    const previousCount = cartCount;
    const deleteUrl = user?.user_id
        ? `/cart-delete/${cart_id}/${item_id}/${user.user_id}/`
        : `/cart-delete/${cart_id}/${item_id}/`;

    try {
      await apiInstance.delete(deleteUrl);
      const updatedItems = await fetchCartItems();
      setCart(updatedItems);
      setCartCount(updatedItems.reduce((sum, item) => sum + (item.qty || 0), 0));

      const totalResponse = await apiInstance.get(`/cart-detail/${cart_id}/`);
      setCartTotal(totalResponse.data);

      toast.fire({ icon: "success", title: "Item removed" });
    } catch (error) {
      setCart(previousCart);
      setCartCount(previousCount);
      toast.fire({ icon: "error", title: "Deletion failed" });
    }
  };

  return (
    <>
      {cartItems.map((c) => {
        const currentQty =  productQuantities[c.product.id] ?? c.qty;
        const discount = parseFloat(c.product?.offer_discount ?? 0);
        const originalPrice = parseFloat(c.product?.price ?? 0);
        const finalPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;
        const itemTotal = finalPrice * currentQty;
        const isUpdating = updatingItems[c.product.id];

        // Ensure we check for null/undefined before accessing strings
        const colorName = c.color?.name || c.color || "No Color"; // Handle object or string
        const sizeName = c.size?.name || c.size || "No Size";     // Handle object or string

        // Simplify display if backend returns "no color" / "no size" string literals
        const hasColor = colorName && colorName.toLowerCase() !== "no color";
        const hasSize = sizeName && sizeName.toLowerCase() !== "no size";

        return (
          <div key={c.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-4 p-6 hover:bg-gray-50 transition-colors group items-center">
            
            {/* Product Info (Col 6) */}
            <div className="md:col-span-6 flex gap-4">
               <div className="w-20 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <Link to={`/product/${c.product.slug}`}>
                    <img src={c.product.image} alt={c.product.title} className="w-full h-full object-cover" />
                  </Link>
               </div>
               <div className="flex flex-col justify-center">
                  <Link to={`/product/${c.product.slug}`} className="font-bold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors mb-1">
                      {c.product.title}
                  </Link>
                  <div className="text-sm text-gray-500 mb-2">
                     {hasSize && <span className="mr-3 bg-gray-100 px-2 py-0.5 rounded text-xs">Size: {sizeName}</span>}
                     {hasColor && <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">Color: {colorName}</span>}
                  </div>
                  <div className="md:hidden font-bold text-gray-900">₹{finalPrice.toFixed(2)}</div>
               </div>
            </div>

            {/* Quantity (Col 3) */}
            <div className="md:col-span-3 flex items-center justify-between md:justify-center">
                <span className="md:hidden text-sm font-medium text-gray-500">Qty:</span>
                <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                    <button 
                       onClick={() => handleQtyChange(c.product.id, Number(currentQty) - 1)}
                       disabled={Number(currentQty) <= 1 || isUpdating}
                       className="p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors rounded-l-lg"
                    >
                       <Minus className="w-4 h-4" />
                    </button>
                    <div className="w-10 text-center font-semibold text-gray-700 text-sm relative">
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mx-auto text-blue-500" /> : currentQty}
                    </div>
                    <button 
                       onClick={() => handleQtyChange(c.product.id, Number(currentQty) + 1)}
                       disabled={isUpdating}
                       className="p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors rounded-r-lg"
                    >
                       <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Total & Remove (Col 3) */}
            <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-6">
                 <div className="hidden md:block font-bold text-gray-900 text-base">
                    ₹{itemTotal.toFixed(2)}
                 </div>
                 <button 
                    onClick={() => handleDeleteCartItem(c.id)}
                    className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium p-2 hover:bg-red-50 rounded-lg transition-all"
                    title="Remove item"
                 >
                    <Trash2 className="w-4 h-4" />
                    <span className="md:hidden">Remove</span>
                 </button>
            </div>

          </div>
        );
      })}
    </>
  );
}

export default CartItem;
