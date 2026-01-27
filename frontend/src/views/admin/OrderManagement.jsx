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

      // Adjust based on your Django pagination structure
      // Common structures: response.data.results or response.data.data
      const ordersData =
        response.data.results || response.data.data || response.data;
      setOrders(Array.isArray(ordersData) ? ordersData : []);

      // Update pagination info based on Django's pagination response
      setPagination({
        currentPage: page,
        totalPages:
          response.data.total_pages ||
          Math.ceil((response.data.count || 0) / pagination.pageSize),
        totalCount: response.data.count || 0,
        pageSize: pagination.pageSize,
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
          <h1 className="text-2xl font-semibold mb-4">Order Management</h1>

          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-gray-500" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center p-8 text-gray-500">No orders found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse">
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      <th className="px-4 py-2 text-left">Order ID</th>
                      <th className="px-4 py-2 text-left">Customer</th>
                      <th className="px-4 py-2 text-left">Vendor</th>
                      <th className="px-4 py-2 text-left">Total</th>
                      <th className="px-4 py-2 text-left">Payment</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orders.map((o) => (
                      <tr key={o.oid}>
                        <td className="px-4 py-2">#{o.oid}</td>
                        <td className="px-4 py-2">{o.full_name || o.email}</td>
                        <td className="px-4 py-2">
                          {o.vendors && Array.isArray(o.vendors)
                            ? o.vendors.map((v) => v.name).join(", ")
                            : "N/A"}
                        </td>
                        <td className="px-4 py-2">₹{o.total}</td>
                        <td className="px-4 py-2 capitalize">
                          {o.payment_status}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              o.order_status === "Delivered"
                                ? "bg-green-100 text-green-700"
                                : o.order_status === "Cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {o.order_status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {new Date(o.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Link
                            to={`/admin/orders/${o.oid}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye size={18} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {orders.length} of {pagination.totalCount} orders
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="p-2 rounded border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <span className="px-4 py-2 text-sm">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="p-2 rounded border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
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
