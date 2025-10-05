import React, { useState, useEffect, useContext } from "react";
import apiInstance from "../../../utils/axios";
import { useAuthStore } from "../../../store/auth";
import cartID from "../ProductDetail/cartId";
import UserCountry from "../ProductDetail/UserCountry";
import { toast } from "../../../utils/toast";
import { CartContext } from "../../../plugin/Context";
import Swal from "sweetalert2"; // ✅ Add this import

function CartItem({ cartItems, setCart, setCartTotal }) {
  const [productQuantities, setProductQuantities] = useState({});
  const user = useAuthStore((state) => state.user);
  const cart_id = cartID();
  const currentAddress = UserCountry();
  const [cartCount, setCartCount] = useContext(CartContext); // ✅ Added CartContext

  useEffect(() => {
    const initialQuantities = {};
    cartItems.forEach((c) => {
      initialQuantities[c.product.id] = c.qty;
    });
    setProductQuantities(initialQuantities);
  }, [cartItems]);

  const handleQuantityChange = (e, product_id) => {
    const quantity = e.target.value;
    setProductQuantities((prev) => ({
      ...prev,
      [product_id]: quantity,
    }));
  };
  const updateCart = async (
    product_id,
    qty_value,
    price,
    shipping_amount,
    color,
    size
  ) => {
    const qty = Number(qty_value || 0);
    if (qty <= 0) return;

    // Find the cart item
    const cartItem = cartItems.find((c) => c.product.id === product_id);
    if (!cartItem) return;

    // ✅ Check stock before updating
    if (qty > cartItem.product.stock_qty) {
      Swal.fire({
        icon: "warning",
        title: "Stock Limit Reached",
        text: `Only ${cartItem.product.stock_qty} unit(s) of "${cartItem.product.title}" available.`,
        confirmButtonColor: "#2563eb",
      });
      return; // Stop updating
    }

    // Optimistic update for CartContext
    const previousCartCount = cartCount;
    setCartCount((prev) => prev + qty - (cartItem.qty || 0));

    const formData = {
      product: product_id,
      user: user?.user_id || null,
      qty: qty,
      price: price,
      shipping_amount: shipping_amount,
      color: color || null,
      size: size || null,
      cart_id: cart_id,
      country: currentAddress?.country || null,
    };

    try {
      const response = await apiInstance.post("/cart/", formData);
      toast.fire({ icon: "success", title: "Cart updated successfully" });

      // Refresh cart
      const url = user?.user_id
        ? `/cart-list/${cart_id}/${user.user_id}/`
        : `/cart-list/${cart_id}/`;
      const updatedCart = await apiInstance.get(url);
      setCart(updatedCart.data || []);

      const totalResponse = await apiInstance.get(`/cart-detail/${cart_id}/`);
      setCartTotal({
        itemCount: updatedCart.data.length || 0,
        sub_total: totalResponse.data.sub_total || 0,
        shipping: totalResponse.data.shipping || 0,
        tax: totalResponse.data.tax || 0,
        service_fee: totalResponse.data.service_fee || 0,
        total: totalResponse.data.total || 0,
      });

      // Sync CartContext
      const totalQty = updatedCart.data.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      setCartCount(totalQty);
    } catch (error) {
      console.error("Error updating cart:", error);
      setCartCount(previousCartCount);
      toast.fire({ icon: "error", title: "Failed to update cart" });

      // ❌ Rollback optimistic update
      setCartCount(previousCartCount);

      toast.fire({
        icon: "error",
        title: "Failed to update cart",
      });
    }
  };

  const handleDeleteCartItem = async (item_id) => {
    const url = user?.user_id
      ? `/cart-delete/${cart_id}/${item_id}/${user.user_id}/`
      : `/cart-delete/${cart_id}/${item_id}/`;

    try {
      const response = await apiInstance.delete(url);
      console.log(response.data);
      toast.fire({
        icon: "success",
        title: "Item removed from cart",
      });

      const cartResponse = await apiInstance.get(
        user?.user_id
          ? `/cart-list/${cart_id}/${user.user_id}/`
          : `/cart-list/${cart_id}/`
      );
      setCart(cartResponse.data || []);

      const totalResponse = await apiInstance.get(`/cart-detail/${cart_id}/`);
      setCartTotal({
        itemCount: cartResponse.data.length || 0,
        sub_total: totalResponse.data.sub_total || 0,
        shipping: totalResponse.data.shipping || 0,
        tax: totalResponse.data.tax || 0,
        service_fee: totalResponse.data.service_fee || 0,
        total: totalResponse.data.total || 0,
      });

      // ✅ Update CartContext after deletion
      const totalQty = cartResponse.data.reduce(
        (sum, item) => sum + item.qty,
        0
      );
      setCartCount(totalQty);
    } catch (error) {
      console.error("Error deleting cart item:", error);
      toast.fire({
        icon: "error",
        title: "Failed to remove item",
      });
    }
  };

  return (
    <>
      {cartItems.map((c, index) => (
        <div
          key={index}
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
              {c.product.code || "N/A"}
            </p>
            <div className="flex items-center justify-between w-full">
              <p className="text-base font-black leading-none text-gray-800">
                {c.product.title}
              </p>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  value={productQuantities[c.product.id] || c.qty}
                  onChange={(e) => handleQuantityChange(e, c.product.id)}
                  className="py-2 px-1 border border-gray-200 mr-2 w-16 focus:outline-none"
                />
                <button
                  onClick={() =>
                    updateCart(
                      c.product.id,
                      productQuantities[c.product.id] || c.qty,
                      c.product.price,
                      c.product.shipping_amount,
                      c.color,
                      c.size
                    )
                  }
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm"
                >
                  Update
                </button>
              </div>
            </div>
            <p className="text-xs leading-3 text-gray-600 pt-2">
              Height: {c.product.height || "N/A"}
            </p>
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
            <p className="w-96 text-xs leading-3 text-gray-600">
              Composition: {c.product.composition || "N/A"}
            </p>
            <div className="flex items-center justify-between pt-5">
              <div className="flex items-center">
                <p className="text-xs leading-3 underline text-gray-800 cursor-pointer">
                  Add to favorites
                </p>
                <p
                  onClick={() => handleDeleteCartItem(c.id)}
                  className="text-xs leading-3 underline text-red-500 hover:text-red-600 pl-5 cursor-pointer"
                >
                  Remove
                </p>
              </div>
              <p className="text-base font-black leading-none text-gray-800">
                ₹{c.price}
              </p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default CartItem;
