import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import apiInstance from "../../../utils/axios";
import { useAuthStore } from "../../../store/auth";
import Swal from "sweetalert2";
import RazorpayButton from "./Razorpay";
import PaypalButton from "./Paypal";
import Loader from "./Loader";
import log from "loglevel";

function Checkout() {
  const [order, setOrder] = useState({});
  const [couponCode, setCouponCode] = useState("");
  const { order_id } = useParams();
  const user = useAuthStore((state) => state.user);

  const fetchOrderData = async () => {
    try {
      const response = await apiInstance.get(`/checkout/${order_id}/`);
      setOrder(response.data || {});
    } catch (error) {
      log.error("Error fetching order:", error);
    }
  };

  useEffect(() => {
    if (order_id) fetchOrderData();
  }, [order_id]);

  const applyCoupon = async () => {
    const formdata = new FormData();
    formdata.append("order_oid", order_id);
    formdata.append("coupon_code", couponCode);
    try {
      const response = await apiInstance.post("coupon/", formdata);
      Swal.fire({
        icon: response.data.icon,
        title: response.data.message,
      });
      if (response.data.icon === "success") {
        await fetchOrderData(); // Ensure data is fetched after success
      }
    } catch (err) {
      if (err.response) {
        Swal.fire({
          icon: err.response.data.icon,
          title: err.response.data.message,
        });
      } else {
        log.error(err);
      }
    }
  };

  return (
    <div className="container mx-auto mt-10 px-4">
      <div className="flex flex-col sm:flex-row shadow-md my-10">
        {/* Shipping Details */}
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

        {/* Order Summary */}
        <div className="w-full sm:w-1/3 bg-white px-6 py-8 sm:px-8 sm:py-10">
          <h1 className="font-semibold text-2xl border-b pb-4 mb-6">
            Order Summary
          </h1>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-semibold text-sm uppercase text-gray-700">
                Initial Total
              </span>
              <span className="font-semibold text-sm">
                ₹{order.initial_total || "0.00"}
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
            {order.saved !== "0.00" && (
              <div className="flex justify-between">
                <span className="font-semibold text-sm uppercase text-gray-700">
                  Discount
                </span>
                <span className="font-semibold text-sm">
                  -₹{order.saved || "0.00"}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-4">
              <span className="font-semibold text-sm uppercase text-gray-700">
                Total
              </span>
              <span className="font-semibold text-sm">
                ₹{order.total || "0.00"}
              </span>
            </div>
          </div>

          {/* Coupon Section */}
          <div className="mt-6">
            <label className="font-medium block mb-2 text-sm uppercase text-gray-700">
              Promo Code
            </label>
            <input
              type="text"
              placeholder="Enter your code"
              onChange={(e) => setCouponCode(e.target.value)}
              className="p-2 text-sm w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={applyCoupon}
              className="w-full mt-4 bg-red-500 text-white py-2 rounded-md text-sm uppercase font-semibold hover:bg-red-600 transition"
            >
              Apply
            </button>
          </div>

          {/* Payment Buttons */}
          <RazorpayButton order={order} order_id={order_id} />
          <PaypalButton order={order} order_id={order_id} />
          {/* <Loader order={order} order_id={order_id} /> */}
        </div>
      </div>
    </div>
  );
}

export default Checkout;
