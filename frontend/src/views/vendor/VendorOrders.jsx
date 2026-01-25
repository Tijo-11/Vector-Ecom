import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import { Eye } from "lucide-react";

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
  const [fetchUrl, setFetchUrl] = useState(""); // Base URL (main or filtered)

  const axios = apiInstance;
  const userData = UserData();

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const vendorId = userData?.vendor_id;

  // Construct full URL with optional page param
  const getFullUrl = (baseUrl, page) => {
    if (page <= 1) return baseUrl;
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}page=${page}`;
  };

  // Shared function to load orders
  const loadOrders = async (baseUrl, page = currentPage) => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const fullUrl = getFullUrl(baseUrl, page);
      const response = await axios.get(fullUrl);

      // Handle both paginated object and direct array (fallback)
      const data = response.data;
      const orderList = Array.isArray(data) ? data : data.results || [];
      const count = data.count ?? orderList.length;
      const next = data.next ?? null;
      const prev = data.previous ?? null;

      setOrders(orderList);
      setTotalCount(count);
      setHasNext(!!next);
      setHasPrev(!!prev);
      // Update current page to match what was actually fetched
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

  // Initial load (main list)
  useEffect(() => {
    if (vendorId) {
      const mainUrl = `vendor/orders/${vendorId}/`;
      setFetchUrl(mainUrl);
      loadOrders(mainUrl, 1);
    }
  }, [vendorId]);

  // Load whenever page or fetchUrl changes
  useEffect(() => {
    if (fetchUrl) {
      loadOrders(fetchUrl, currentPage);
    }
  }, [currentPage, fetchUrl]);

  const handleFilterOrders = async (param) => {
    const filterUrl =
      param === "no-filter"
        ? `vendor/orders/${vendorId}/`
        : `vendor/orders-filter/${vendorId}?filter=${param}`;
    setFetchUrl(filterUrl);
    setCurrentPage(1); // Reset to first page on filter change
  };

  return (
    <div className="w-full px-4" id="main">
      <div className="flex flex-row h-full">
        <Sidebar />
        <div className="flex-1 mt-4 px-4">
          <h4 className="text-xl font-semibold flex items-center">
            <i className="bi bi-grid mr-2" /> All Orders
          </h4>

          <div className="flex flex-wrap gap-3 relative py-4">
            {/* Filter Dropdown */}
            <div className="relative group">
              <button
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
                type="button"
              >
                Filter <i className="fas fa-sliders ml-2" />
              </button>
              <ul className="absolute left-0 mt-1 hidden group-hover:block bg-white shadow-lg rounded-md z-10 w-48">
                <li>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => handleFilterOrders("no-filter")}
                  >
                    No Filter
                  </button>
                </li>
                <li>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => handleFilterOrders("pending")}
                  >
                    Payment Status: Pending
                  </button>
                </li>
                <li>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => handleFilterOrders("paid")}
                  >
                    Payment Status: Paid
                  </button>
                </li>
                <li>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => handleFilterOrders("processing")}
                  >
                    Payment Status: Processing
                  </button>
                </li>
                <li>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => handleFilterOrders("cancelled")}
                  >
                    Payment Status: Cancelled
                  </button>
                </li>
                <li>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => handleFilterOrders("Fulfilled")}
                  >
                    Order Status: Fulfilled
                  </button>
                </li>
                <li>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => handleFilterOrders("Cancelled")}
                  >
                    Order Status: Cancelled
                  </button>
                </li>
                <li>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => handleFilterOrders("Pending")}
                  >
                    Order Status: Pending
                  </button>
                </li>
                <hr className="my-2" />
                <li>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => handleFilterOrders("latest")}
                  >
                    Date: Latest
                  </button>
                </li>
                <li>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => handleFilterOrders("oldest")}
                  >
                    Date: Oldest
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Table Container */}
          <div className="mt-2 mb-3 bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                  <p className="text-lg text-gray-600">Loading orders...</p>
                </div>
              ) : (
                <>
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-800 text-white">
                      <tr>
                        <th className="py-3 px-4 text-left">#ID</th>
                        <th className="py-3 px-4 text-left">Name</th>
                        <th className="py-3 px-4 text-left">Date</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o.oid} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">#{o.oid}</td>
                          <td className="py-3 px-4">{o.full_name}</td>
                          <td className="py-3 px-4">
                            {moment(o.date).format("MM/DD/YYYY")}
                          </td>
                          <td className="py-3 px-4">
                            {o.order_status?.toUpperCase()}
                          </td>
                          <td className="py-3 px-4">
                            <Link
                              to={`/vendor/orders/${o.oid}/`}
                              className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 flex items-center justify-center"
                            >
                              <Eye size={16} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td
                            colSpan="5"
                            className="text-center py-8 text-lg text-gray-500"
                          >
                            No Orders Yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  {totalCount > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center py-4 px-6 border-t bg-gray-50">
                      <p className="text-sm text-gray-700 mb-2 sm:mb-0">
                        Showing page {currentPage} ({totalCount} total orders)
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={!hasPrev || loading}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage((prev) => prev + 1)}
                          disabled={!hasNext || loading}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Orders;
