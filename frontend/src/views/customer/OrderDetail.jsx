// OrderDetail.jsx (Consistent display: Original Total, Saved, Subtotal, Shipping, Grand Total)
import React, { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import moment from "moment";
import { Link, useParams } from "react-router-dom";
import log from "loglevel";

function OrderDetail() {
  const [order, setOrder] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [cancelType, setCancelType] = useState(""); // "full" or "item"
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelDetail, setCancelDetail] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [returnDetail, setReturnDetail] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const axios = apiInstance;
  const userData = UserData();
  const param = useParams();
  const fetchOrderDetails = () => {
    axios
      .get(`customer/order/detail/${userData?.user_id}/${param?.order_oid}`)
      .then((res) => {
        setOrder(res.data);
        setOrderItems(res.data.orderitem);
        setLoading(false);
      })
      .catch((err) => {
        log.error("Error fetching order details:", err);
        setLoading(false);
      });
  };
  useEffect(() => {
    fetchOrderDetails();
  }, []);
  const cancelReasons = [
    { value: "changed_mind", label: "Changed my mind" },
    { value: "better_price", label: "Found better price elsewhere" },
    { value: "ordered_mistake", label: "Ordered by mistake" },
    { value: "delivery_time", label: "Delivery time too long" },
    { value: "other", label: "Other" },
  ];
  const returnReasons = [
    { value: "defective", label: "Defective or damaged product" },
    { value: "wrong_item", label: "Wrong item received" },
    { value: "not_described", label: "Not as described" },
    { value: "poor_quality", label: "Poor quality" },
    { value: "changed_mind", label: "Changed my mind" },
    { value: "other", label: "Other" },
  ];
  const handleCancelOrder = (type, itemId = null) => {
    setCancelType(type);
    setSelectedItemId(itemId);
    setCancelReason("");
    setCancelDetail("");
    setShowCancelModal(true);
    setMessage({ type: "", text: "" });
  };
  const handleReturnItem = (itemId) => {
    setSelectedItemId(itemId);
    setReturnReason("");
    setReturnDetail("");
    setShowReturnModal(true);
    setMessage({ type: "", text: "" });
  };
  const submitCancellation = async () => {
    if (!cancelReason) {
      setMessage({
        type: "error",
        text: "Please select a reason for cancellation",
      });
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        order_oid: param.order_oid,
        reason: cancelReason,
        reason_detail: cancelDetail,
        user_id: userData?.user_id,
        item_ids: cancelType === "item" ? [selectedItemId] : [],
      };
      await axios.post("/cancel-order/", payload);

      setMessage({
        type: "success",
        text: "Cancellation request submitted successfully!",
      });
      setTimeout(() => {
        setShowCancelModal(false);
        fetchOrderDetails(); // Refresh order details
      }, 1500);
    } catch (err) {
      log.error("Error cancelling order:", err);
      setMessage({
        type: "error",
        text:
          err.response?.data?.error ||
          "Failed to cancel order. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };
  const submitReturn = async () => {
    if (!returnReason) {
      setMessage({
        type: "error",
        text: "Please select a reason for return (required)",
      });
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        item_id: selectedItemId,
        reason: returnReason,
        reason_detail: returnDetail,
        user_id: userData?.user_id,
      };
      await axios.post("/return-order-item/", payload);

      setMessage({
        type: "success",
        text: "Return request submitted successfully!",
      });
      setTimeout(() => {
        setShowReturnModal(false);
        fetchOrderDetails(); // Refresh order details
      }, 1500);
    } catch (err) {
      log.error("Error submitting return:", err);
      setMessage({
        type: "error",
        text:
          err.response?.data?.error ||
          "Failed to submit return request. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };
  return (
    <div>
      {loading === false && (
        <main className="mt-5">
          <div className="container mx-auto">
            <section>
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-3/4 mt-1 lg:ml-4">
                  <main className="mb-5">
                    <div className="px-4">
                      {/* Section: Summary */}
                      <section className="mb-5">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold">
                              <i className="fas fa-shopping-cart text-blue-600 mr-2" />{" "}
                              Order #{order.oid}
                            </h3>
                            {order.order_status === "Cancelled" && (
                              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                                Order Cancelled
                              </span>
                            )}
                          </div>
                          {order.order_status !== "Cancelled" &&
                            order.order_status !== "Delivered" && (
                              <button
                                onClick={() => handleCancelOrder("full")}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                              >
                                Cancel Entire Order
                              </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="rounded-lg shadow bg-teal-100 p-4">
                            <div className="flex items-center">
                              <div>
                                <p className="mb-1 text-sm">Original Total</p>
                                <h2 className="text-xl font-semibold">
                                  ₹{order.initial_total}
                                </h2>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-lg shadow bg-purple-100 p-4">
                            <div className="flex items-center">
                              <div>
                                <p className="mb-1 text-sm">Saved</p>
                                <h2 className="text-xl font-semibold">
                                  -₹{order.saved}
                                </h2>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-lg shadow bg-blue-100 p-4">
                            <div className="flex items-center">
                              <div>
                                <p className="mb-1 text-sm">
                                  Subtotal (after discounts)
                                </p>
                                <h2 className="text-xl font-semibold">
                                  ₹{order.sub_total}
                                </h2>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-lg shadow bg-green-100 p-4">
                            <div className="flex items-center">
                              <div>
                                <p className="mb-1 text-sm">Shipping Amount</p>
                                <h2 className="text-xl font-semibold">
                                  ₹{order.shipping_amount}
                                </h2>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-lg shadow bg-indigo-100 p-4 mt-4">
                            <div className="flex items-center">
                              <div>
                                <p className="mb-1 text-sm">Grand Total</p>
                                <h2 className="text-xl font-semibold">
                                  ₹{order.total}
                                </h2>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>
                      {/* Section: Order Items */}
                      <section>
                        <div className="rounded-lg shadow p-3 bg-white">
                          <div>
                            <table className="w-full text-left">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="p-3">Product</th>
                                  <th className="p-3">Price</th>
                                  <th className="p-3">Qty</th>
                                  <th className="p-3">Subtotal</th>
                                  <th className="p-3 text-red-600">Saved</th>
                                  <th className="p-3">Tracking</th>
                                  <th className="p-3">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {orderItems?.map((orderItem, index) => (
                                  <tr key={index} className="border-b">
                                    <td className="p-3">
                                      <div className="flex items-center">
                                        <img
                                          src={orderItem?.product?.image}
                                          className="w-20 h-20 object-cover rounded-lg mr-2"
                                          alt=""
                                        />
                                        <Link
                                          to={`/detail/${orderItem.product.slug}`}
                                          className="font-bold text-gray-800"
                                        >
                                          {orderItem?.product?.title}
                                        </Link>
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      ₹{orderItem.product.price}
                                    </td>
                                    <td className="p-3">{orderItem.qty}</td>
                                    <td className="p-3">
                                      ₹{orderItem.sub_total}
                                    </td>
                                    <td className="p-3 text-red-600">
                                      -₹{orderItem.saved}
                                    </td>
                                    <td className="p-3">
                                      {orderItem.tracking_id == null ||
                                      orderItem.tracking_id === "undefined" ? (
                                        <button
                                          className="btn bg-gray-400 text-white text-sm cursor-not-allowed"
                                          disabled
                                        >
                                          No Tracking Yet{" "}
                                          <i className="fas fa-plus ml-1"></i>
                                        </button>
                                      ) : (
                                        <a
                                          className="btn bg-green-500 text-white text-sm hover:bg-green-600"
                                          target="_blank"
                                          href={`${orderItem.delivery_couriers?.tracking_website}?${orderItem.delivery_couriers?.url_parameter}=${orderItem.tracking_id}`}
                                        >
                                          Track Item{" "}
                                          <i className="fas fa-location-arrow ml-1"></i>
                                        </a>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      <div className="flex flex-col gap-2">
                                        {/* Show Cancelled Status */}
                                        {orderItem.is_cancelled ? (
                                          <span className="bg-red-100 text-red-800 px-3 py-1 rounded text-xs font-semibold text-center">
                                            Cancelled
                                          </span>
                                        ) : (
                                          <>
                                            {/* Cancel Item Button */}
                                            {order.order_status !==
                                              "Cancelled" &&
                                              !orderItem.product_delivered && (
                                                <button
                                                  onClick={() =>
                                                    handleCancelOrder(
                                                      "item",
                                                      orderItem.id
                                                    )
                                                  }
                                                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs"
                                                >
                                                  Cancel Item
                                                </button>
                                              )}

                                            {/* Return Item Button */}
                                            {orderItem.product_delivered && (
                                              <button
                                                onClick={() =>
                                                  handleReturnItem(orderItem.id)
                                                }
                                                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs"
                                              >
                                                Return Item
                                              </button>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </section>
                    </div>
                  </main>
                </div>
              </div>
            </section>
          </div>
        </main>
      )}
      {loading === true && (
        <div className="container mx-auto text-center">
          <img
            className="mx-auto"
            src="https://cdn.dribbble.com/users/2046015/screenshots/5973727/06-loader_telega.gif"
            alt="Loading"
          />
        </div>
      )}
      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {cancelType === "full" ? "Cancel Entire Order" : "Cancel Item"}
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            {message.text && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Cancellation *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a reason</option>
                  {cancelReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={cancelDetail}
                  onChange={(e) => setCancelDetail(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide any additional details..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={submitCancellation}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
                >
                  {actionLoading ? "Submitting..." : "Submit Cancellation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Return Order Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Return Item</h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            {message.text && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Return * (Required)
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select a reason</option>
                  {returnReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={returnDetail}
                  onChange={(e) => setReturnDetail(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Provide any additional details..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReturn}
                  disabled={actionLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
                >
                  {actionLoading ? "Submitting..." : "Submit Return Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default OrderDetail;
