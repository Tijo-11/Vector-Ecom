import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import apiInstance from "../../../utils/axios";
import { useAuthStore } from "../../../store/auth";
import Swal from "sweetalert2";
import RazorpayButton from "./Razorpay";
import PaypalButton from "./Paypal";
import log from "loglevel";

function Checkout() {
  const [order, setOrder] = useState({});
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(true);
  const { order_id } = useParams();

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const response = await apiInstance.get(`/checkout/${order_id}/`);
      console.log("=== FULL ORDER RESPONSE ===", response.data);

      setOrder(response.data || {});
    } catch (error) {
      log.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (order_id) fetchOrderData();
  }, [order_id]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Please enter a coupon code",
      });
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
      });
      if (response.data.icon === "success") {
        setCouponCode("");
        await fetchOrderData();
      }
    } catch (err) {
      if (err.response) {
        Swal.fire({
          icon: err.response.data.icon || "error",
          title: err.response.data.message || "An error occurred",
        });
      } else {
        log.error(err);
        Swal.fire({
          icon: "error",
          title: "Failed to apply coupon",
        });
      }
    }
  };

  const removeCoupon = async () => {
    const formdata = new FormData();
    formdata.append("order_oid", order_id);

    try {
      const response = await apiInstance.post("coupon/remove/", formdata);
      await fetchOrderData();

      Swal.fire({
        icon: response.data.icon,
        title: response.data.message,
      });
    } catch (err) {
      if (err.response) {
        Swal.fire({
          icon: err.response.data.icon || "error",
          title: err.response.data.message || "An error occurred",
        });
      } else {
        log.error(err);
        Swal.fire({
          icon: "error",
          title: "Failed to remove coupon",
        });
      }
    }
  };

  // Coupon detection logic
  const isCouponApplied = (() => {
    if (parseFloat(order.coupon_saved || 0) > 0) return true;

    if (order.orderitem?.some((item) => parseFloat(item.coupon_saved || 0) > 0))
      return true;

    if (
      order.orderitem?.some(
        (item) =>
          item.coupon && Array.isArray(item.coupon) && item.coupon.length > 0
      )
    )
      return true;

    return false;
  })();

  // Calculate original subtotal
  const originalSubTotal =
    order.orderitem?.reduce((acc, item) => acc + item.price * item.qty, 0) || 0;

  if (loading) {
    return (
      <div className="container mx-auto mt-10 px-4">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-10 px-4">
      <div className="flex flex-col lg:flex-row gap-6 my-10">
        {/* Left side */}
        <div className="w-full lg:w-2/3 bg-white rounded-lg shadow-md px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex justify-between border-b pb-6 mb-6">
            <h1 className="font-semibold text-2xl">Checkout</h1>
            <span className="text-sm text-gray-600">Order: {order_id}</span>
          </div>

          {/* Shipping */}
          <div className="mb-8">
            <h2 className="font-semibold text-xl mb-4 flex items-center">
              <span className="mr-2">📦</span> Shipping Information
            </h2>
            <div className="bg-gray-50 p-5 rounded-lg space-y-2 border">
              <p>
                <span className="font-medium">Name:</span>{" "}
                {order.full_name || "N/A"}
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                {order.email || "N/A"}
              </p>
              <p>
                <span className="font-medium">Phone:</span>{" "}
                {order.mobile || "N/A"}
              </p>
              <p>
                <span className="font-medium">Address:</span>{" "}
                {order.address || "N/A"}
              </p>
              <p>
                <span className="font-medium">City:</span> {order.city || "N/A"}
                , {order.state || "N/A"} {order.postal_code || ""}
              </p>
              <p>
                <span className="font-medium">Country:</span>{" "}
                {order.country || "N/A"}
              </p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h2 className="font-semibold text-xl mb-4 flex items-center">
              <span className="mr-2">🛍️</span> Order Items
            </h2>

            <div className="space-y-4">
              {order.orderitem?.length ? (
                order.orderitem.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 p-5 rounded-lg bg-white"
                  >
                    <div className="flex justify-between">
                      <p className="font-medium text-lg">
                        {item.product?.title}
                      </p>
                      <span className="text-sm text-gray-500">#{item.oid}</span>
                    </div>

                    <div className="mt-4 pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Price</span>
                        <span>₹{parseFloat(item.price).toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Quantity</span>
                        <span>{item.qty}</span>
                      </div>

                      {item.offer_saved && parseFloat(item.offer_saved) > 0 && (
                        <div className="flex justify-between text-sm bg-green-50 p-2 rounded mt-2">
                          <span className="text-green-700 font-medium">
                            🎉 Offer Discount
                          </span>
                          <span className="font-semibold text-green-700">
                            -₹{parseFloat(item.offer_saved).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {item.coupon_saved &&
                        parseFloat(item.coupon_saved) > 0 && (
                          <div className="flex justify-between text-sm bg-blue-50 p-2 rounded">
                            <span className="text-blue-700 font-medium">
                              🎟️ Coupon Discount
                            </span>
                            <span className="font-semibold text-blue-700">
                              -₹{parseFloat(item.coupon_saved).toFixed(2)}
                            </span>
                          </div>
                        )}

                      <div className="flex justify-between font-semibold text-base pt-3 border-t mt-3">
                        <span>Total for this item</span>
                        <span>
                          ₹
                          {(
                            parseFloat(item.price) * item.qty -
                            parseFloat(item.offer_saved || 0) -
                            parseFloat(item.coupon_saved || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No items found</p>
              )}
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-md px-6 py-8 sm:px-8 sm:py-10 h-fit sticky top-4">
          <h2 className="font-semibold text-xl mb-4">Order Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{originalSubTotal.toFixed(2)}</span>
            </div>

            {order.offer_saved > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Offers Saved</span>
                <span>-₹{parseFloat(order.offer_saved).toFixed(2)}</span>
              </div>
            )}

            {order.coupon_saved > 0 && (
              <div className="flex justify-between text-blue-700">
                <span>Coupon Saved</span>
                <span>-₹{parseFloat(order.coupon_saved).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Shipping</span>
              <span>
                {order.shipping_amount && order.shipping_amount > 0
                  ? `₹${parseFloat(order.shipping_amount).toFixed(2)}`
                  : "Free"}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Tax</span>
              <span>₹{parseFloat(order.tax_fee || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Service Fee</span>
              <span>₹{parseFloat(order.service_fee || 0).toFixed(2)}</span>
            </div>

            <hr />

            <div className="flex justify-between font-bold text-lg">
              <span>Grand Total</span>
              <span>₹{parseFloat(order.total || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Coupon Section */}
          <div className="mt-6 bg-gray-50 p-5 rounded-lg border border-gray-200">
            <label className="font-semibold block mb-3 text-sm uppercase text-gray-700">
              Promo Code
            </label>

            {!isCouponApplied ? (
              <>
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="p-3 text-sm w-full border rounded-md mb-3"
                />
                <button
                  onClick={applyCoupon}
                  className="w-full bg-blue-600 text-white py-3 rounded-md text-sm uppercase font-semibold hover:bg-blue-700"
                >
                  Apply Coupon
                </button>
              </>
            ) : (
              <div className="text-center">
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-3">
                  <p className="text-green-800 font-bold text-lg">
                    ✓ Coupon Applied!
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    You saved ₹{parseFloat(order.coupon_saved || 0).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={removeCoupon}
                  className="w-full bg-red-500 text-white py-3 rounded-md text-sm uppercase font-semibold hover:bg-red-600"
                >
                  Remove Coupon
                </button>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="mt-6 space-y-3">
            <RazorpayButton order={order} order_id={order_id} />
            <PaypalButton order={order} order_id={order_id} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
