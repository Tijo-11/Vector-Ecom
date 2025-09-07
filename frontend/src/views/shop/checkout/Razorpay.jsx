import React from "react";
import { useRazorpay } from "react-razorpay";
import apiInstance from "../../../utils/axios";
import Swal from "sweetalert2";

function RazorpayButton({ order, order_id }) {
  const { error, isLoading, Razorpay } = useRazorpay();

  const handleRazorpayCheckout = async () => {
    if (isLoading) {
      Swal.fire({
        icon: "info",
        title: "Loading",
        text: "Razorpay is still loading, please wait.",
      });
      return;
    }
    if (order?.payment_status === "paid") {
      Swal.fire({
        icon: "warning",
        title: "Already Paid",
        text: "This order has already been paid. Please visit Order Section in your Profile",
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
        name: "RetroRelics",
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
    <>
      {isLoading && <p className="text-gray-700 mt-4">Loading Razorpay...</p>}
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
    </>
  );
}

export default RazorpayButton;
