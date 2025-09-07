import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";
import Swal from "sweetalert2";
import { API_BASEURL, SERVER_URL } from "../../../utils/constants";
import { useNavigate } from "react-router-dom";

function PaypalButton({ order, order_id }) {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  if (isLoading) {
    Swal.fire({
      icon: "info",
      title: "Loading",
      text: "Razorpay is still loading, please wait.",
    });
    return;
  }

  const initialOptions = {
    "client-id": PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "capture",
  };
  const INRtoUSD = (inrValue) => {
    const conversionRate = 0.012; // example: 1 INR = 0.012 USD
    return (inrValue * conversionRate).toFixed(2); // 2 decimal places
  };
  if (
    order?.payment_status === "paid" ||
    order?.payment_status === "processing"
  ) {
    Swal.fire({
      icon: "warning",
      title: "Already Paid",
      text: "This order has already been paid. Redirecting to order status.",
    }).then(() => {
      navigate(`/payments-success/${order_id}`);
    });
  }

  const handlePaypalCheckout = (data, actions) => {
    if (isLoading) return actions.reject();
    if (order?.payment_status === "paid") return actions.reject();
    if (error) return actions.reject();
    return actions.resolve();
  };

  const createOrder = (data, actions) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            currency_code: "USD", //PayPal officially doesn’t support INR for direct payments in most regions.
            //If you pass "INR", it may fail silently or cause session errors.use "USD" for sandbox testing.
            value: INRtoUSD(order.total), // ✅ converted value
          },
        },
      ],
    });
  };

  const onApprove = async (data, actions) => {
    try {
      const details = await actions.order.capture();
      const name = details.payer.name.given_name;
      const status = details.status;
      const paypalOrderId = data.orderID;
      const captureId = details.purchase_units[0].payments.captures[0].id;

      console.log({ name, status, paypalOrderId });

      const response = await fetch(
        `${API_BASEURL}payment-success/${order_id}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_id: order_id, // your DB order
            paypal_order_id: data.orderID, // PayPal order ID
            paypal_capture_id: captureId, // PayPal capture ID (needed for backend verification)
          }),
        }
      );
      //👉 The order did exist, but once you called actions.order.capture(), PayPal closed it and it can’t be queried again via /v2/checkout/orders/{id}.

      //This is normal — after capture, the order ID is no longer valid for lookups. Instead, PayPal expects you to verify using the capture ID.
      console.log("Frontend orderID:", data.orderID);

      const result = await response.json();
      if ((result.success || response.ok) && status === "COMPLETED") {
        Swal.fire({
          icon: "success",
          title: "Payment Successful",
          text: `Payment completed for order #${order_id}`,
        }).then(() => {
          navigate(
            `/payments-success/${order_id}?paypal_capture_id=${captureId}`
          );
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Payment Verification Failed",
          text: "Unable to verify payment with server.",
        });
      }
    } catch (err) {
      setError(err);
      Swal.fire({
        icon: "error",
        title: "Payment Error",
        text: "Failed to verify PayPal payment.",
      });
    }
  };

  const onError = (err) => {
    setError(err);
    Swal.fire({
      icon: "error",
      title: "PayPal Error",
      text: "An error occurred with PayPal payment.",
    });
  };

  return (
    <PayPalScriptProvider
      options={initialOptions}
      onError={(err) => setError(err)}
    >
      <PayPalButtons
        className="mt-3"
        createOrder={createOrder}
        onApprove={onApprove}
        onError={onError}
        onClick={handlePaypalCheckout}
      />
    </PayPalScriptProvider>
  );
}

export default PaypalButton;
