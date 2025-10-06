import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Tag, ArrowLeft, CheckCircle } from "lucide-react";
import Swal from "sweetalert2";

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";
import log from "loglevel";

function EditCoupon() {
  const [coupon, setCoupon] = useState({});

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const axios = apiInstance;
  const userData = UserData();
  const param = useParams();

  const fetchData = async () => {
    try {
      const res = await axios.get(
        `vendor-coupon-detail/${userData?.vendor_id}/${param.id}`
      );
      setCoupon(res.data);
    } catch (error) {
      log.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateCouponChange = (event) => {
    setCoupon({
      ...coupon,
      [event.target.name]:
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value,
    });
  };

  const handleUpdateCoupon = async (e) => {
    e.preventDefault();
    const formdata = new FormData();

    formdata.append("vendor", userData?.vendor_id);
    formdata.append("code", coupon.code);
    formdata.append("discount", coupon.discount);
    formdata.append("active", coupon.active);

    await axios.patch(
      `vendor-coupon-detail/${userData?.vendor_id}/${param.id}/`,
      formdata
    );
    Swal.fire({
      icon: "success",
      title: "Coupon Updated",
    });
  };

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 p-6">
        {/* Header */}
        <h4 className="flex items-center text-xl font-semibold mb-6">
          <Tag className="w-6 h-6 mr-2 text-blue-600" /> Edit Coupon
        </h4>

        {/* Form */}
        <form
          onSubmit={handleUpdateCoupon}
          className="bg-white shadow rounded-xl p-6 max-w-lg"
        >
          {/* Coupon Code */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Code</label>
            <input
              type="text"
              name="code"
              placeholder="Enter Coupon Code"
              onChange={handleUpdateCouponChange}
              value={coupon.code || ""}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 mt-1">E.g. DESTINY2024</p>
          </div>

          {/* Discount */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Discount (%)
            </label>
            <input
              type="number"
              name="discount"
              placeholder="Enter Discount"
              onChange={handleUpdateCouponChange}
              value={coupon.discount || ""}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              NOTE: Discount is in <b>percentage</b>
            </p>
          </div>

          {/* Active Checkbox */}
          <div className="flex items-center mb-6">
            <input
              checked={coupon.active || false}
              onChange={handleUpdateCouponChange}
              name="active"
              type="checkbox"
              className="mr-2"
            />
            <label className="text-sm">Activate Coupon</label>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <Link
              to="/vendor/coupon/"
              className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg shadow"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
            </Link>
            <button
              type="submit"
              className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow"
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Update Coupon
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCoupon;
