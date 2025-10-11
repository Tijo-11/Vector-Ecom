import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import apiInstance from "../../../utils/axios";
import { v4 as uuidv4 } from "uuid";
import log from "loglevel";

function PaymentSuccess() {
  const { order_id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState({});
  const [status, setStatus] = useState("verifying");
  const [retryCount, setRetryCount] = useState(0);
  const [hasRun, setHasRun] = useState(false);
  const navigate = useNavigate();

  const MAX_RETRIES = 5;
  const RETRY_DELAY = 2000; // 2 seconds

  // Detect query params
  const urlParams = new URLSearchParams(location.search);
  const razorpayPaymentId = urlParams.get("session_id");
  const paypalCaptureId = urlParams.get("paypal_capture_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (hasRun) return;
      setHasRun(true);

      const requestId = uuidv4();
      log.debug(
        `PaymentSuccess check (order_id=${order_id}, requestId=${requestId})`
      );

      const attemptVerification = async (attempt = 0) => {
        try {
          if (razorpayPaymentId) {
            // Add delay before first attempt to let Razorpay process
            if (attempt === 0) {
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }

            const formData = new FormData();
            formData.append("order_id", order_id);
            formData.append("session_id", razorpayPaymentId);

            log.debug(`Verification attempt ${attempt + 1}/${MAX_RETRIES}`);

            const verifyResponse = await apiInstance.post(
              `/payment-success/${order_id}/`,
              formData,
              { headers: { "X-Request-ID": requestId } }
            );

            log.debug("Razorpay verification response:", verifyResponse.data);
            const responseStatus = verifyResponse.data.message || "unpaid";

            // Check if payment is still processing
            if (responseStatus === "unpaid" && attempt < MAX_RETRIES - 1) {
              log.debug(
                `Payment still processing, retrying in ${RETRY_DELAY}ms...`
              );
              setRetryCount(attempt + 1);
              await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
              return attemptVerification(attempt + 1);
            }

            setStatus(responseStatus);
          } else if (paypalCaptureId) {
            // PayPal verification with retry
            if (attempt === 0) {
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }

            const formData = new FormData();
            formData.append("order_id", order_id);
            formData.append("paypal_capture_id", paypalCaptureId);

            log.debug(
              `PayPal verification attempt ${attempt + 1}/${MAX_RETRIES}`
            );

            const verifyResponse = await apiInstance.post(
              `/payment-success/${order_id}/`,
              formData,
              { headers: { "X-Request-ID": requestId } }
            );

            log.debug("PayPal verification response:", verifyResponse.data);
            const responseStatus = verifyResponse.data.message || "unpaid";

            if (responseStatus === "unpaid" && attempt < MAX_RETRIES - 1) {
              log.debug(
                `Payment still processing, retrying in ${RETRY_DELAY}ms...`
              );
              setRetryCount(attempt + 1);
              await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
              return attemptVerification(attempt + 1);
            }

            setStatus(responseStatus);
          }

          // Clear guest cartId after successful payment
          const userData = localStorage.getItem("userData");
          const userObj = userData ? JSON.parse(userData) : null;
          if (!userObj?.user_id) {
            localStorage.removeItem("random_string");
            log.debug("Guest cartId cleared from localStorage");
          }

          // Fetch order details
          const orderResponse = await apiInstance.get(`/checkout/${order_id}/`);
          log.debug("Order response:", orderResponse.data);
          setOrder(orderResponse.data || {});
        } catch (error) {
          log.error("PaymentSuccess error:", error);

          if (error.response?.data?.message === "already_paid") {
            setStatus("already_paid");
            try {
              const orderResponse = await apiInstance.get(
                `/checkout/${order_id}/`
              );
              setOrder(orderResponse.data || {});
            } catch (orderError) {
              log.error("Failed to fetch order:", orderError);
            }
          } else if (attempt < MAX_RETRIES - 1) {
            // Retry on error
            log.debug(`Error occurred, retrying in ${RETRY_DELAY}ms...`);
            setRetryCount(attempt + 1);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            return attemptVerification(attempt + 1);
          } else {
            setStatus("unpaid");
          }
        }
      };

      await attemptVerification();
    };

    verifyPayment();
  }, [order_id, razorpayPaymentId, paypalCaptureId, hasRun]);

  if (status === "verifying") {
    return (
      <div className="container mx-auto mt-10 px-4">
        <div className="bg-white shadow-md rounded-md p-8 text-center">
          <h1 className="font-semibold text-2xl mb-4 text-yellow-600">
            <i className="fas fa-spinner fa-spin mr-2"></i>Payment Verifying
          </h1>
          <p className="text-gray-700 font-bold">
            Please hold on while we verify your payment.
          </p>
          {retryCount > 0 && (
            <p className="text-blue-600 mt-2">
              Verification attempt {retryCount + 1} of {MAX_RETRIES}...
            </p>
          )}
          <p className="text-red-600 mt-2">Do not reload or leave this page.</p>
        </div>
      </div>
    );
  }

  if (status === "unpaid" || status === "cancelled") {
    return (
      <div className="container mx-auto mt-10 px-4">
        <div className="bg-white shadow-md rounded-md p-8 text-center">
          <h1 className="font-semibold text-2xl mb-4 text-red-600">
            <i className="fas fa-ban mr-2"></i>Payment Verification Failed
          </h1>
          <p className="text-gray-700 mb-4">
            {status === "cancelled"
              ? "Your payment was cancelled."
              : "We couldn't verify your payment. This might be a temporary issue."}
          </p>
          <p className="text-gray-600 text-sm mb-4">
            If the amount was deducted from your account, please contact support
            with Order ID: <strong>{order_id}</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white py-2 px-4 rounded-md text-sm uppercase font-semibold hover:bg-blue-600 transition"
            >
              Retry Verification
            </button>
            <a
              href="/checkout"
              className="bg-gray-500 text-white py-2 px-4 rounded-md text-sm uppercase font-semibold hover:bg-gray-600 transition"
            >
              Back to Checkout
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-10 px-4">
      <div className="bg-white shadow-md rounded-md p-8">
        <h1 className="font-semibold text-2xl mb-4 text-green-600">
          <i className="fas fa-check-circle mr-2"></i>
          {status === "already_paid"
            ? "Payment Already Confirmed"
            : "Thank you for shopping with us!"}
        </h1>
        <p className="text-gray-700 mb-2">
          Order ID: <strong>#{order_id}</strong>
        </p>
        {razorpayPaymentId && (
          <p className="text-gray-700 mb-2">
            Razorpay Payment ID: <strong>{razorpayPaymentId}</strong>
          </p>
        )}
        {paypalCaptureId && (
          <p className="text-gray-700 mb-2">
            PayPal Capture ID: <strong>{paypalCaptureId}</strong>
          </p>
        )}
        <p className="text-gray-700 mb-4">
          Order confirmation has been sent to:{" "}
          <strong>{order.email || "N/A"}</strong>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Customer Details */}
          <div>
            <h2 className="font-semibold text-xl mb-4">Customer Details</h2>
            <p className="text-gray-700">
              <strong>Name:</strong> {order.full_name || "N/A"}
            </p>
            <p className="text-gray-700">
              <strong>Email:</strong> {order.email || "N/A"}
            </p>
            <p className="text-gray-700">
              <strong>Mobile:</strong> {order.mobile || "N/A"}
            </p>
            <p className="text-gray-700">
              <strong>Address:</strong> {order.address || "N/A"},{" "}
              {order.city || "N/A"}, {order.state || "N/A"},{" "}
              {order.country || "N/A"}
            </p>
          </div>

          {/* Payment Summary */}
          <div>
            <h2 className="font-semibold text-xl mb-4">Payment Summary</h2>
            {order.order_items && order.order_items.length > 0 ? (
              order.order_items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between mb-2 p-2 shadow-sm rounded-md"
                >
                  <span className="text-gray-700">
                    {item.product?.title || "N/A"} x {item.qty || 1}
                  </span>
                  <span className="text-gray-700">₹{item.total || "0.00"}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">Loading items...</p>
            )}

            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">Subtotal</span>
                <span className="text-gray-700">
                  ₹{order.initial_total || "0.00"}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">Shipping</span>
                <span className="text-gray-700">
                  ₹{order.shipping_amount || "0.00"}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">Tax</span>
                <span className="text-gray-700">
                  ₹{order.tax_fee || "0.00"}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">Service Fee</span>
                <span className="text-gray-700">
                  ₹{order.service_fee || "0.00"}
                </span>
              </div>
              {order.saved && parseFloat(order.saved) > 0 && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span className="font-semibold">Discount</span>
                  <span className="font-semibold">-₹{order.saved}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span className="text-gray-800">Total Paid</span>
                <span className="text-gray-800">₹{order.total || "0.00"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-2">
          <button
            onClick={() => navigate(`/view-order/${order_id}/`)}
            className="bg-blue-500 text-white py-2 px-4 rounded-md text-sm uppercase font-semibold hover:bg-blue-600 transition"
          >
            View Order Details
          </button>
          <button
            onClick={() => window.print()}
            className="bg-green-500 text-white py-2 px-4 rounded-md text-sm uppercase font-semibold hover:bg-green-600 transition"
          >
            Print Invoice
          </button>
          <a
            href="/"
            className="bg-gray-500 text-white py-2 px-4 rounded-md text-sm uppercase font-semibold hover:bg-gray-600 transition text-center"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
