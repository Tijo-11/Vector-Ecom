import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import { Eye, ShoppingBag, Filter, ChevronLeft, ChevronRight, Package } from "lucide-react";

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
  const [fetchUrl, setFetchUrl] = useState("");
  const [activeFilter, setActiveFilter] = useState("no-filter");

  const axios = apiInstance;
  const userData = UserData();

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const vendorId = userData?.vendor_id;

  const getFullUrl = (baseUrl, page) => {
    if (page <= 1) return baseUrl;
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}page=${page}`;
  };

  const loadOrders = async (baseUrl, page = currentPage) => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const fullUrl = getFullUrl(baseUrl, page);
      const response = await axios.get(fullUrl);
      const data = response.data;
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
    if (vendorId) {
      const mainUrl = `vendor/orders/${vendorId}/`;
      setFetchUrl(mainUrl);
      loadOrders(mainUrl, 1);
    }
  }, [vendorId]);

  useEffect(() => {
    if (fetchUrl) {
      loadOrders(fetchUrl, currentPage);
    }
  }, [currentPage, fetchUrl]);

  const handleFilterOrders = async (param) => {
    setActiveFilter(param);
    const filterUrl =
      param === "no-filter"
        ? `vendor/orders/${vendorId}/`
        : `vendor/orders-filter/${vendorId}?filter=${param}`;
    setFetchUrl(filterUrl);
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (statusLower === 'processing' || statusLower === 'shipping processing') return 'bg-blue-100 text-blue-800';
    if (statusLower === 'shipped') return 'bg-indigo-100 text-indigo-800';
    if (statusLower === 'delivered' || statusLower === 'fulfilled') return 'bg-green-100 text-green-800';
    if (statusLower === 'cancelled') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const filterOptions = [
    { value: "no-filter", label: "All Orders" },
    { value: "pending", label: "Payment: Pending" },
    { value: "paid", label: "Payment: Paid" },
    { value: "processing", label: "Payment: Processing" },
    { value: "cancelled", label: "Payment: Cancelled" },
    { value: "Fulfilled", label: "Status: Fulfilled" },
    { value: "Cancelled", label: "Status: Cancelled" },
    { value: "Pending", label: "Status: Pending" },
    { value: "latest", label: "Date: Latest" },
    { value: "oldest", label: "Date: Oldest" },
  ];

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8 lg:p-12 overflow-x-hidden">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-blue-600" />
            Orders
          </h1>
          <p className="text-gray-500 mt-1">Manage and track all your customer orders.</p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Filter size={18} />
              <span className="font-medium">Filter:</span>
            </div>
            <select
              value={activeFilter}
              onChange={(e) => handleFilterOrders(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="ml-auto text-sm text-gray-500">
              {totalCount} order{totalCount !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((o) => (
                      <tr key={o.oid} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <Package size={18} className="text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-900">#{o.oid}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{o.full_name}</p>
                          <p className="text-sm text-gray-500">{o.email}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {moment(o.date).format("MMM DD, YYYY")}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(o.order_status)}`}>
                            {o.order_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link
                            to={`/vendor/orders/${o.oid}/`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                          >
                            <Eye size={16} />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center">
                            <ShoppingBag size={48} className="text-gray-200 mb-3" />
                            <p className="text-gray-500 font-medium">No orders found</p>
                            <p className="text-gray-400 text-sm">Orders will appear here once customers make purchases.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalCount > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center py-4 px-6 border-t border-gray-100 bg-gray-50">
                  <p className="text-sm text-gray-600 mb-3 sm:mb-0">
                    Page {currentPage} of {Math.ceil(totalCount / 10) || 1}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={!hasPrev || loading}
                      className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      disabled={!hasNext || loading}
                      className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Orders;

