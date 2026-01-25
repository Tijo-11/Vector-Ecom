import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Tag, Plus, Edit, Trash2, CheckCircle, X } from "lucide-react";
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

  // Construct URL with page param
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

      // Handle paginated coupons
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

      // Stats (array with one object)
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
        await fetchData(currentPage); // Refetch current page
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
      await fetchData(1); // Refresh to page 1 after create
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
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h4 className="flex items-center text-xl font-semibold">
            <Tag className="w-6 h-6 mr-2 text-blue-600" /> Coupons
          </h4>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
          >
            <Plus className="w-5 h-5 mr-2" /> Create New Coupon
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-lg text-gray-600">Loading coupons...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-green-500 text-white rounded-xl shadow p-6">
                <CheckCircle className="w-12 h-12 opacity-20 mb-2" />
                <h6 className="uppercase tracking-wide text-sm">
                  Total Coupons
                </h6>
                <h1 className="text-4xl font-bold">
                  {stats?.total_coupons || 0}
                </h1>
              </div>
              <div className="bg-red-500 text-white rounded-xl shadow p-6">
                <CheckCircle className="w-12 h-12 opacity-20 mb-2" />
                <h6 className="uppercase tracking-wide text-sm">
                  Active Coupons
                </h6>
                <h1 className="text-4xl font-bold">
                  {stats?.active_coupons || 0}
                </h1>
              </div>
            </div>

            {/* Coupons Table */}
            <div className="bg-white shadow rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Code</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Discount</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {coupons.length > 0 ? (
                      coupons.map((coupon) => (
                        <tr key={coupon.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">
                            {coupon.code}
                          </td>
                          <td className="px-4 py-3">Percentage</td>
                          <td className="px-4 py-3">{coupon.discount}%</td>
                          <td className="px-4 py-3">
                            {coupon.active ? (
                              <span className="text-green-600 font-medium">
                                Active
                              </span>
                            ) : (
                              <span className="text-red-600 font-medium">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 flex space-x-2">
                            <Link
                              to={`/vendor/coupon/${coupon.id}/`}
                              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center py-8 text-gray-500"
                        >
                          No coupons yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {totalCount > coupons.length && (
                  <div className="flex flex-col sm:flex-row justify-between items-center py-4 px-6 border-t bg-gray-50">
                    <p className="text-sm text-gray-700 mb-2 sm:mb-0">
                      Showing page {currentPage} ({totalCount} total coupons)
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
              </div>
            </div>
          </>
        )}

        {/* Create Coupon Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-lg font-semibold">Create New Coupon</h5>
                <button onClick={() => setShowModal(false)}>
                  <X className="w-6 h-6 text-gray-600 hover:text-gray-800" />
                </button>
              </div>
              <form onSubmit={handleCreateCoupon}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <input
                    type="text"
                    name="code"
                    placeholder="Enter Coupon Code"
                    onChange={handleCreateCouponChange}
                    value={createCoupons.code}
                    required
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">E.g. DESTINY2024</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    name="discount"
                    placeholder="Enter Discount"
                    onChange={handleCreateCouponChange}
                    value={createCoupons.discount}
                    min="1"
                    max="99"
                    step="1"
                    required
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    NOTE: Discount must be between <b>1%</b> and <b>99%</b>
                  </p>
                </div>
                <div className="flex items-center mb-6">
                  <input
                    checked={createCoupons.active}
                    onChange={handleCreateCouponChange}
                    name="active"
                    type="checkbox"
                    className="mr-2 h-5 w-5 text-blue-600"
                  />
                  <label className="text-sm">Activate Coupon</label>
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg shadow transition"
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
