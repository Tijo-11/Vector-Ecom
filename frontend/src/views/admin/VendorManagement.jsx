import React, { useState, useEffect } from "react";
import AdminSidebar from "./Sidebar";
import {
  Ban,
  ShieldCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import apiInstance from "../../utils/axios";
import Toast from "../../plugin/toast";

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  });

  const fetchVendors = async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiInstance.get(`/admin/vendors/?page=${page}`);

      // Handle paginated response
      const vendorsData =
        response.data.results || response.data.data || response.data;
      setVendors(Array.isArray(vendorsData) ? vendorsData : []);

      // Update pagination info
      setPagination({
        currentPage: page,
        totalPages:
          response.data.total_pages ||
          Math.ceil((response.data.count || 0) / pagination.pageSize),
        totalCount: response.data.count || 0,
        pageSize: pagination.pageSize,
      });
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors(1);
  }, []);

  const handleToggleActive = async (id) => {
    try {
      await apiInstance.patch(`/admin/vendors/${id}/toggle/`);
      fetchVendors(pagination.currentPage); // Refresh current page
      Toast().fire({
        icon: "success",
        title: "Vendor status updated",
      });
    } catch (error) {
      console.error("Error toggling vendor:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to update status",
      });
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchVendors(newPage);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Vendor Management</h2>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-gray-500" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No vendors found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2">Image</th>
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Email</th>
                      <th className="pb-2">Mobile</th>
                      <th className="pb-2">Date Joined</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((v) => (
                      <tr key={v.id} className="border-b last:border-none">
                        <td className="py-2">
                          <img
                            src={v.image}
                            alt={v.name}
                            className="w-10 h-10 object-cover rounded-full"
                          />
                        </td>
                        <td className="py-2 font-medium">{v.name}</td>
                        <td className="py-2">{v.user?.email || "N/A"}</td>
                        <td className="py-2">{v.mobile}</td>
                        <td className="py-2">
                          {new Date(v.date).toLocaleDateString()}
                        </td>
                        <td>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              v.active
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {v.active ? "Active" : "Blocked"}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => handleToggleActive(v.id)}
                            className={`flex items-center ml-auto ${
                              v.active
                                ? "text-red-600 hover:text-red-800"
                                : "text-green-600 hover:text-green-800"
                            }`}
                          >
                            {v.active ? (
                              <>
                                <Ban size={16} className="mr-1" /> Block
                              </>
                            ) : (
                              <>
                                <ShieldCheck size={16} className="mr-1" />{" "}
                                Unblock
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {vendors.length} of {pagination.totalCount} vendors
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
};

export default VendorManagement;
