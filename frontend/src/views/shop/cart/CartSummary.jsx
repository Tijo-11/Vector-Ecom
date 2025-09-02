import React, { useState, useEffect } from "react";
import apiInstance from "../../../utils/axios";
import cartID from "../ProductDetail/cartID";
import CheckoutForm from "./CheckoutForm";

function CartSummary({ cartItems, setCartTotal }) {
  const [cart_total, setCartTotalLocal] = useState({
    itemCount: cartItems.length || 0,
    sub_total: 0,
    shipping: 0,
    tax: 0,
    service_fee: 0,
    total: 0,
  });
  const cart_id = cartID();

  useEffect(() => {
    const fetchCartTotal = async () => {
      if (cart_id && cart_id !== "undefined") {
        try {
          const response = await apiInstance.get(`/cart-detail/${cart_id}/`);
          const newTotals = {
            itemCount: cartItems.length || 0,
            sub_total: response.data.sub_total || 0,
            shipping: response.data.shipping || 0,
            tax: response.data.tax || 0,
            service_fee: response.data.service_fee || 0,
            total: response.data.total || 0,
          };
          setCartTotalLocal(newTotals);
          setCartTotal(newTotals);
        } catch (error) {
          console.error("Error fetching cart totals:", error);
        }
      }
    };
    fetchCartTotal();
  }, [cart_id, cartItems, setCartTotal]);

  const handleOrderSubmit = (formData) => {
    // Pass form data to parent or handle additional logic if needed
    console.log("Order submitted with data:", { ...formData, cart_total });
  };

  return (
    <div id="summary" className="w-full sm:w-1/4 md:w-1/2 px-8 py-10">
      <h1 className="font-semibold text-2xl border-b pb-8">Order Summary</h1>
      <div className="space-y-4">
        <div className="flex justify-between mt-10">
          <span className="font-semibold text-sm uppercase text-gray-700">
            Items {cart_total.itemCount}
          </span>
          <span className="font-semibold text-sm">
            ₹{cart_total.sub_total.toFixed(2)}
          </span>
        </div>
        <div>
          <label className="font-medium block mb-3 text-sm uppercase text-gray-700">
            Shipping
          </label>
          <select className="block p-2 text-gray-600 w-full text-sm border rounded-md">
            <option>
              Standard shipping - ₹{cart_total.shipping.toFixed(2)}
            </option>
          </select>
        </div>
        <div className="border-t mt-8 pt-4">
          <div className="flex font-semibold justify-between py-4 text-sm uppercase text-gray-700">
            <span>Tax</span>
            <span>₹{cart_total.tax.toFixed(2)}</span>
          </div>
          <div className="flex font-semibold justify-between py-4 text-sm uppercase text-gray-700">
            <span>Service Fee</span>
            <span>₹{cart_total.service_fee.toFixed(2)}</span>
          </div>
          <div className="flex font-semibold justify-between py-4 text-sm uppercase text-gray-700">
            <span>Total cost</span>
            <span>₹{cart_total.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <CheckoutForm onSubmit={handleOrderSubmit} />
    </div>
  );
}

export default CartSummary;
