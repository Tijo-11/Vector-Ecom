import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, FileText } from "lucide-react";
import moment from "moment";

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";
import log from "loglevel";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);

  const axios = apiInstance;
  const userData = UserData();
  const userId = userData?.user_id;

  // Construct URL with page param
  const getOrdersUrl = (page) => {
    const base = `customer/orders/${userId}/`;
    return page <= 1 ? base : `${base}?page=${page}`;
  };

  const fetchOrders = async (page = currentPage) => {
    if (!userId) return;
    setLoading(true);
    try {
      const fullUrl = getOrdersUrl(page);
      const res = await axios.get(fullUrl);

      // Handle paginated response safely
      const data = res.data;
      const orderList = Array.isArray(data) ? data : data.results || [];
      const count = data.count ?? orderList.length;
      const next = data.next ?? null;
      const prev = data.previous ?? null;

      setOrders(orderList);
      setTotalCount(count);
      setHasNext(!!next);
      setHasPrev(!!prev);
      setCurrentPage(page);
    } catch (error) {
      log.error("Error fetching orders:", error);
      setOrders([]);
      setTotalCount(0);
      setHasNext(false);
      setHasPrev(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [userId]);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  // Safe reduce for status counts
  const statusCounts = Array.isArray(orders)
    ? orders.reduce((count, order) => {
        const status = order.order_status;
        count[status] = (count[status] || 0) + 1;
        return count;
      }, {})
    : {};

  return (
    <div className="container mx-auto mt-10 px-4">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-600">Loading orders...</p>
        </div>
      ) : (
        <section>
          <div className="flex flex-col lg:flex-row gap-6">
            <Sidebar />
            <div className="flex-1">
              <main className="mb-10">
                {/* Section: Summary */}
                <section className="mb-8">
                  <h3 className="mb-6 text-2xl font-semibold flex items-center gap-2">
                    <i className="fas fa-shopping-cart text-blue-600" /> Orders
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Orders */}
                    <div className="rounded-xl shadow p-5 bg-teal-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="mb-1 text-gray-700">Total Orders</p>
                          <h2 className="text-2xl font-bold">{totalCount}</h2>
                        </div>
                        <div className="p-3 rounded-full bg-teal-200">
                          <i className="fas fa-shopping-cart text-emerald-900 text-xl" />
                        </div>
                      </div>
                    </div>
                    {/* Pending Delivery */}
                    <div className="rounded-xl shadow p-5 bg-purple-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="mb-1 text-gray-700">Pending Delivery</p>
                          <h2 className="text-2xl font-bold">
                            {statusCounts.Pending || 0}
                          </h2>
                        </div>
                        <div className="p-3 rounded-full bg-purple-200">
                          <i className="fas fa-clock text-purple-700 text-xl" />
                        </div>
                      </div>
                    </div>
                    {/* Fulfilled Orders */}
                    <div className="rounded-xl shadow p-5 bg-blue-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="mb-1 text-gray-700">Fulfilled Orders</p>
                          <h2 className="text-2xl font-bold">
                            {statusCounts.Fulfilled || 0}
                          </h2>
                        </div>
                        <div className="p-3 rounded-full bg-blue-200">
                          <i className="fas fa-check-circle text-blue-800 text-xl" />
                        </div>
                      </div>
                    </div>
                    {/* Completed Orders */}
                    <div className="rounded-xl shadow p-5 bg-green-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="mb-1 text-gray-700">Completed Orders</p>
                          <h2 className="text-2xl font-bold">
                            {statusCounts.Completed || 0}
                          </h2>
                        </div>
                        <div className="p-3 rounded-full bg-green-200">
                          <i className="fas fa-check-double text-green-800 text-xl" />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section: Orders Table */}
                <section>
                  <div className="rounded-xl shadow p-5 bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="table-auto w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100 text-left">
                            <th className="p-3 font-medium">Order ID</th>
                            <th className="p-3 font-medium">Payment Status</th>
                            <th className="p-3 font-medium">Order Status</th>
                            <th className="p-3 font-medium">Total</th>
                            <th className="p-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.length > 0 ? (
                            orders.map((o) => (
                              <tr
                                key={o.oid}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="p-3">
                                  <p className="font-semibold">#{o.oid}</p>
                                  <p className="text-gray-500 text-sm">
                                    {moment(o.date).format("MM/DD/YYYY")}
                                  </p>
                                </td>
                                <td className="p-3">
                                  <p className="uppercase font-medium text-gray-700">
                                    {o.payment_status?.toUpperCase()}
                                  </p>
                                </td>
                                <td className="p-3">
                                  <p className="text-gray-700">
                                    {o.order_status}
                                  </p>
                                </td>
                                <td className="p-3">
                                  <span className="font-medium">
                                    ₹{o.total}
                                  </span>
                                </td>
                                <td className="p-3 flex flex-col gap-2">
                                  <Link
                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                    to={`/customer/order/detail/${o.oid}/`}
                                  >
                                    View <Eye className="w-5 h-5" />
                                  </Link>
                                  <Link
                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                    to={`/customer/order/invoice/${o.oid}/`}
                                  >
                                    Invoice <FileText className="w-5 h-5" />
                                  </Link>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="5"
                                className="text-center py-8 text-gray-500"
                              >
                                No orders yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalCount > orders.length && (
                      <div className="flex justify-center items-center mt-8 py-4 border-t bg-gray-50 gap-6">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={!hasPrev || loading}
                          className="px-6 py-3 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                        >
                          Previous
                        </button>

                        <span className="text-lg font-medium">
                          Page {currentPage} ({totalCount} total orders)
                        </span>

                        <button
                          onClick={() => setCurrentPage((prev) => prev + 1)}
                          disabled={!hasNext || loading}
                          className="px-6 py-3 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </main>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Orders;
