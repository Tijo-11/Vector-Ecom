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
import Toast from "../../plugin/Toast";

// Placeholder for missing vendor images
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/40x40?text=No+Image";

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10,
  });

  const apiBaseURL = apiInstance.defaults.baseURL?.replace(/\/$/, "") || "";

  const fetchVendors = async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiInstance.get(`/admin/vendors/?page=${page}`);
      console.log("Raw API response:", response.data); // ← Keep this temporarily for debugging

      const dataList = response.data.results || response.data || [];
      setVendors(Array.isArray(dataList) ? dataList : []);

      const count =
        response.data.count ?? response.data.total ?? dataList.length;

      setPagination({
        currentPage: page,
        totalPages: response.data.total_pages ?? Math.ceil(count / 10),
        totalCount: count,
        pageSize: 10,
      });
    } catch (error) {
      console.error("Error fetching vendors:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to load vendors",
      });
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
      fetchVendors(pagination.currentPage);
      Toast().fire({
        icon: "success",
        title: "Vendor status updated successfully",
      });
    } catch (error) {
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

  const getImageSrc = (imageUrl) => {
    if (!imageUrl) return PLACEHOLDER_IMAGE;
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${apiBaseURL}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-2xl font-semibold mb-6">Vendor Management</h2>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="animate-spin text-gray-500 h-10 w-10" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-lg">
              No vendors found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="pb-4 font-medium">Image</th>
                      <th className="pb-4 font-medium">Name</th>
                      <th className="pb-4 font-medium">Email</th>
                      <th className="pb-4 font-medium">Mobile</th>
                      <th className="pb-4 font-medium">Date Joined</th>
                      <th className="pb-4 font-medium">Status</th>
                      <th className="pb-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((v) => (
                      <tr
                        key={v.id}
                        className="border-b last:border-none hover:bg-gray-50 transition"
                      >
                        <td className="py-5">
                          <img
                            src={getImageSrc(v.image)}
                            alt={v.name || "Vendor"}
                            className="w-14 h-14 object-cover rounded-full border-2 border-gray-200"
                            onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
                          />
                        </td>
                        <td className="py-5 font-semibold text-gray-800">
                          {v.name || "N/A"}
                        </td>
                        <td className="py-5 text-gray-700">
                          {v.email || "N/A"}
                        </td>
                        <td className="py-5 text-gray-700">
                          {v.mobile || "N/A"}
                        </td>
                        <td className="py-5 text-gray-600">
                          {v.date
                            ? new Date(v.date).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="py-5">
                          <span
                            className={`px-4 py-2 rounded-full text-xs font-medium ${
                              v.active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {v.active ? "Active" : "Blocked"}
                          </span>
                        </td>
                        <td className="py-5 text-right">
                          <button
                            onClick={() => handleToggleActive(v.id)}
                            className="inline-flex items-center font-medium transition hover:scale-105"
                          >
                            {v.active ? (
                              <>
                                <Ban size={20} className="mr-2 text-red-600" />
                                <span className="text-red-600">Block</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck
                                  size={20}
                                  className="mr-2 text-green-600"
                                />
                                <span className="text-green-600">Unblock</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <div className="text-sm text-gray-600">
                  Showing {vendors.length} of {pagination.totalCount} vendors
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
};

export default VendorManagement;
