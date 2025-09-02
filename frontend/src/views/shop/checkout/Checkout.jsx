import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import apiInstance from "../../../utils/axios";
import { useAuthStore } from "../../../store/auth";

function Checkout() {
  const [order, setOrder] = useState({});
  const { order_id } = useParams();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await apiInstance.get(`/checkout/${order_id}/`);
        setOrder(response.data || {});
      } catch (error) {
        console.error("Error fetching order:", error);
      }
    };
    if (order_id) fetchOrder();
  }, [order_id]);

  return (
    <div className="container mx-auto mt-10 px-4">
      <div className="flex flex-col sm:flex-row shadow-md my-10">
        <div className="w-full sm:w-3/4 bg-white px-6 py-8 sm:px-10 sm:py-10">
          <h1 className="font-semibold text-2xl mb-4">
            Order #{order_id || "N/A"}
          </h1>
          <h2 className="font-semibold text-xl mb-6">Shipping Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "full_name",
              "email",
              "mobile",
              "address",
              "city",
              "state",
              "country",
            ].map((field) => (
              <div key={field}>
                <p className="text-sm font-medium text-gray-700 capitalize">
                  {field.replace("_", " ")}
                </p>
                <p className="text-gray-900">{order[field] || "N/A"}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full sm:w-1/4 bg-white px-6 py-8 sm:px-8 sm:py-10">
          <h1 className="font-semibold text-2xl border-b pb-4 mb-6">
            Order Summary
          </h1>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-semibold text-sm uppercase text-gray-700">
                Subtotal
              </span>
              <span className="font-semibold text-sm">
                ₹{order.sub_total || "0.00"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-sm uppercase text-gray-700">
                Shipping
              </span>
              <span className="font-semibold text-sm">
                ₹{order.shipping_amount || "0.00"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-sm uppercase text-gray-700">
                Tax
              </span>
              <span className="font-semibold text-sm">
                ₹{order.tax_fee || "0.00"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-sm uppercase text-gray-700">
                Service Fee
              </span>
              <span className="font-semibold text-sm">
                ₹{order.service_fee || "0.00"}
              </span>
            </div>
            <div className="flex justify-between border-t pt-4">
              <span className="font-semibold text-sm uppercase text-gray-700">
                Total
              </span>
              <span className="font-semibold text-sm">
                ₹{order.total || "0.00"}
              </span>
            </div>
          </div>
          <div className="mt-6">
            <label className="font-medium block mb-2 text-sm uppercase text-gray-700">
              Promo Code
            </label>
            <input
              type="text"
              placeholder="Enter your code"
              className="p-2 text-sm w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="w-full mt-4 bg-red-500 text-white py-2 rounded-md text-sm uppercase font-semibold hover:bg-red-600 transition">
              Apply
            </button>
          </div>
          <button className="w-full mt-4 bg-blue-500 text-white py-3 rounded-md text-sm uppercase font-semibold hover:bg-blue-600 transition">
            Pay with Stripe
          </button>
          <button className="w-full mt-2 bg-yellow-400 text-black py-3 rounded-md text-sm uppercase font-semibold hover:bg-yellow-500 transition">
            Pay with PayPal
          </button>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
