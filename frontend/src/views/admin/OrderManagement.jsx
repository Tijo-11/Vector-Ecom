import React, { useState, useEffect } from "react";
import AdminSidebar from "./Sidebar";
import { Loader2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import apiInstance from "../../utils/axios";
import { Link } from "react-router-dom";

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  });

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiInstance.get(`/admin/orders/?page=${page}`);

      // For debugging: remove after confirming it works
      console.log("Raw orders API response:", response.data);

      const ordersData =
        response.data.results || response.data.data || response.data;
      setOrders(Array.isArray(ordersData) ? ordersData : []);

      setPagination({
        currentPage: page,
        totalPages:
          response.data.total_pages ||
          Math.ceil((response.data.count || ordersData.length) / 10),
        totalCount: response.data.count || ordersData.length,
        pageSize: 10,
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchOrders(newPage);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border">
          <h1 className="text-2xl font-semibold mb-6">Order Management</h1>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="animate-spin text-gray-500 h-10 w-10" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-lg">
              No orders found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="pb-4 font-medium">Order ID</th>
                      <th className="pb-4 font-medium">Customer</th>
                      <th className="pb-4 font-medium">Vendors</th>
                      <th className="pb-4 font-medium">Total</th>
                      <th className="pb-4 font-medium">Payment</th>
                      <th className="pb-4 font-medium">Status</th>
                      <th className="pb-4 font-medium">Date</th>
                      {/* <th className="pb-4 font-medium text-right">Actions</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr
                        key={o.oid || o.id}
                        className="border-b last:border-none hover:bg-gray-50 transition"
                      >
                        <td className="py-5 font-medium">#{o.oid}</td>
                        <td className="py-5">{o.full_name || "N/A"}</td>
                        <td className="py-5">
                          {o.vendor_names ? o.vendor_names : "N/A"}
                        </td>
                        <td className="py-5 font-medium">₹{o.total || 0}</td>
                        <td className="py-5">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                              o.payment_status === "paid"
                                ? "bg-green-100 text-green-800"
                                : o.payment_status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {o.payment_status || "N/A"}
                          </span>
                        </td>
                        <td className="py-5">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              o.order_status === "Delivered"
                                ? "bg-green-100 text-green-800"
                                : o.order_status === "Cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : o.order_status === "Processing" ||
                                      o.order_status === "Shipped"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {o.order_status || "Pending"}
                          </span>
                        </td>
                        <td className="py-5 text-gray-600">
                          {o.date
                            ? new Date(o.date).toLocaleDateString()
                            : "N/A"}
                        </td>
                        {/* <td className="py-5 text-right">
                          <Link
                            to={`/admin/orders/${o.oid}`}
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <Eye size={18} className="mr-1" />
                            View
                          </Link>
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <div className="text-sm text-gray-600">
                  Showing {orders.length} of {pagination.totalCount} orders
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="p-2.5 rounded border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={22} />
                  </button>

                  <span className="px-5 py-2 text-sm font-medium">
                    Page {pagination.currentPage} of{" "}
                    {pagination.totalPages || 1}
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="p-2.5 rounded border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight size={22} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
