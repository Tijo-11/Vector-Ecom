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
  const [createCoupons, setCreateCoupons] = useState({
    code: "",
    discount: "",
    active: true,
  });
  const [showModal, setShowModal] = useState(false);

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const axios = apiInstance;
  const userData = UserData();

  const fetchData = async () => {
    try {
      const couponRes = await axios.get(
        `vendor-coupon-list/${userData?.vendor_id}/`
      );
      setCoupons(couponRes.data);

      const statsRes = await axios.get(
        `vendor-coupon-stats/${userData?.vendor_id}/`
      );
      setStats(statsRes.data[0]);
    } catch (error) {
      log.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteCoupon = async (couponId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action will permanently delete the coupon.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626", // red-600
      cancelButtonColor: "#6b7280", // gray-500
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await axios.delete(
          `vendor-coupon-detail/${userData?.vendor_id}/${couponId}/`
        );
        await fetchData();
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
    const formdata = new FormData();

    formdata.append("vendor_id", userData?.vendor_id);
    formdata.append("code", createCoupons.code);
    formdata.append("discount", createCoupons.discount);
    formdata.append("active", createCoupons.active);

    await axios.post(`vendor-coupon-create/${userData?.vendor_id}/`, formdata);
    setShowModal(false);
    await fetchData();
  };

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h4 className="flex items-center text-xl font-semibold">
            <Tag className="w-6 h-6 mr-2 text-blue-600" /> Coupons
          </h4>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
          >
            <Plus className="w-5 h-5 mr-2" /> Create New Coupon
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-500 text-white rounded-xl shadow p-6">
            <CheckCircle className="w-12 h-12 opacity-20 mb-2" />
            <h6 className="uppercase tracking-wide">Total Coupons</h6>
            <h1 className="text-4xl font-bold">{stats?.total_coupons}</h1>
          </div>
          <div className="bg-red-500 text-white rounded-xl shadow p-6">
            <CheckCircle className="w-12 h-12 opacity-20 mb-2" />
            <h6 className="uppercase tracking-wide">Active Coupons</h6>
            <h1 className="text-4xl font-bold">{stats?.active_coupons}</h1>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="bg-white shadow rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Discount</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-4 py-2">{coupon.code}</td>
                  <td className="px-4 py-2">Percentage</td>
                  <td className="px-4 py-2">{coupon.discount}%</td>
                  <td className="px-4 py-2">
                    {coupon.active ? (
                      <span className="text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-red-600 font-medium">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-2 flex space-x-2">
                    <Link
                      to={`/vendor/coupon/${coupon.id}/`}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {coupons.length < 1 && (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">
                    No coupons yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    NOTE: Discount is in <b>percentage</b>
                  </p>
                </div>
                <div className="flex items-center mb-4">
                  <input
                    checked={createCoupons.active}
                    onChange={handleCreateCouponChange}
                    name="active"
                    type="checkbox"
                    className="mr-2"
                  />
                  <label className="text-sm">Activate Coupon</label>
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg shadow"
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
