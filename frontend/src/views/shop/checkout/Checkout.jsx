import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiInstance from "../../../utils/axios";
import Swal from "sweetalert2";
import RazorpayButton from "./Razorpay";
import PaypalButton from "./Paypal";
import log from "loglevel";
import { useAuthStore } from "../../../store/auth";
import {
  CreditCard,
  Wallet,
  Truck,
  Tag,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";

function Checkout() {
  const [order, setOrder] = useState({});
  const [couponCode, setCouponCode] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const { order_id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // States for selected payment method
  const [paymentMethod, setPaymentMethod] = useState("razorpay"); // Default

  const fetchOrderData = async () => {
    try {
      const response = await apiInstance.get(`/checkout/${order_id}/`);
      setOrder(response.data || {});
    } catch (error) {
      log.error("Error fetching order:", error);
      Swal.fire({
        icon: "error",
        title: "Order Not Found",
        text: "Redirecting to cart...",
      });
      navigate("/cart");
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    if (!user?.user_id) return;
    try {
      setWalletLoading(true);
      const response = await apiInstance.get(
        `/customer/wallet/${user.user_id}/`,
      );
      setWalletBalance(parseFloat(response.data.balance) || 0);
    } catch (error) {
      log.error("Error fetching wallet:", error);
      setWalletBalance(0);
    } finally {
      setWalletLoading(false);
    }
  };

  const refreshOrderData = async () => {
    try {
      const response = await apiInstance.get(`/checkout/${order_id}/`);
      setOrder(response.data || {});
    } catch (error) {
      log.error("Error refreshing order:", error);
    }
  };

  useEffect(() => {
    if (order_id) fetchOrderData();
  }, [order_id]);

  useEffect(() => {
    if (user?.user_id) fetchWalletBalance();
  }, [user]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      Swal.fire({ icon: "warning", title: "Please enter a coupon code" });
      return;
    }
    const formdata = new FormData();
    formdata.append("order_oid", order_id);
    formdata.append("coupon_code", couponCode);
    try {
      const response = await apiInstance.post("coupon/", formdata);
      Swal.fire({
        icon: response.data.icon,
        title: response.data.message,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
      if (response.data.icon === "success") {
        setCouponCode("");
        await refreshOrderData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to apply coupon";
      Swal.fire({ icon: "error", title: msg });
    }
  };

  const removeCoupon = async () => {
    try {
      const formdata = new FormData();
      formdata.append("order_oid", order_id);
      await apiInstance.post("coupon/remove/", formdata);
      Swal.fire({
        icon: "success",
        title: "Coupon Removed",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
      });
      refreshOrderData();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed to remove coupon" });
    }
  };

  const payWithCashOnDelivery = async () => {
    try {
      const formData = new FormData();
      formData.append("order_oid", order_id);
      await apiInstance.post("/cod-confirm/", formData);
      navigate(`/payments-success/${order_id}/?payment_method=COD`);
    } catch (error) {
      log.error("COD Error:", error);
      Swal.fire({ icon: "error", title: "Failed to confirm COD order." });
    }
  };

  const payWithWallet = async () => {
    try {
      const formData = new FormData();
      formData.append("order_oid", order_id);
      await apiInstance.post("/wallet-payment/", formData);
      navigate(`/payments-success/${order_id}/?payment_method=Wallet`);
    } catch (error) {
      log.error("Wallet Payment Error:", error);
      Swal.fire({
        icon: "error",
        title: "Payment Failed",
        text:
          error.response?.data?.error ||
          "Insufficient balance or invalid transaction.",
      });
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium">Loading checkout details...</p>
      </div>
    );
  }

  // --- Display Prep ---
  const subTotal = Number(order.initial_total) || 0;
  const discountAmount =
    Number(order.offer_saved || 0) + Number(order.coupon_saved || 0);
  const tax = Number(order.tax_fee) || 0;
  const shipping = Number(order.shipping_amount) || 0;
  const grandTotal = Number(order.total) || 0;

  return (
    <div className="bg-gray-50 min-h-screen py-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
          Secure Checkout
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Details & Payment */}
          <div className="w-full lg:w-2/3 space-y-8">
            {/* 1. Review Address (Read Only) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="text-blue-600 w-5 h-5" />
                Shipping Address
              </h2>
              <div className="pl-7 text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-gray-900 text-base">
                  {order.full_name}
                </p>
                <p>
                  {order.address}, {order.city}
                </p>
                <p>
                  {order.state}, {order.country} - {order.postal_code}
                </p>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {order.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {order.mobile}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Payment Method */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CheckCircle2 className="text-blue-600 w-5 h-5" />
                Payment Method
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Method: Razorpay */}
                <div
                  onClick={() => setPaymentMethod("razorpay")}
                  className={`cursor-pointer border-2 rounded-xl p-4 flex items-center gap-4 transition-all ${
                    paymentMethod === "razorpay"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "razorpay" ? "border-blue-600" : "border-gray-400"}`}
                  >
                    {paymentMethod === "razorpay" && (
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                    )}
                  </div>
                  <CreditCard className="w-6 h-6 text-gray-700" />
                  <span className="font-medium text-gray-900">Razorpay</span>
                </div>

                {/* Method: PayPal */}
                <div
                  onClick={() => setPaymentMethod("paypal")}
                  className={`cursor-pointer border-2 rounded-xl p-4 flex items-center gap-4 transition-all ${
                    paymentMethod === "paypal"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "paypal" ? "border-blue-600" : "border-gray-400"}`}
                  >
                    {paymentMethod === "paypal" && (
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                    )}
                  </div>
                  <Wallet className="w-6 h-6 text-blue-800" />
                  <span className="font-medium text-gray-900">PayPal</span>
                </div>

                {/* Method: Wallet */}
                <div
                  onClick={() => setPaymentMethod("wallet")}
                  className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col gap-2 transition-all relative overflow-hidden ${
                    paymentMethod === "wallet"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "wallet" ? "border-blue-600" : "border-gray-400"}`}
                    >
                      {paymentMethod === "wallet" && (
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <Wallet className="w-6 h-6 text-purple-600" />
                    <span className="font-medium text-gray-900">My Wallet</span>
                  </div>
                  <p className="pl-9 text-xs text-gray-500">
                    Balance:{" "}
                    {walletLoading ? "..." : `₹${walletBalance.toFixed(2)}`}
                  </p>
                </div>

                {/* Method: COD */}
                <div
                  onClick={() => grandTotal <= 1000 && setPaymentMethod("cod")}
                  className={`cursor-pointer border-2 rounded-xl p-4 flex items-center gap-4 transition-all ${
                    paymentMethod === "cod"
                      ? "border-blue-600 bg-blue-50"
                      : grandTotal > 1000
                        ? "border-gray-200 opacity-60 cursor-not-allowed bg-gray-50"
                        : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === "cod" ? "border-blue-600" : "border-gray-400"}`}
                  >
                    {paymentMethod === "cod" && (
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                    )}
                  </div>
                  <Truck
                    className={`w-6 h-6 shrink-0 ${grandTotal > 1000 ? "text-gray-400" : "text-green-600"}`}
                  />
                  <div className="flex flex-col">
                    <span
                      className={`font-medium ${grandTotal > 1000 ? "text-gray-500" : "text-gray-900"}`}
                    >
                      Cash on Delivery
                    </span>
                    {grandTotal > 1000 && (
                      <span className="text-xs text-red-500 font-semibold">
                        COD not available for orders &gt; ₹1000
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Box for Selection */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm md:text-base">
                {paymentMethod === "razorpay" && (
                  <p className="text-gray-600">
                    You will be redirected to Razorpay securely to complete your
                    purchase using Credit/Debit card, UPI, or Netbanking.
                  </p>
                )}
                {paymentMethod === "paypal" && (
                  <p className="text-gray-600">
                    Pay easily and securely with your PayPal account. You will
                    be redirected to PayPal.
                  </p>
                )}
                {paymentMethod === "wallet" && (
                  <div className="flex justify-between items-center">
                    <p
                      className={`font-medium ${walletBalance >= grandTotal ? "text-green-700" : "text-red-600"}`}
                    >
                      {walletBalance >= grandTotal
                        ? "Sufficient balance. Pay instantly."
                        : `Insufficient balance. You need ₹${(grandTotal - walletBalance).toFixed(2)} more.`}
                    </p>
                  </div>
                )}
                {paymentMethod === "cod" && (
                  <p className="text-gray-600">
                    Pay in cash when your order arrives at your doorstep.
                  </p>
                )}
              </div>

              {/* Action Buttons - CHANGED: Always mount the components, only hide/show them */}
              <div className="mt-6">
                <div
                  className={paymentMethod === "razorpay" ? "block" : "hidden"}
                >
                  <RazorpayButton order={order} order_id={order_id} />
                </div>

                <div
                  className={paymentMethod === "paypal" ? "block" : "hidden"}
                >
                  <PaypalButton order={order} />
                </div>

                <div className={paymentMethod === "cod" ? "block" : "hidden"}>
                  <button
                    onClick={payWithCashOnDelivery}
                    disabled={grandTotal > 1000}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all ${
                      grandTotal > 1000
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-black text-white hover:bg-gray-800"
                    }`}
                  >
                    {grandTotal > 1000
                      ? "COD Unavailable"
                      : "Confirm Order (COD)"}
                  </button>
                </div>

                <div
                  className={paymentMethod === "wallet" ? "block" : "hidden"}
                >
                  <button
                    onClick={payWithWallet}
                    disabled={walletBalance < grandTotal}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all ${
                      walletBalance >= grandTotal
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {walletBalance >= grandTotal
                      ? "Pay from Wallet"
                      : "Insufficient Balance"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-24 space-y-6">
              {/* Coupon Code */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  Have a Coupon?
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase placeholder:normal-case"
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button
                    onClick={applyCoupon}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {order.applied_coupon && (
                  <div className="mt-3 flex justify-between items-center bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">
                    <span className="font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Coupon Applied
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-red-500 hover:text-red-700 text-xs font-bold uppercase underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Summary Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">
                      ₹{subTotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="font-medium text-gray-900">
                      {shipping > 0 ? `₹${shipping.toFixed(2)}` : "Free"}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Tax / VAT</span>
                    <span className="font-medium text-gray-900">
                      ₹{tax.toFixed(2)}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-dashed border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-end">
                      <span className="text-base font-bold text-gray-900">
                        Total to Pay
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        ₹{grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <ShieldCheck className="w-4 h-4" />
                  SSL Encrypted Payment
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
