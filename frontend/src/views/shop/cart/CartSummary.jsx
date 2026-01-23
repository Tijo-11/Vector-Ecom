// CartSummary.jsx (Improved message & disable logic)

import React, { useState, useEffect } from "react";
import apiInstance from "../../../utils/axios";
import cartID from "../ProductDetail/cartId";
import log from "loglevel";
import { useNavigate, useLocation } from "react-router-dom";

function CartSummary({ cartItems, setCartTotal }) {
  const [cart_total, setCartTotalLocal] = useState({
    itemCount: cartItems.length || 0,
    mrp_total: 0,
    discounted_total: 0,
    shipping: 0,
    grand_total: 0,
  });
  const cart_id = cartID();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchCartTotal = async () => {
      if (cart_id && cart_id !== "undefined") {
        try {
          const response = await apiInstance.get(`/cart-detail/${cart_id}/`);
          const newTotals = {
            itemCount: cartItems.length || 0,
            mrp_total: response.data.mrp_total || 0,
            discounted_total: response.data.discounted_total || 0,
            shipping: response.data.shipping || 0,
            grand_total: response.data.grand_total || 0,
          };
          setCartTotalLocal(newTotals);
          setCartTotal(newTotals);
        } catch (error) {
          log.error("Error fetching cart totals:", error);
        }
      }
    };
    fetchCartTotal();
  }, [cart_id, cartItems, setCartTotal]);

  const hasInsufficientStock = cartItems.some(
    (item) => (item.qty || 0) > (item.product?.stock_qty || 0),
  );

  const isAddressPage = location.pathname === "/address";

  return (
    <div id="summary" className="w-full sm:w-1/4 md:w-1/2 px-8 py-10">
      <h1 className="font-semibold text-2xl border-b pb-8">Order Summary</h1>
      <div className="space-y-4">
        <div className="flex justify-between mt-10">
          <span className="font-semibold text-sm uppercase text-gray-700">
            MRP ({cart_total.itemCount}{" "}
            {cart_total.itemCount > 1 ? "items" : "item"})
          </span>
          <span className="font-semibold text-sm">
            ₹{cart_total.mrp_total.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-sm uppercase text-gray-700">
            Discounted Price
          </span>
          <span className="font-semibold text-sm">
            ₹{cart_total.discounted_total.toFixed(2)}
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
            <span>Grand Total</span>
            <span>₹{cart_total.grand_total.toFixed(2)}</span>
          </div>
        </div>

        {hasInsufficientStock && (
          <p className="text-orange-600 text-center font-medium mt-4 animate-pulse">
            Adjusting cart for available stock...
          </p>
        )}
      </div>

      {!isAddressPage && (
        <button
          onClick={() => navigate("/address")}
          disabled={hasInsufficientStock}
          className={`w-full mt-6 py-3 rounded-md text-sm uppercase font-semibold transition block text-center ${
            hasInsufficientStock
              ? "bg-gray-400 text-gray-700 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {hasInsufficientStock
            ? "Please wait – updating stock"
            : "Proceed to Address"}
        </button>
      )}
    </div>
  );
}

export default CartSummary;
