import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ShoppingCart, AlertCircle, X, RefreshCw, Truck } from "lucide-react";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";
import log from "loglevel";

function OrderDetail() {
  const [order, setOrder] = useState({});
  const [orderItems, setOrderItems] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [returnAction, setReturnAction] = useState("");
  const [returnNote, setReturnNote] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const deliveryStatuses = [
    { value: "On Hold", label: "On Hold", color: "bg-gray-100 text-gray-800" },
    {
      value: "Shipping Processing",
      label: "Shipping Processing",
      color: "bg-yellow-100 text-yellow-800",
    },
    { value: "Shipped", label: "Shipped", color: "bg-blue-100 text-blue-800" },
    {
      value: "Out for Delivery",
      label: "Out for Delivery",
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      value: "Delivered",
      label: "Delivered",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "Returning",
      label: "Returning",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "Returned",
      label: "Returned",
      color: "bg-purple-100 text-purple-800",
    },
  ];

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const axios = apiInstance;
  const userData = UserData();
  const param = useParams(); // Now correctly imported

  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(
        `vendor/orders/${userData?.vendor_id}/${param.oid}`,
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
        delivery_status: selectedStatus,
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
        text:
          error.response?.data?.error ||
          "Failed to update status. Please try again.",
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
      await axios.post(
        `vendor/return-request/${selectedItem.return_request.id}/handle/`,
        {
          action: returnAction,
          note: returnNote,
        },
      );
      setMessage({
        type: "success",
        text:
          returnAction === "approve"
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
        text:
          error.response?.data?.error || "Failed to process return request.",
      });
    } finally {
      setReturnLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusConfig = deliveryStatuses.find((s) => s.value === status);
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
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[returnRequest.status]}`}
      >
        Return:{" "}
        {returnRequest.status.charAt(0).toUpperCase() +
          returnRequest.status.slice(1)}
      </span>
    );
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8 lg:p-12 overflow-x-hidden">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            Order #{order.oid}
          </h1>
          <p className="text-gray-500 mt-1">View and manage order details.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-lg p-5 text-white">
            <p className="text-teal-100 font-medium text-sm uppercase tracking-wider">
              Total
            </p>
            <h2 className="text-2xl font-bold mt-1">₹{order?.total}</h2>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-5 text-white">
            <p className="text-purple-100 font-medium text-sm uppercase tracking-wider">
              Payment
            </p>
            <h2 className="text-2xl font-bold mt-1">
              {order?.payment_status?.toUpperCase()}
            </h2>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-5 text-white">
            <p className="text-blue-100 font-medium text-sm uppercase tracking-wider">
              Status
            </p>
            <h2 className="text-2xl font-bold mt-1">{order.order_status}</h2>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-5 text-white">
            <p className="text-green-100 font-medium text-sm uppercase tracking-wider">
              Shipping
            </p>
            <h2 className="text-2xl font-bold mt-1">
              ₹{order.shipping_amount}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-gray-500 text-sm">Tax Fee</p>
            <h2 className="text-xl font-bold text-gray-900">
              ₹{order.tax_fee}
            </h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-gray-500 text-sm">Service Fee</p>
            <h2 className="text-xl font-bold text-gray-900">
              ₹{order.service_fee}
            </h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-gray-500 text-sm">Discount</p>
            <h2 className="text-xl font-bold text-red-600">-₹{order.saved}</h2>
          </div>
        </div>

        {/* Order Items Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-red-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orderItems?.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item?.product?.image}
                          alt={item?.product?.title}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-100"
                        />
                        <Link
                          to={`/detail/${item.product.slug}`}
                          className="font-medium text-gray-900 hover:text-blue-600 transition"
                        >
                          {item?.product?.title}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ₹{item.product.price}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.qty}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ₹{item.sub_total}
                    </td>
                    <td className="px-6 py-4 font-medium text-red-600">
                      -₹{item.saved}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.delivery_status)}`}
                        >
                          {item.delivery_status}
                        </span>
                        {item.return_request &&
                          getReturnStatusBadge(item.return_request)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {!item.product_delivered &&
                          item.delivery_status !== "Cancelled" &&
                          (!item.return_request ||
                            item.return_request.status !== "pending") && (
                            <button
                              onClick={() => handleStatusChange(item)}
                              className="flex items-center bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 text-sm transition"
                            >
                              <Truck className="w-4 h-4 mr-1" /> Update Status
                            </button>
                          )}

                        {item.return_request &&
                          item.return_request.status === "pending" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  handleReturnRequest(item, "approve")
                                }
                                className="flex items-center bg-green-600 text-white px-2 py-1 rounded-md hover:bg-green-700 text-xs transition"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() =>
                                  handleReturnRequest(item, "reject")
                                }
                                className="flex items-center bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 text-xs transition"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
                {orderItems.length < 1 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-16 text-center">
                      <p className="text-gray-500 font-medium">
                        No Order Items
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                  <AlertCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Select new status for:{" "}
                <strong>{selectedItem?.product?.title}</strong>
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
                {returnAction === "approve"
                  ? "Approve Return"
                  : "Reject Return"}
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
                  <AlertCircle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}
            <div className="mb-4">
              <div className="bg-gray-50 p-3 rounded-lg mb-3">
                <p className="font-medium text-gray-900">
                  {selectedItem?.product?.title}
                </p>
                <p className="text-sm text-gray-600">
                  Reason: {selectedItem?.return_request?.reason}
                </p>
                {selectedItem?.return_request?.reason_detail && (
                  <p className="text-sm text-gray-600">
                    Details: {selectedItem?.return_request?.reason_detail}
                  </p>
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
                Approving will restore stock and update delivery status to
                "Returning".
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
                {returnLoading
                  ? "Processing..."
                  : returnAction === "approve"
                    ? "Approve Return"
                    : "Reject Return"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetail;
