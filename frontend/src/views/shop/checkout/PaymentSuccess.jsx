import React, { useState, useEffect, useContext } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import apiInstance from "../../../utils/axios";
import { v4 as uuidv4 } from "uuid";
import log from "loglevel";
import cartID from "../ProductDetail/cartId";
import { useAuthStore } from "../../../store/auth";
import { CartContext } from "../../../plugin/Context";
import { CheckCircle2, FileText, Ban, Loader2, Printer, ArrowRight, ShoppingBag } from "lucide-react";

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
  const paymentMethodQuery = urlParams.get("payment_method");

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
            // ignore
        }
      }
      setCartCount(0);
      if (!user?.user_id) {
        localStorage.removeItem("random_string");
      }
    } catch (error) {
      setCartCount(0);
    }
  };

  useEffect(() => {
    const verifyPayment = async () => {
      if (hasRun) return;
      setHasRun(true);

      const requestId = uuidv4();
      const attemptVerification = async (attempt = 0) => {
        try {
          if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 1500));

          if (!razorpayPaymentId && !paypalCaptureId) {
            const orderResponse = await apiInstance.get(`/view-order/${order_id}/`);
            const fetchedOrder = orderResponse.data;

            if (fetchedOrder && (fetchedOrder.payment_status === "processing" || fetchedOrder.payment_status === "paid")) {
              await clearCart();
              setOrder(fetchedOrder);
              setStatus("payment_successful");
              return;
            } else {
              setStatus("unpaid");
              return;
            }
          }

          const formData = new FormData();
          formData.append("order_id", order_id);
          if (razorpayPaymentId) formData.append("session_id", razorpayPaymentId);
          if (paypalCaptureId) formData.append("paypal_capture_id", paypalCaptureId);

          const verifyResponse = await apiInstance.post(
            `/payment-success/${order_id}/`,
            formData,
            { headers: { "X-Request-ID": requestId } },
          );

          const responseStatus = verifyResponse.data.message || "unpaid";

          if (responseStatus === "payment_successful" || responseStatus === "already_paid") {
            await clearCart();
            const orderResponse = await apiInstance.get(`/view-order/${order_id}/`);
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
          if (error.response?.data?.message === "already_paid") {
            await clearCart();
            const orderResponse = await apiInstance.get(`/view-order/${order_id}/`);
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
  }, [order_id, razorpayPaymentId, paypalCaptureId, hasRun]);

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Order</h1>
        <p className="text-gray-600 text-center max-w-md">
          Please wait while we verify your payment.
        </p>
        {retryCount > 0 && (
          <p className="text-blue-600 mt-4 text-sm font-medium">
            Verifying... (Attempt {retryCount + 1}/{MAX_RETRIES})
          </p>
        )}
        <p className="text-red-500 mt-8 text-sm font-medium bg-red-50 px-4 py-2 rounded-full">
          Do not reload or leave this page
        </p>
      </div>
    );
  }

  if (status === "unpaid" || status === "cancelled") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white shadow-lg rounded-2xl p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
             <Ban className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="font-bold text-2xl mb-2 text-gray-900">Payment Failed</h1>
          <p className="text-gray-600 mb-6">
            {status === "cancelled" ? "Your payment was cancelled." : "We couldn't verify your payment."}
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-sm mb-6 text-left">
             <p className="font-medium text-gray-900">Order #{order_id}</p>
             <p className="text-gray-500 text-xs mt-1">If money was deducted, please contact support.</p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              Retry Verification
            </button>
            <button
              onClick={() => navigate("/cart")}
              className="text-gray-600 font-medium hover:underline"
            >
              Return to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  const originalSubTotal = order.orderitem?.reduce((acc, item) => acc + item.price * item.qty, 0) || 0;
  // Use passed param or order status to determine method display name
  
  const displayPaymentMethod = 
     paymentMethodQuery === "COD" ? "Cash on Delivery" :
     paymentMethodQuery === "Wallet" ? "Wallet" :
     razorpayPaymentId ? "Online (Razorpay)" :
     paypalCaptureId ? "Online (PayPal)" : 
     order.payment_status === "processing" ? "Cash on Delivery (Pending)" : "Online Payment";

  return (
    <div className="bg-gray-100 min-h-screen py-10 print:bg-white print:py-0">
      <div id="invoice-section" className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden print:shadow-none">
        
        {/* Success Header */}
        <div className="bg-green-600 p-8 text-white text-center print:hidden">
           <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
             <CheckCircle2 className="w-8 h-8 text-white" />
           </div>
           <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
           <p className="text-green-100 text-lg">Thank you for your purchase.</p>
        </div>

        {/* Invoice Body */}
        <div className="p-8 sm:p-12">
           
           <div className="flex justify-between items-start mb-10 border-b pb-8">
              <div>
                 <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-gray-400" />
                    Invoice
                 </h2>
                 <p className="text-gray-500 mt-1">Order #{order_id}</p>
              </div>
              <div className="text-right">
                 <p className="font-semibold text-gray-900">{displayPaymentMethod}</p>
                 <p className="text-sm text-gray-500 mt-1">
                    {new Date().toLocaleDateString()}
                 </p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
              <div>
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Billed To</h3>
                 <p className="font-bold text-gray-900 text-lg">{order.full_name}</p>
                 <p className="text-gray-600 mt-1">{order.email}</p>
                 <p className="text-gray-600">{order.mobile}</p>
              </div>
              <div className="md:text-right">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Shipped To</h3>
                 <p className="text-gray-800 font-medium">{order.address}</p>
                 <p className="text-gray-600">{order.city}, {order.state}</p>
                 <p className="text-gray-600">{order.country} - {order.postal_code}</p>
              </div>
           </div>

           {/* Items Table */}
           <div className="mb-10">
              <div className="bg-gray-50 rounded-t-lg p-4 grid grid-cols-12 text-xs font-bold text-gray-500 uppercase tracking-wider">
                 <div className="col-span-6">Item Description</div>
                 <div className="col-span-2 text-center">Qty</div>
                 <div className="col-span-4 text-right">Price</div>
              </div>
              <div className="border border-t-0 border-gray-100 rounded-b-lg">
                 {order.orderitem?.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 p-4 border-b border-gray-50 last:border-0 text-sm">
                       <div className="col-span-6 font-medium text-gray-900">
                          {item.product?.title}
                       </div>
                       <div className="col-span-2 text-center text-gray-600">{item.qty}</div>
                       <div className="col-span-4 text-right font-medium text-gray-900">
                          ₹{(item.price * item.qty).toFixed(2)}
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Totals */}
           <div className="flex flex-col items-end space-y-3 text-sm">
               <div className="flex justify-between w-full md:w-1/2 text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{originalSubTotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between w-full md:w-1/2 text-gray-600">
                  <span>Shipping</span>
                  <span>₹{parseFloat(order.shipping_amount ?? 0).toFixed(2)}</span>
               </div>
               <div className="flex justify-between w-full md:w-1/2 text-gray-600">
                  <span>Tax / VAT</span>
                  <span>₹{parseFloat(order.tax_fee ?? 0).toFixed(2)}</span>
               </div>
               {(Number(order.offer_saved ?? 0) + Number(order.coupon_saved ?? 0)) > 0 && (
                   <div className="flex justify-between w-full md:w-1/2 text-green-600">
                      <span>Discount</span>
                      <span>-₹{(Number(order.offer_saved ?? 0) + Number(order.coupon_saved ?? 0)).toFixed(2)}</span>
                   </div>
               )}
               <div className="flex justify-between w-full md:w-1/2 pt-4 border-t border-gray-100 text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>₹{parseFloat(order.total ?? 0).toFixed(2)}</span>
               </div>
           </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 p-8 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
            <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition"
            >
               <Printer className="w-5 h-5" /> Print Invoice
            </button>

            <div className="flex gap-4">
               <button 
                  onClick={() => navigate("/")}
                  className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition flex items-center gap-2"
               >
                  <ShoppingBag className="w-5 h-5" /> Continue Shopping
               </button>
               <button 
                  onClick={() => navigate("/dashboard/orders")}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center gap-2"
               >
                  View My Orders <ArrowRight className="w-5 h-5" />
               </button>
            </div>
        </div>

      </div>
      
      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
        }
      `}</style>
    </div>
  );
}

export default PaymentSuccess;
