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
  const RETRY_DELAY = 2000;

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
          if (razorpayPaymentId || paypalCaptureId) {
            if (attempt === 0) {
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }

            const formData = new FormData();
            formData.append("order_id", order_id);
            if (razorpayPaymentId)
              formData.append("session_id", razorpayPaymentId);
            if (paypalCaptureId)
              formData.append("paypal_capture_id", paypalCaptureId);

            const verifyResponse = await apiInstance.post(
              `/payment-success/${order_id}/`,
              formData,
              { headers: { "X-Request-ID": requestId } }
            );

            const responseStatus = verifyResponse.data.message || "unpaid";

            if (
              responseStatus === "payment_successful" ||
              responseStatus === "already_paid"
            ) {
              window.dispatchEvent(new Event("paymentSuccess"));
              setStatus(responseStatus);
            } else if (
              responseStatus === "unpaid" &&
              attempt < MAX_RETRIES - 1
            ) {
              setRetryCount(attempt + 1);
              await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
              return attemptVerification(attempt + 1);
            } else {
              setStatus(responseStatus);
            }
          }

          // Clear guest cart after success
          const userData = localStorage.getItem("userData");
          const userObj = userData ? JSON.parse(userData) : null;
          if (!userObj?.user_id) {
            localStorage.removeItem("random_string");
          }

          // Fetch full order details
          const orderResponse = await apiInstance.get(`/checkout/${order_id}/`);
          setOrder(orderResponse.data || {});
        } catch (error) {
          log.error("PaymentSuccess error:", error);

          if (error.response?.data?.message === "already_paid") {
            window.dispatchEvent(new Event("paymentSuccess"));
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
              : "We couldn't verify your payment."}
          </p>
          <p className="text-gray-600 text-sm mb-4">
            If money was deducted, contact support with Order ID:{" "}
            <strong>#{order_id}</strong>
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
          Order confirmation sent to: <strong>{order.email || "N/A"}</strong>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Customer Details */}
          <div>
            <h2 className="font-semibold text-xl mb-4">Customer Details</h2>
            <p>
              <strong>Name:</strong> {order.full_name || "N/A"}
            </p>
            <p>
              <strong>Email:</strong> {order.email || "N/A"}
            </p>
            <p>
              <strong>Mobile:</strong> {order.mobile || "N/A"}
            </p>
            <p>
              <strong>Address:</strong> {order.address || "N/A"},{" "}
              {order.city || "N/A"}, {order.state || "N/A"},{" "}
              {order.country || "N/A"}
            </p>
          </div>

          {/* Payment Summary */}
          <div>
            <h2 className="font-semibold text-xl mb-4">Payment Summary</h2>

            {/* Order Items - Show original price per item */}
            {order.orderitem && order.orderitem.length > 0 ? (
              order.orderitem.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between mb-2 p-2 bg-gray-50 rounded-md"
                >
                  <span className="text-gray-700">
                    {item.product?.title || "Product"} × {item.qty}
                  </span>
                  <span className="text-gray-700 font-medium">
                    ₹
                    {parseFloat(item.initial_total || item.total || 0).toFixed(
                      2
                    )}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">Loading items...</p>
            )}

            {/* Totals */}
            <div className="mt-6 border-t pt-4 space-y-2">
              {/* Original Subtotal (before discount) */}
              <div className="flex justify-between text-lg font-semibold">
                <span>Subtotal</span>
                <span>₹{parseFloat(order.initial_total || 0).toFixed(2)}</span>
              </div>

              {/* Offer Discount */}
              {order.saved && parseFloat(order.saved) > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Discount (Offers)</span>
                  <span>-₹{parseFloat(order.saved).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>
                  ₹{parseFloat(order.shipping_amount || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax</span>
                <span>₹{parseFloat(order.tax_fee || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>Service Fee</span>
                <span>₹{parseFloat(order.service_fee || 0).toFixed(2)}</span>
              </div>

              {/* Final Total */}
              <div className="flex justify-between text-xl font-bold border-t pt-3 mt-4 text-gray-900">
                <span>Total Paid</span>
                <span>₹{parseFloat(order.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate(`/view-order/${order_id}/`)}
            className="bg-blue-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-700 transition"
          >
            View Order Details
          </button>
          <button
            onClick={() => window.print()}
            className="bg-green-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-green-700 transition"
          >
            Print Invoice
          </button>
          <a
            href="/"
            className="bg-gray-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-gray-700 transition text-center block"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
