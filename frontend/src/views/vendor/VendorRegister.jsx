import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Loader2, Store } from "lucide-react"; // lucide-react icons

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";

function VendorRegister() {
  if (UserData()?.vendor_id !== 0) {
    window.location.href = "/vendor/dashboard/";
  }

  const [vendor, setVendor] = useState({
    image: null,
    name: "",
    email: "",
    description: "",
    mobile: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (event) => {
    setVendor({
      ...vendor,
      [event.target.name]: event.target.value,
    });
  };

  const handleFileChange = (event) => {
    setVendor({
      ...vendor,
      [event.target.name]: event.target.files[0],
    });
  };

  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formdata = new FormData();
    setIsLoading(true);

    formdata.append("image", vendor.image);
    formdata.append("name", vendor.name);
    formdata.append("email", vendor.email);
    formdata.append("description", vendor.description);
    formdata.append("mobile", vendor.mobile);
    formdata.append("user_id", UserData()?.user_id);

    await apiInstance.post(`vendor-register/`, formdata, config).then((res) => {
      if (res.data.message === "Created vendor account") {
        Swal.fire({
          icon: "success",
          title: "Vendor Account Created Successfully",
          text: "Login to continue to dashboard",
        });
        setIsLoading(false);
        navigate("/logout");
      }
    });
  };

  return (
    <main className="flex justify-center items-center py-10 min-h-screen bg-gray-50">
      <div className="w-full max-w-lg">
        <div className="bg-white shadow-lg rounded-2xl p-6">
          <h3 className="text-2xl font-bold text-center mb-6">
            Register Vendor Account
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Shop Avatar */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Shop Avatar
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                name="image"
                required
                className="block w-full text-sm text-gray-600 border rounded-lg cursor-pointer focus:outline-none file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* Shop Name */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Shop Name
              </label>
              <input
                type="text"
                onChange={handleInputChange}
                name="name"
                placeholder="Shop Name"
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Shop Email Address
              </label>
              <input
                type="email"
                onChange={handleInputChange}
                name="email"
                placeholder="Shop Email Address"
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Shop Contact Number
              </label>
              <input
                type="text"
                onChange={handleInputChange}
                name="mobile"
                placeholder="Mobile Number"
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Shop Description
              </label>
              <textarea
                onChange={handleInputChange}
                name="description"
                rows="4"
                placeholder="Enter shop description"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
              className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-70"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Store className="w-5 h-5" />
                  <span>Create Shop</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default VendorRegister;
