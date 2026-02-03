import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Tag, Plus, Edit, Trash2, CheckCircle, X, Ticket, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight } from "lucide-react";
import Swal from "sweetalert2";

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";
import log from "loglevel";

function Coupon() {
  const [stats, setStats] = useState({});
  const [coupons, setCoupons] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [createCoupons, setCreateCoupons] = useState({
    code: "",
    discount: "",
    active: true,
  });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const axios = apiInstance;
  const userData = UserData();
  const vendorId = userData?.vendor_id;

  const getCouponUrl = (page) => {
    const base = `vendor-coupon-list/${vendorId}/`;
    return page <= 1 ? base : `${base}?page=${page}`;
  };

  const fetchData = async (page = currentPage) => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const couponUrl = getCouponUrl(page);
      const [couponRes, statsRes] = await Promise.all([
        axios.get(couponUrl),
        axios.get(`vendor-coupon-stats/${vendorId}/`),
      ]);

      const couponData = couponRes.data;
      const couponList = Array.isArray(couponData)
        ? couponData
        : couponData.results || [];
      const count = couponData.count ?? couponList.length;
      const next = couponData.next ?? null;
      const prev = couponData.previous ?? null;

      setCoupons(couponList);
      setTotalCount(count);
      setHasNext(!!next);
      setHasPrev(!!prev);
      setCurrentPage(page);
      setStats(statsRes.data[0] || {});
    } catch (error) {
      log.error("Error fetching data:", error);
      setCoupons([]);
      setTotalCount(0);
      setHasNext(false);
      setHasPrev(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, [vendorId]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const handleDeleteCoupon = async (couponId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action will permanently delete the coupon.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await axios.delete(`vendor-coupon-detail/${vendorId}/${couponId}/`);
        await fetchData(currentPage);
        Swal.fire("Deleted!", "Coupon has been deleted.", "success");
      }
    });
  };

  const handleCreateCouponChange = (event) => {
    setCreateCoupons({
      ...createCoupons,
      [event.target.name]:
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value,
    });
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();

    if (!createCoupons.code.trim()) {
      Swal.fire({
        icon: "error",
        title: "Invalid Code",
        text: "Coupon code is required.",
      });
      return;
    }

    const discount = Number(createCoupons.discount);
    if (
      isNaN(discount) ||
      discount <= 0 ||
      discount >= 100 ||
      !Number.isInteger(discount)
    ) {
      Swal.fire({
        icon: "error",
        title: "Invalid Discount",
        text: "Discount must be a whole number between 1 and 99.",
      });
      return;
    }

    const formdata = new FormData();
    formdata.append("vendor_id", vendorId);
    formdata.append("code", createCoupons.code.trim().toUpperCase());
    formdata.append("discount", discount);
    formdata.append("active", createCoupons.active);

    try {
      await axios.post(`vendor-coupon-create/${vendorId}/`, formdata);
      Swal.fire({
        icon: "success",
        title: "Coupon Created",
        text: "New coupon has been successfully created.",
        timer: 2000,
      });
      setShowModal(false);
      setCreateCoupons({ code: "", discount: "", active: true });
      await fetchData(1);
    } catch (error) {
      log.error("Error creating coupon:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to Create Coupon",
        text: error.response?.data?.message || "Something went wrong.",
      });
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8 lg:p-12 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Ticket className="w-7 h-7 text-purple-600" />
              Coupons
            </h1>
            <p className="text-gray-500 mt-1">Create and manage discount coupons for your customers.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-purple-700 transition shadow-sm"
          >
            <Plus size={18} />
            Create Coupon
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600 mb-4"></div>
            <p className="text-gray-500">Loading coupons...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10">
                  <Ticket className="w-32 h-32 -mr-8 -mt-8" />
                </div>
                <div className="relative z-10">
                  <p className="text-purple-100 font-medium uppercase tracking-wider text-sm flex items-center gap-2">
                    <Tag size={16} /> Total Coupons
                  </p>
                  <h2 className="text-4xl font-bold mt-3 tracking-tight">
                    {stats?.total_coupons || 0}
                  </h2>
                  <p className="text-purple-100 text-sm mt-2">All time created</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10">
                  <CheckCircle className="w-32 h-32 -mr-8 -mt-8" />
                </div>
                <div className="relative z-10">
                  <p className="text-green-100 font-medium uppercase tracking-wider text-sm flex items-center gap-2">
                    <CheckCircle size={16} /> Active Coupons
                  </p>
                  <h2 className="text-4xl font-bold mt-3 tracking-tight">
                    {stats?.active_coupons || 0}
                  </h2>
                  <p className="text-green-100 text-sm mt-2">Currently active</p>
                </div>
              </div>
            </div>

            {/* Coupons Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Discount</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {coupons.length > 0 ? (
                      coupons.map((coupon) => (
                        <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-50 rounded-lg">
                                <Tag size={18} className="text-purple-600" />
                              </div>
                              <span className="font-semibold text-gray-900 tracking-wide">{coupon.code}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">Percentage</td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-purple-600">{coupon.discount}%</span>
                          </td>
                          <td className="px-6 py-4">
                            {coupon.active ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                <ToggleRight size={14} />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                                <ToggleLeft size={14} />
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                to={`/vendor/coupon/${coupon.id}/`}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit"
                              >
                                <Edit size={18} />
                              </Link>
                              <button
                                onClick={() => handleDeleteCoupon(coupon.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center">
                            <Ticket size={48} className="text-gray-200 mb-3" />
                            <p className="text-gray-500 font-medium">No coupons yet</p>
                            <p className="text-gray-400 text-sm mt-1">Create your first coupon to offer discounts.</p>
                            <button
                              onClick={() => setShowModal(true)}
                              className="mt-4 inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
                            >
                              <Plus size={16} />
                              Create Coupon
                            </button>
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
            </div>
          </>
        )}

        {/* Create Coupon Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Create New Coupon</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleCreateCoupon} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Coupon Code</label>
                  <input
                    type="text"
                    name="code"
                    placeholder="e.g. SUMMER2024"
                    onChange={handleCreateCouponChange}
                    value={createCoupons.code}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Use uppercase letters and numbers</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Percentage</label>
                  <input
                    type="number"
                    name="discount"
                    placeholder="e.g. 20"
                    onChange={handleCreateCouponChange}
                    value={createCoupons.discount}
                    min="1"
                    max="99"
                    step="1"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Must be between 1% and 99%</p>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <input
                    checked={createCoupons.active}
                    onChange={handleCreateCouponChange}
                    name="active"
                    type="checkbox"
                    id="active-checkbox"
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="active-checkbox" className="text-sm text-gray-700">Activate coupon immediately</label>
                </div>
                <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium shadow-sm transition"
                >
                  Create Coupon
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Coupon;

