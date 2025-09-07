import React, { useState, useEffect } from "react";
import { useRazorpay } from "react-razorpay";
import apiInstance from "../../../utils/axios";
import Swal from "sweetalert2";

function RazorpayButton({ order, order_id }) {
  const { error, isLoading, Razorpay } = useRazorpay();
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Track script loading
  useEffect(() => {
    if (!isLoading && Razorpay) {
      setScriptLoaded(true);
    }
  }, [isLoading, Razorpay]);

  const handleRazorpayCheckout = async () => {
    if (!scriptLoaded) {
      Swal.fire({
        icon: "info",
        title: "Loading",
        text: "Razorpay is still loading, please wait.",
      });
      return;
    }
    if (
      order?.payment_status === "paid" ||
      order?.payment_status === "processing"
    ) {
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
          }).then(() => {
            window.location.href = `/payments-success/${order_id}?session_id=${response.razorpay_payment_id}`;
          });
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
        window.location.href = `/payments-failed/${order_id}`;
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
      {!scriptLoaded && (
        <p className="text-gray-700 mt-4">Loading Razorpay...</p>
      )}
      {error && (
        <p className="text-red-600 mt-4">
          Error loading Razorpay: {error.message}
        </p>
      )}
      <button
        onClick={handleRazorpayCheckout}
        disabled={!scriptLoaded || isLoading}
        className="w-full mt-4 bg-blue-500 text-white py-3 rounded-md text-sm uppercase font-semibold hover:bg-blue-600 transition disabled:bg-gray-400"
      >
        Pay with Razorpay
      </button>
    </>
  );
}

export default RazorpayButton;
