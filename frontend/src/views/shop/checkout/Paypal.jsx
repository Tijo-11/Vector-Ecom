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

  const initialOptions = {
    "client-id": PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "capture",
  };

  // const handlePaypalCheckout = async (data, actions) => {
  //   if (isLoading) {
  //     Swal.fire({
  //       icon: "info",
  //       title: "Loading",
  //       text: "PayPal is still loading, please wait.",
  //     });
  //     return false; // Prevent PayPal window
  //   }
  //   if (order?.payment_status === "paid") {
  //     Swal.fire({
  //       icon: "warning",
  //       title: "Already Paid",
  //       text: "This order has already been paid. Redirecting to order status.",
  //     }).then(() => {
  //       navigate(`/payments-success/${order_id}`);
  //     });
  //     return false; // Prevent PayPal window
  //   }
  //   if (error) {
  //     Swal.fire({
  //       icon: "error",
  //       title: "Error",
  //       text: `Failed to load PayPal: ${error.message}`,
  //     });
  //     return false; // Prevent PayPal window
  //   }

  //   try {
  //     setIsLoading(true);
  //     return await actions.order.capture();
  //   } catch (err) {
  //     setError(err);
  //     Swal.fire({
  //       icon: "error",
  //       title: "Payment Error",
  //       text: "Failed to process PayPal payment.",
  //     });
  //     return false;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
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
            value: order.total.toString(),
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

      console.log({ name, status, paypalOrderId });

      const response = await fetch(`${API_BASEURL}/verify-paypal-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: order_id,
          paypal_order_id: paypalOrderId,
        }),
      });

      const result = await response.json();
      if (result.success && status === "COMPLETED") {
        Swal.fire({
          icon: "success",
          title: "Payment Successful",
          text: `Payment completed for order #${order_id}`,
        }).then(() => {
          navigate(`/order-success/${order_id}`);
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
