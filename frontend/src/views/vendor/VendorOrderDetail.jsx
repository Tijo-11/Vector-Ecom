import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ShoppingCart, Plus, Edit, CheckCircle, AlertCircle, X, RefreshCw, Truck } from "lucide-react";

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";
import log from "loglevel";

function OrderDetail() {
  const [order, setOrder] = useState({});
  const [orderItems, setOrderItems] = useState([]);
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [returnAction, setReturnAction] = useState("");
  const [returnNote, setReturnNote] = useState("");
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const deliveryStatuses = [
    { value: "On Hold", label: "On Hold", color: "bg-gray-100 text-gray-800" },
    { value: "Shipping Processing", label: "Shipping Processing", color: "bg-yellow-100 text-yellow-800" },
    { value: "Shipped", label: "Shipped", color: "bg-blue-100 text-blue-800" },
    { value: "Out for Delivery", label: "Out for Delivery", color: "bg-indigo-100 text-indigo-800" },
    { value: "Delivered", label: "Delivered", color: "bg-green-100 text-green-800" },
    { value: "Returning", label: "Returning", color: "bg-orange-100 text-orange-800" },
    { value: "Returned", label: "Returned", color: "bg-purple-100 text-purple-800" },
  ];

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const axios = apiInstance;
  const userData = UserData();
  const param = useParams();

  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(
        `vendor/orders/${userData?.vendor_id}/${param.oid}`
      );
      setOrder(response.data);
      setOrderItems(response.data.orderitem);
    } catch (error) {
      log.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  // Handle Mark as Delivered (existing functionality)
  const handleMarkAsDelivered = (item) => {
    setSelectedItem(item);
    setShowDeliveredModal(true);
    setMessage({ type: "", text: "" });
  };

  const confirmMarkAsDelivered = async () => {
    setDeliveryLoading(true);
    try {
      await axios.put(`vendor/order-item-delivered/${selectedItem.id}/`);
      
      setMessage({
        type: "success",
        text: "Order item successfully marked as delivered!",
      });
      
      setTimeout(() => {
        setShowDeliveredModal(false);
        fetchOrderDetails();
      }, 1500);
    } catch (error) {
      log.error("Error marking as delivered:", error);
      setMessage({
        type: "error",
        text: "Failed to mark as delivered. Please try again.",
      });
    } finally {
      setDeliveryLoading(false);
    }
  };

  // Handle Status Change
  const handleStatusChange = (item) => {
    setSelectedItem(item);
    setSelectedStatus(item.delivery_status);
    setShowStatusModal(true);
    setMessage({ type: "", text: "" });
  };

  const confirmStatusChange = async () => {
    if (selectedStatus === selectedItem.delivery_status) {
      setShowStatusModal(false);
      return;
    }
    
    setStatusLoading(true);
    try {
      await axios.put(`vendor/order-item-status/${selectedItem.id}/`, {
        delivery_status: selectedStatus
      });
      
      setMessage({
        type: "success",
        text: `Status updated to "${selectedStatus}"`,
      });
      
      setTimeout(() => {
        setShowStatusModal(false);
        fetchOrderDetails();
      }, 1500);
    } catch (error) {
      log.error("Error updating status:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to update status. Please try again.",
      });
    } finally {
      setStatusLoading(false);
    }
  };

  // Handle Return Request
  const handleReturnRequest = (item, action) => {
    setSelectedItem(item);
    setReturnAction(action);
    setReturnNote("");
    setShowReturnModal(true);
    setMessage({ type: "", text: "" });
  };

  const confirmReturnAction = async () => {
    setReturnLoading(true);
    try {
      await axios.post(`vendor/return-request/${selectedItem.return_request.id}/handle/`, {
        action: returnAction,
        note: returnNote
      });
      
      setMessage({
        type: "success",
        text: returnAction === "approve" 
          ? "Return request approved. Stock has been restored." 
          : "Return request rejected.",
      });
      
      setTimeout(() => {
        setShowReturnModal(false);
        fetchOrderDetails();
      }, 1500);
    } catch (error) {
      log.error("Error handling return request:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to process return request.",
      });
    } finally {
      setReturnLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusConfig = deliveryStatuses.find(s => s.value === status);
    return statusConfig ? statusConfig.color : "bg-gray-100 text-gray-800";
  };

  const getReturnStatusBadge = (returnRequest) => {
    if (!returnRequest) return null;
    
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[returnRequest.status]}`}>
        Return: {returnRequest.status.charAt(0).toUpperCase() + returnRequest.status.slice(1)}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4" id="main">
      <div className="flex flex-col md:flex-row h-full">
        <Sidebar />
        <div className="md:w-3/4 lg:w-5/6 mt-4">
          <main className="mb-10">
            {/* Summary Section */}
            <section className="mb-8">
              <h3 className="flex items-center text-xl font-semibold mb-5">
                <ShoppingCart className="text-blue-600 mr-2" /> #{order.oid}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-teal-100 rounded-lg shadow p-4">
                  <p className="text-gray-600">Total</p>
                  <h2 className="text-xl font-bold">₹{order?.total}</h2>
                </div>
                <div className="bg-purple-100 rounded-lg shadow p-4">
                  <p className="text-gray-600">Payment Status</p>
                  <h2 className="text-xl font-bold">
                    {order?.payment_status?.toUpperCase()}
                  </h2>
                </div>
                <div className="bg-blue-100 rounded-lg shadow p-4">
                  <p className="text-gray-600">Order Status</p>
                  <h2 className="text-xl font-bold">{order.order_status}</h2>
                </div>
                <div className="bg-green-100 rounded-lg shadow p-4">
                  <p className="text-gray-600">Shipping Amount</p>
                  <h2 className="text-xl font-bold">
                    ₹{order.shipping_amount}
                  </h2>
                </div>
                <div className="bg-cyan-100 rounded-lg shadow p-4">
                  <p className="text-gray-600">Tax Fee</p>
                  <h2 className="text-xl font-bold">₹{order.tax_fee}</h2>
                </div>
                <div className="bg-pink-100 rounded-lg shadow p-4">
                  <p className="text-gray-600">Service Fee</p>
                  <h2 className="text-xl font-bold">₹{order.service_fee}</h2>
                </div>
                <div className="bg-indigo-100 rounded-lg shadow p-4">
                  <p className="text-gray-600">Discount</p>
                  <h2 className="text-xl font-bold">₹{order.saved}</h2>
                </div>
              </div>
            </section>

            {/* Order Items Section */}
            <section>
              <div className="rounded-lg shadow p-6 bg-white">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left">Product</th>
                      <th className="py-3 px-4 text-left">Price</th>
                      <th className="py-3 px-4 text-left">Qty</th>
                      <th className="py-3 px-4 text-left">Total</th>
                      <th className="py-3 px-4 text-left text-red-600">
                        Discount
                      </th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems?.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <img
                              src={item?.product?.image}
                              alt={item?.product?.title}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <Link
                              to={`/detail/${item.product.slug}`}
                              className="fw-bold text-dark ms-2 mb-0"
                            >
                              {item?.product?.title}
                            </Link>
                          </div>
                        </td>
                        <td className="py-3 px-4">₹{item.product.price}</td>
                        <td className="py-3 px-4">{item.qty}</td>
                        <td className="py-3 px-4">₹{item.sub_total}</td>
                        <td className="py-3 px-4 text-red-600">
                          -₹{item.saved}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.delivery_status)}`}
                            >
                              {item.delivery_status}
                            </span>
                            {item.return_request && getReturnStatusBadge(item.return_request)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-2">
                            {/* Status Change Button */}
                            <button
                              onClick={() => handleStatusChange(item)}
                              className="flex items-center bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 text-sm"
                            >
                              <Truck className="w-4 h-4 mr-1" /> Update Status
                            </button>

                            {/* Tracking Management */}
                            {item.tracking_id == null ||
                            item.tracking_id === "undefined" ? (
                              <Link
                                to={`/vendor/orders/${param.oid}/${item.id}/`}
                                className="flex items-center bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
                              >
                                <Plus className="w-4 h-4 mr-1" /> Add Tracking
                              </Link>
                            ) : (
                              <Link
                                to={`/vendor/orders/${param.oid}/${item.id}/`}
                                className="flex items-center bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 text-sm"
                              >
                                <Edit className="w-4 h-4 mr-1" /> Edit Tracking
                              </Link>
                            )}
                            
                            {/* Quick Mark as Delivered Button */}
                            {!item.product_delivered && item.delivery_status !== "Cancelled" && (
                              <button
                                onClick={() => handleMarkAsDelivered(item)}
                                className="flex items-center bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" /> Mark Delivered
                              </button>
                            )}

                            {/* Return Request Actions */}
                            {item.return_request && item.return_request.status === "pending" && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleReturnRequest(item, "approve")}
                                  className="flex items-center bg-green-600 text-white px-2 py-1 rounded-md hover:bg-green-700 text-xs"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" /> Accept
                                </button>
                                <button
                                  onClick={() => handleReturnRequest(item, "reject")}
                                  className="flex items-center bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 text-xs"
                                >
                                  <X className="w-3 h-3 mr-1" /> Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {orderItems.length < 1 && (
                      <tr>
                        <td
                          colSpan="7"
                          className="text-center py-6 text-gray-600"
                        >
                          No Order Item
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Update Delivery Status</h3>
              <button
                onClick={() => setShowStatusModal(false)}
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

            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Select new status for: <strong>{selectedItem?.product?.title}</strong>
              </p>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {deliveryStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={statusLoading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
              >
                {statusLoading ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {returnAction === "approve" ? "Approve Return" : "Reject Return"}
              </h3>
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

            <div className="mb-4">
              <div className="bg-gray-50 p-3 rounded-lg mb-3">
                <p className="font-medium text-gray-900">{selectedItem?.product?.title}</p>
                <p className="text-sm text-gray-600">Reason: {selectedItem?.return_request?.reason}</p>
                {selectedItem?.return_request?.reason_detail && (
                  <p className="text-sm text-gray-600">Details: {selectedItem?.return_request?.reason_detail}</p>
                )}
              </div>
              
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Response Note (optional)
              </label>
              <textarea
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Add a note for the customer..."
              />
            </div>

            {returnAction === "approve" && (
              <div className="bg-blue-50 text-blue-700 p-3 rounded-lg mb-4 text-sm">
                <RefreshCw className="inline w-4 h-4 mr-1" />
                Approving will restore stock and update delivery status to "Returning".
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowReturnModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmReturnAction}
                disabled={returnLoading}
                className={`flex-1 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 ${
                  returnAction === "approve" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {returnLoading ? "Processing..." : (returnAction === "approve" ? "Approve Return" : "Reject Return")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Delivered Confirmation Modal */}
      {showDeliveredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Confirm Delivery</h3>
              <button
                onClick={() => setShowDeliveredModal(false)}
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

            <div className="mb-4">
              <p className="text-gray-700">
                Are you sure you want to mark this item as delivered?
              </p>
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <p className="font-medium text-gray-900">
                  {selectedItem?.product?.title}
                </p>
                <p className="text-sm text-gray-600">Qty: {selectedItem?.qty}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeliveredModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmMarkAsDelivered}
                disabled={deliveryLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
              >
                {deliveryLoading ? "Processing..." : "Confirm Delivery"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetail;
