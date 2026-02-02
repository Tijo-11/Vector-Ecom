import React, { useState, useEffect, useContext } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import apiInstance from "../../../utils/axios";
import { v4 as uuidv4 } from "uuid";
import log from "loglevel";
import cartID from "../ProductDetail/cartId";
import { useAuthStore } from "../../../store/auth";
import { CartContext } from "../../../plugin/Context";

function PaymentSuccess() {
  const { order_id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState({});
  const [status, setStatus] = useState("verifying");
  const [retryCount, setRetryCount] = useState(0);
  const [hasRun, setHasRun] = useState(false);
  const navigate = useNavigate();
  const cart_id = cartID();
  const user = useAuthStore((state) => state.user);
  const [cartCount, setCartCount] = useContext(CartContext);
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 2000;
  const urlParams = new URLSearchParams(location.search);
  const razorpayPaymentId = urlParams.get("session_id");
  const paypalCaptureId = urlParams.get("paypal_capture_id");

  const clearCart = async () => {
    if (!cart_id || cart_id === "undefined") {
      setCartCount(0);
      if (!user?.user_id) {
        localStorage.removeItem("random_string");
      }
      return;
    }
    try {
      let items = [];
      let nextUrl = user?.user_id
        ? `/cart-list/${cart_id}/${user.user_id}/`
        : `/cart-list/${cart_id}/`;
      while (nextUrl) {
        const response = await apiInstance.get(nextUrl);
        const data = response.data;
        let pageItems = [];
        if (Array.isArray(data)) {
          pageItems = data;
          nextUrl = null;
        } else if (data && data.results) {
          pageItems = data.results || [];
          nextUrl = data.next || null;
        }
        items = [...items, ...pageItems];
      }
      for (const item of items) {
        const deleteUrl = user?.user_id
          ? `/cart-delete/${cart_id}/${item.id}/${user.user_id}/`
          : `/cart-delete/${cart_id}/${item.id}/`;
        try {
          await apiInstance.delete(deleteUrl);
        } catch (err) {
          log.error(`Failed to delete cart item ${item.id}:`, err);
        }
      }
      setCartCount(0);
      if (!user?.user_id) {
        localStorage.removeItem("random_string");
      }
      log.debug("Cart cleared successfully");
    } catch (error) {
      log.error("Error clearing cart:", error);
      setCartCount(0);
    }
  };

  useEffect(() => {
    const verifyPayment = async () => {
      if (hasRun) return;
      setHasRun(true);

      const requestId = uuidv4();
      log.debug(
        `PaymentSuccess check (order_id=${order_id}, requestId=${requestId})`,
      );

      const attemptVerification = async (attempt = 0) => {
        try {
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }

          // If no payment IDs (likely COD or direct access), fetch via public view-order endpoint
          if (!razorpayPaymentId && !paypalCaptureId) {
            const orderResponse = await apiInstance.get(
              `/view-order/${order_id}/`,
            );
            const fetchedOrder = orderResponse.data;

            if (
              fetchedOrder &&
              (fetchedOrder.payment_status === "processing" ||
                fetchedOrder.payment_status === "paid")
            ) {
              await clearCart();
              setOrder(fetchedOrder);
              setStatus("payment_successful");
              window.dispatchEvent(new Event("paymentSuccess"));
              return;
            } else {
              setStatus("unpaid");
              return;
            }
          }

          // Normal online payment verification
          const formData = new FormData();
          formData.append("order_id", order_id);
          if (razorpayPaymentId)
            formData.append("session_id", razorpayPaymentId);
          if (paypalCaptureId)
            formData.append("paypal_capture_id", paypalCaptureId);

          const verifyResponse = await apiInstance.post(
            `/payment-success/${order_id}/`,
            formData,
            { headers: { "X-Request-ID": requestId } },
          );

          const responseStatus = verifyResponse.data.message || "unpaid";

          if (
            responseStatus === "payment_successful" ||
            responseStatus === "already_paid"
          ) {
            window.dispatchEvent(new Event("paymentSuccess"));
            const clearPromise = clearCart();
            // Use public view-order endpoint for consistency (works for paid/processing orders)
            const orderPromise = apiInstance.get(`/view-order/${order_id}/`);
            const [orderResponse] = await Promise.all([
              orderPromise,
              clearPromise,
            ]);
            setOrder(orderResponse.data || {});
            setStatus(responseStatus);
          } else if (responseStatus === "unpaid" && attempt < MAX_RETRIES - 1) {
            setRetryCount(attempt + 1);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            return attemptVerification(attempt + 1);
          } else {
            setStatus(responseStatus);
          }
        } catch (error) {
          log.error("PaymentSuccess error:", error);
          if (error.response?.data?.message === "already_paid") {
            window.dispatchEvent(new Event("paymentSuccess"));
            const clearPromise = clearCart();
            const orderPromise = apiInstance.get(`/view-order/${order_id}/`);
            const [orderResponse] = await Promise.all([
              orderPromise,
              clearPromise,
            ]);
            setOrder(orderResponse.data || {});
            setStatus("already_paid");
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
  }, [order_id, razorpayPaymentId, paypalCaptureId, hasRun, cart_id, user]);

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-600 mb-8"></div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          Processing Your Order
        </h1>
        <p className="text-lg text-gray-600 text-center max-w-md">
          Please wait while we verify your payment and prepare your invoice.
        </p>
        {retryCount > 0 && (
          <p className="text-blue-600 mt-4">
            Verification attempt {retryCount + 1} of {MAX_RETRIES}...
          </p>
        )}
        <p className="text-red-600 mt-6 font-medium">
          Do not reload or leave this page.
        </p>
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
              href="/"
              className="bg-gray-500 text-white py-2 px-4 rounded-md text-sm uppercase font-semibold hover:bg-gray-600 transition"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Calculate original subtotal
  const originalSubTotal =
    order.orderitem?.reduce((acc, item) => acc + item.price * item.qty, 0) || 0;

  const isCOD =
    !razorpayPaymentId &&
    !paypalCaptureId &&
    order.payment_status === "processing";

  return (
    <>
      <div id="invoice-section" className="container mx-auto mt-10 px-4">
        <div className="bg-white shadow-md rounded-md p-8">
          <h1 className="font-semibold text-2xl mb-4 text-green-600 print:hidden">
            <i className="fas fa-check-circle mr-2"></i>
            {isCOD
              ? "Order Placed Successfully with Cash on Delivery!"
              : status === "already_paid"
                ? "Payment Already Confirmed"
                : "Thank you for shopping with us!"}
          </h1>
          <h1 className="hidden print:block font-semibold text-2xl mb-4 text-green-600">
            <i className="fas fa-file-invoice-dollar mr-2"></i>
            Invoice #{order_id}
          </h1>
          <p className="text-gray-700 mb-2">
            Order ID: <strong>#{order_id}</strong>
          </p>
          <p className="text-gray-700 mb-2">
            Payment Method:{" "}
            <strong>
              {isCOD ? "Cash on Delivery (Pay on Delivery)" : "Online Payment"}
            </strong>
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
                      ₹{(item.price * item.qty).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">No items found.</p>
              )}
              <div className="mt-6 border-t pt-4 space-y-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Subtotal</span>
                  <span>₹{originalSubTotal.toFixed(2)}</span>
                </div>
                {order.offer_saved && parseFloat(order.offer_saved) > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Offers Saved</span>
                    <span>-₹{parseFloat(order.offer_saved).toFixed(2)}</span>
                  </div>
                )}
                {order.coupon_saved && parseFloat(order.coupon_saved) > 0 && (
                  <div className="flex justify-between text-blue-600 font-semibold">
                    <span>Coupon Saved</span>
                    <span>
                      -₹{parseFloat(order.coupon_saved).toFixed(2463)}
                    </span>
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
                <div className="flex justify-between text-xl font-bold border-t pt-3 mt-4 text-gray-900">
                  <span>
                    {isCOD ? "Amount to Pay on Delivery" : "Total Paid"}
                  </span>
                  <span>₹{parseFloat(order.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 print:hidden">
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
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-section,
          #invoice-section * {
            visibility: visible;
          }
          #invoice-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            margin: 0;
            box-shadow: none;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}

export default PaymentSuccess;
