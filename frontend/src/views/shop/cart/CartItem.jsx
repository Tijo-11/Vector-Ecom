import React, { useState, useEffect } from "react";
import apiInstance from "../../../utils/axios";
import { useAuthStore } from "../../../store/auth";
import cartID from "../ProductDetail/cartID";
import UserCountry from "../ProductDetail/UserCountry";
import { toast } from "../../../utils/toast";

function CartItem({ cartItems, setCart, setCartTotal }) {
  const [product_quantities, setProductQuantities] = useState({});
  const user = useAuthStore((state) => state.user);
  const cart_id = cartID();
  const currentAddress = UserCountry();

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
    const formData = {
      product: product_id,
      user: user?.user_id || null,
      qty: qty_value,
      price: price,
      shipping_amount: shipping_amount,
      color: color || null,
      size: size || null,
      cart_id: cart_id,
      country: currentAddress?.country || null,
    };
    try {
      const response = await apiInstance.post("/cart/", formData);
      console.log(response.data);
      toast.fire({
        icon: "success",
        title: "Cart updated successfully",
      });

      // Refresh cart data
      const cartResponse = await apiInstance.get(
        user?.user_id
          ? `/cart-list/${cart_id}/${user.user_id}/`
          : `/cart-list/${cart_id}/`
      );
      setCart(cartResponse.data || []);

      // Refresh cart totals
      const totalResponse = await apiInstance.get(`/cart-detail/${cart_id}/`);
      setCartTotal({
        itemCount: cartResponse.data.length || 0,
        sub_total: totalResponse.data.sub_total || 0,
        shipping: totalResponse.data.shipping || 0,
        tax: totalResponse.data.tax || 0,
        service_fee: totalResponse.data.service_fee || 0,
        total: totalResponse.data.total || 0,
      });
    } catch (error) {
      console.error("Error updating cart:", error);
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
                  value={product_quantities[c.product.id] || c.qty}
                  onChange={(e) => handleQuantityChange(e, c.product.id)}
                  className="py-2 px-1 border border-gray-200 mr-2 w-16 focus:outline-none"
                />
                <button
                  onClick={() =>
                    updateCart(
                      c.product.id,
                      product_quantities[c.product.id] || c.qty,
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
                <p className="text-xs leading-3 underline text-red-500 pl-5 cursor-pointer">
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
