import React, { useState, useEffect, useCallback, useRef } from "react";
import apiInstance from "../../../utils/axios";
import Swal from "sweetalert2";
import log from "loglevel";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

/**
 * Manually loads the Razorpay script and retries until window.Razorpay is available.
 * This replaces the useRazorpay() hook which doesn't retry on failure.
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    // Already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if script tag already exists (pending load)
    const existingScript = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => {
        existingScript.remove();
        resolve(false);
      });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      script.remove();
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

function RazorpayButton({ order, order_id }) {
  const [scriptReady, setScriptReady] = useState(!!window.Razorpay);
  const retryRef = useRef(null);
  const mountedRef = useRef(true);

  const attemptLoad = useCallback(async () => {
    if (window.Razorpay) {
      setScriptReady(true);
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!mountedRef.current) return;

    if (loaded && window.Razorpay) {
      setScriptReady(true);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Immediately try to load
    attemptLoad();

    // Keep retrying every 2s until ready
    retryRef.current = setInterval(() => {
      if (window.Razorpay) {
        setScriptReady(true);
        clearInterval(retryRef.current);
        return;
      }
      attemptLoad();
    }, 2000);

    return () => {
      mountedRef.current = false;
      if (retryRef.current) clearInterval(retryRef.current);
    };
  }, [attemptLoad]);

  const handleRazorpayCheckout = async () => {
    if (!scriptReady || !window.Razorpay) return;

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
          localStorage.removeItem("random_string");
        },
        prefill: { name, email, contact },
        theme: { color: "#1E40AF" },
      };

      const rzp = new window.Razorpay(options);
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
      log.error("Error initiating Razorpay checkout:", error);
    }
  };

  return (
    <button
      onClick={handleRazorpayCheckout}
      disabled={!scriptReady}
      className={`w-full mt-4 py-3 rounded-md text-sm uppercase font-semibold transition flex items-center justify-center gap-2 ${
        !scriptReady
          ? "bg-blue-500 text-white cursor-wait"
          : "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
      }`}
    >
      {!scriptReady ? (
        <>
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Preparing Payment...
        </>
      ) : (
        "Pay with Razorpay"
      )}
    </button>
  );
}

export default RazorpayButton;
