import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import apiInstance from "../../../utils/axios";
import { v4 as uuidv4 } from "uuid";

function PaymentSuccess() {
  const { order_id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState({});
  const [status, setStatus] = useState("verifying");
  const [hasRun, setHasRun] = useState(false);

  // Detect query params
  const urlParams = new URLSearchParams(location.search);
  const razorpayPaymentId = urlParams.get("session_id"); // Razorpay only
  const paypalCaptureId = urlParams.get("paypal_capture_id"); // PayPal only

  useEffect(() => {
    const verifyPayment = async () => {
      if (hasRun) return;
      setHasRun(true);

      const requestId = uuidv4();
      console.log(
        `PaymentSuccess check (order_id=${order_id}, requestId=${requestId})`
      );

      try {
        if (razorpayPaymentId) {
          // ✅ Razorpay needs server-side verification
          const formData = new FormData();
          formData.append("order_id", order_id);
          formData.append("session_id", razorpayPaymentId);

          const verifyResponse = await apiInstance.post(
            `/payment-success/${order_id}/`,
            formData,
            { headers: { "X-Request-ID": requestId } }
          );

          console.log("Razorpay verification response:", verifyResponse.data);
          setStatus(verifyResponse.data.message || "unpaid");
        } else {
          // ✅ PayPal already verified in backend during onApprove
          setStatus("paid");
        }

        // In both cases, fetch order details
        const orderResponse = await apiInstance.get(`/checkout/${order_id}/`);
        console.log("Order response:", orderResponse.data);
        setOrder(orderResponse.data || {});
      } catch (error) {
        console.error("PaymentSuccess error:", error);
        if (error.response?.data?.message === "already_paid") {
          setStatus("already_paid");
          const orderResponse = await apiInstance.get(`/checkout/${order_id}/`);
          setOrder(orderResponse.data || {});
          console.log(orderResponse.data);
        } else {
          setStatus("unpaid");
        }
      }
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
            <i className="fas fa-ban mr-2"></i>Unpaid Invoice
          </h1>
          <p className="text-gray-700">Please try making the payment again.</p>
          <a
            href="/checkout"
            className="inline-block bg-blue-500 text-white py-2 px-4 rounded-md text-sm uppercase font-semibold hover:bg-blue-600 transition mt-4"
          >
            Try Again
          </a>
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
            ? "Already Paid"
            : "Thank you for shopping with us!"}
        </h1>
        <p className="text-gray-700 mb-2">
          Please note your order ID: <strong>#{order_id}</strong>
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
          We have sent an order summary to your linked email address:{" "}
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
                    {item.product?.title || "N/A"}
                  </span>
                  <span className="text-gray-700">₹{item.price || "0.00"}</span>
                </div>
              ))
            ) : (
              /*<p className="text-gray-700">No items found</p>*/ <div></div>
              //Fix this logic
            )}
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">
                  Initial Total
                </span>
                <span className="text-gray-700">
                  ₹{order.initial_total || "0.00"}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">
                  Shipping Fee
                </span>
                <span className="text-gray-700">
                  ₹{order.shipping_amount || "0.00"}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">Tax Fee</span>
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
              <div className="flex justify-between mb-2">
                {order.saved !== "0.00" && (
                  <>
                    <span className="font-semibold text-sm uppercase text-gray-700">
                      Discount
                    </span>
                    <span className="font-semibold text-sm">
                      -₹{order.saved || "0.00"}
                    </span>
                  </>
                )}
              </div>

              <div className="flex justify-between font-semibold border-t pt-2">
                <span className="text-gray-700">Total</span>
                <span className="text-gray-700">₹{order.total || "0.00"}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-2">
          <button
            onClick={() => alert("View Order functionality to be implemented")}
            className="bg-blue-500 text-white py-2 px-4 rounded-md text-sm uppercase font-semibold hover:bg-blue-600 transition m-2"
          >
            View Order
          </button>
          <button
            onClick={() => window.print()}
            className="bg-blue-500 text-white py-2 px-4 rounded-md text-sm uppercase font-semibold hover:bg-blue-600 transition m-2"
          >
            Download Invoice
          </button>
          <a
            href="/"
            className="bg-gray-500 text-white py-2 px-4 rounded-md text-sm uppercase font-semibold hover:bg-gray-600 transition m-2"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
