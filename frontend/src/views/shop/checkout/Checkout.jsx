import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import apiInstance from "../../../utils/axios";
import { useAuthStore } from "../../../store/auth";
import Swal from "sweetalert2";
import { toast } from "../../../utils/toast";
import { useRazorpay } from "react-razorpay";

function Checkout() {
  const [order, setOrder] = useState({});
  const [couponCode, setCouponCode] = useState("");
  const { order_id } = useParams();
  const user = useAuthStore((state) => state.user);
  const { error, isLoading, Razorpay } = useRazorpay();

  const fetchOrderData = async () => {
    try {
      const response = await apiInstance.get(`/checkout/${order_id}/`);
      setOrder(response.data || {});
    } catch (error) {
      console.error("Error fetching order:", error);
    }
  };

  useEffect(() => {
    if (order_id) fetchOrderData();
  }, [order_id]);

  const applyCoupon = async () => {
    console.log("coupon applied: ", couponCode);
    console.log(order_id);
    const formdata = new FormData();
    formdata.append("order_oid", order_id);
    formdata.append("coupon_code", couponCode);
    try {
      const response = await apiInstance.post("coupon/", formdata);
      Swal.fire({
        icon: response.data.icon,
        title: response.data.message,
      });
      fetchOrderData();
    } catch (err) {
      if (err.response) {
        Swal.fire({
          icon: err.response.data.icon,
          title: err.response.data.message,
        });
      } else {
        console.error(err);
      }
    }
  };

  const handleRazorpayCheckout = async () => {
    if (isLoading) {
      Swal.fire({
        icon: "info",
        title: "Loading",
        text: "Razorpay is still loading, please wait.",
      });
      return;
    }
    if (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Failed to load Razorpay: ${error.message}`,
      });
      return;
    }
    try {
      const response = await apiInstance.post(
        `/razorpay-checkout/${order_id}/`
      );
      const { id, amount, currency, key, name, email, contact } = response.data;
      const options = {
        key,
        amount,
        currency,
        order_id: id,
        name: "Your Store Name",
        description: `Order #${order_id}`,
        handler: (response) => {
          Swal.fire({
            icon: "success",
            title: "Payment Successful",
            text: `Payment ID: ${response.razorpay_payment_id}`,
          });
          window.location.href = `/payments-success/${response.razorpay_payment_id}?order_id=${order_id}`;
        },
        prefill: { name, email, contact },
        theme: { color: "#1E40AF" },
      };
      const rzp = new Razorpay(options);
      rzp.on("payment.failed", (response) => {
        Swal.fire({
          icon: "error",
          title: "Payment Failed",
          text: `Order ID: ${response.error.metadata.order_id}`,
        });
        window.location.href = `/payments-failed/${response.error.metadata.order_id}`;
      });
      rzp.open();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to initiate Razorpay checkout.",
      });
      console.error("Error initiating Razorpay checkout:", error);
    }
  };

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
        <div className="w-full sm:w-1/3 bg-white px-6 py-8 sm:px-8 sm:py-10">
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
            {order.discount !== "0.00" && (
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
          {isLoading && (
            <p className="text-gray-700 mt-4">Loading Razorpay...</p>
          )}
          {error && (
            <p className="text-red-600 mt-4">
              Error loading Razorpay: {error.message}
            </p>
          )}
          <button
            onClick={handleRazorpayCheckout}
            disabled={isLoading}
            className="w-full mt-4 bg-blue-500 text-white py-3 rounded-md text-sm uppercase font-semibold hover:bg-blue-600 transition disabled:bg-gray-400"
          >
            Pay with Razorpay
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
