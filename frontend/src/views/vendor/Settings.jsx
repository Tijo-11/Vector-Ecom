import React, { useState, useEffect } from "react";
import { Settings2, Store, User, Upload, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";
import log from "loglevel";

function Settings() {
  const [profileData, setProfileData] = useState({
    image: null,
    full_name: "",
    phone: "",
    about: "",
  });

  const [vendorData, setVendorData] = useState({
    name: "",
    description: "",
    image: null,
  });

  const [profileImage, setProfileImage] = useState("");
  const [vendorImage, setVendorImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const axios = apiInstance;
  const userData = UserData();

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const vendorId = userData?.vendor_id;

  const fetchData = async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const res = await axios.get(`vendor-settings/${vendorId}/`);
      const data = res.data;
      setProfileData(data?.profile || {});
      setVendorData(data || {});
      setProfileImage(data?.profile?.image || "");
      setVendorImage(data?.image || "");
    } catch (error) {
      log.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [vendorId]);

  const handleInputChange = (event) => {
    setProfileData({
      ...profileData,
      [event.target.name]: event.target.value,
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({
          ...profileData,
          [event.target.name]: file,
        });
        if (event.target.name === "image") {
          setProfileImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVendorInputChange = (event) => {
    setVendorData({
      ...vendorData,
      [event.target.name]: event.target.value,
    });
  };

  const handleVendorFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVendorData({
          ...vendorData,
          [event.target.name]: file,
        });
        if (event.target.name === "image") {
          setVendorImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const formdata = new FormData();
    formdata.append("name", vendorData.name);
    formdata.append("description", vendorData.description);
    if (vendorData.image instanceof File) {
      formdata.append("image", vendorData.image);
    }
    formdata.append("full_name", profileData.full_name);
    formdata.append("phone", profileData.phone);
    formdata.append("about", profileData.about);
    if (profileData.image instanceof File) {
      formdata.append("p_image", profileData.image);
    }

    try {
      await axios.patch(`vendor-settings/${vendorId}/`, formdata, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Swal.fire({
        icon: "success",
        title: "Settings Updated",
        text: "Your settings have been saved successfully.",
        timer: 2000,
      });
    } catch (error) {
      log.error("Error updating settings:", error);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error?.response?.data?.message || "Failed to update settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8 lg:p-12 overflow-x-hidden">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Settings2 className="w-7 h-7 text-gray-700" />
            Settings
          </h1>
          <p className="text-gray-500 mt-1">Manage your shop and profile settings.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-gray-600 mb-4"></div>
            <p className="text-gray-500">Loading settings...</p>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-8">
            {/* Shop Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                <Store size={20} className="text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900">Shop Settings</h3>
              </div>
              <div className="p-6 space-y-6">
                {/* Shop Image */}
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="relative group">
                    <img
                      src={vendorImage || "https://via.placeholder.com/120?text=Shop"}
                      alt="Shop"
                      className="w-28 h-28 rounded-xl object-cover border-2 border-gray-100"
                    />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition cursor-pointer">
                      <Upload size={24} className="text-white" />
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleVendorFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
                      <input
                        type="text"
                        name="name"
                        value={vendorData.name || ""}
                        onChange={handleVendorInputChange}
                        placeholder="Enter your shop name"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Shop Description</label>
                      <textarea
                        name="description"
                        value={vendorData.description || ""}
                        onChange={handleVendorInputChange}
                        placeholder="Describe your shop"
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                <User size={20} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Profile Settings</h3>
              </div>
              <div className="p-6 space-y-6">
                {/* Profile Image */}
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="relative group">
                    <img
                      src={profileImage || "https://via.placeholder.com/120?text=Profile"}
                      alt="Profile"
                      className="w-28 h-28 rounded-full object-cover border-2 border-gray-100"
                    />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer">
                      <Upload size={24} className="text-white" />
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          name="full_name"
                          value={profileData.full_name || ""}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="text"
                          name="phone"
                          value={profileData.phone || ""}
                          onChange={handleInputChange}
                          placeholder="Your phone number"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">About</label>
                      <textarea
                        name="about"
                        value={profileData.about || ""}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself"
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Settings;
