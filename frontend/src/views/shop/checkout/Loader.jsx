import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import RazorpayButton from "./Razorpay";
import PaypalButton from "./Paypal";

function PaymentScriptLoader({ order, order_id }) {
  const [scriptsLoaded, setScriptsLoaded] = useState({
    razorpay: false,
    paypal: false,
  });

  useEffect(() => {
    let retries = 3;
    const loadScripts = async () => {
      try {
        // Load Razorpay script
        const razorpayScript = document.createElement("script");
        razorpayScript.src = "https://checkout.razorpay.com/v1/checkout.js";
        razorpayScript.async = true;
        razorpayScript.onload = () =>
          setScriptsLoaded((prev) => ({ ...prev, razorpay: true }));
        razorpayScript.onerror = () => {
          throw new Error("Razorpay script failed to load");
        };
        document.body.appendChild(razorpayScript);

        // Load PayPal script
        const paypalScript = document.createElement("script");
        paypalScript.src = `https://www.paypal.com/sdk/js?client-id=${
          import.meta.env.VITE_PAYPAL_CLIENT_ID
        }&currency=USD`;
        paypalScript.async = true;
        paypalScript.onload = () =>
          setScriptsLoaded((prev) => ({ ...prev, paypal: true }));
        paypalScript.onerror = () => {
          throw new Error("PayPal script failed to load");
        };
        document.body.appendChild(paypalScript);

        // Timeout for script loading
        const timeout = setTimeout(() => {
          if (!scriptsLoaded.razorpay || !scriptsLoaded.paypal) {
            Swal.fire({
              icon: "error",
              title: "Loading Error",
              text: "Payment scripts took too long to load. Please refresh the page.",
            });
          }
        }, 10000); // 10-second timeout

        return () => {
          clearTimeout(timeout);
          document.body.removeChild(razorpayScript);
          document.body.removeChild(paypalScript);
        };
      } catch (error) {
        if (retries > 0) {
          retries -= 1;
          setTimeout(loadScripts, 2000); // Retry after 2 seconds
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to load payment scripts after multiple attempts.",
          });
        }
      }
    };
    loadScripts();
  }, []);

  return (
    <div className="mt-6">
      {!scriptsLoaded.razorpay && !scriptsLoaded.paypal && (
        <p className="text-gray-700">Loading payment options...</p>
      )}
      {scriptsLoaded.razorpay && (
        <RazorpayButton order={order} order_id={order_id} />
      )}
      {scriptsLoaded.paypal && (
        <PaypalButton order={order} order_id={order_id} />
      )}
    </div>
  );
}

export default PaymentScriptLoader;
