import React, { useState } from "react";
import { Package, Search, AlertCircle } from "lucide-react";
import apiInstance from "../../utils/axios";
import log from "loglevel";

function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const axios = apiInstance;

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);

    try {
      const response = await axios.post("/guest-track-order/", {
        order_oid: orderNumber.trim(),
        email: email.trim(),
      });

      setOrder(response.data);
      log.info("Order tracked successfully:", response.data);
    } catch (err) {
      log.error("Error tracking order:", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to track order. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Package className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Track Your Order
          </h1>
          <p className="text-gray-600">
            Enter your order number and email to track your order status
          </p>
        </div>

        {/* Track Order Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleTrackOrder} className="space-y-4">
            <div>
              <label
                htmlFor="orderNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Order Number
              </label>
              <input
                type="text"
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g., abc123xyz"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Tracking...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Track Order
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Order Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="text-lg font-semibold text-gray-900">
                    #{order.oid}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Order Status</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {order.order_status}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {order.payment_status?.toUpperCase()}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₹{order.total}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Order Items
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Delivery Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Tracking
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {order.orderitem?.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.product?.image}
                              alt={item.product?.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {item.product?.title}
                              </p>
                              {item.color && (
                                <p className="text-sm text-gray-500">
                                  Color: {item.color}
                                </p>
                              )}
                              {item.size && (
                                <p className="text-sm text-gray-500">
                                  Size: {item.size}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-900">{item.qty}</td>
                        <td className="px-4 py-4 text-gray-900">
                          ₹{item.sub_total}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.product_delivered
                                ? "bg-green-100 text-green-800"
                                : item.product_shipped
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {item.delivery_status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {item.tracking_id &&
                          item.tracking_id !== "undefined" ? (
                            <a
                              href={`${item.delivery_couriers?.tracking_website}?${item.delivery_couriers?.url_parameter}=${item.tracking_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Track →
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              No tracking yet
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Delivery Address
              </h2>
              <div className="text-gray-700">
                <p className="font-medium">{order.full_name}</p>
                <p>{order.address}</p>
                <p>
                  {order.city}, {order.state} - {order.postal_code}
                </p>
                <p>{order.country}</p>
                <p className="mt-2">
                  <span className="font-medium">Mobile:</span> {order.mobile}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {order.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackOrder;
