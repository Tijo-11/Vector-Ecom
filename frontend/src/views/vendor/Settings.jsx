import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";
import Swal from "sweetalert2";
import { CheckCircle, Store } from "lucide-react";

function Settings() {
  const [profileData, setProfileData] = useState({
    full_name: "",
    mobile: "",
    email: "",
    about: "",
    country: "",
    city: "",
    state: "",
    address: "",
    p_image: "",
  });
  const [vendorData, setVendorData] = useState([]);
  const [vendorImage, setVendorImage] = useState("");
  const [profileImage, setprofileImage] = useState("");

  const axios = apiInstance;
  const userData = UserData();

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const fetchProfileData = async () => {
    try {
      axios.get(`vendor-settings/${userData?.user_id}/`).then((res) => {
        setProfileData({
          full_name: res.data?.full_name,
          email: res.data.user.email,
          phone: res.data.user.phone,
          about: res.data.about,
          country: res.data.country,
          city: res.data.city,
          state: res.data.state,
          address: res.data.address,
          p_image: res.data.image,
        });
        setprofileImage(res.data.image);
      });
    } catch (error) {
      console.error("Error fetching profile data:", error);
    }
  };

  const fetchVendorData = async () => {
    try {
      axios.get(`vendor-shop-settings/${userData?.vendor_id}/`).then((res) => {
        setVendorData(res.data);
        setVendorImage(res.data.image);
      });
    } catch (error) {
      console.error("Error fetching vendor data:", error);
    }
  };

  useEffect(() => {
    fetchProfileData();
    fetchVendorData();
  }, []);

  const handleInputChange = (event) => {
    setProfileData({
      ...profileData,
      [event.target.name]: event.target.value,
    });
  };

  const handleFileChange = (event) => {
    setProfileData({
      ...profileData,
      [event.target.name]: event.target.files[0],
    });
  };

  const handleShopInputChange = (event) => {
    setVendorData({
      ...vendorData,
      [event.target.name]: event.target.value,
    });
  };

  const handleShopFileChange = (event) => {
    setVendorData({
      ...vendorData,
      [event.target.name]: event.target.files[0],
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.get(`user/profile/${userData?.user_id}/`);
    const formData = new FormData();

    if (profileData.p_image && profileData.p_image !== res.data.image) {
      formData.append("image", profileData.p_image);
    }
    formData.append("full_name", profileData.full_name);
    formData.append("about", profileData.about);
    formData.append("country", profileData.country);
    formData.append("city", profileData.city);
    formData.append("state", profileData.state);
    formData.append("address", profileData.address);

    try {
      await apiInstance.patch(
        `vendor-settings/${userData?.user_id}/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      fetchProfileData();
      Swal.fire({ icon: "success", title: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleShopFormSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.get(`vendor-shop-settings/${userData?.vendor_id}/`);
    const formData = new FormData();

    if (vendorData.image && vendorData.image !== res.data.image) {
      formData.append("image", vendorData.image);
    }
    formData.append("name", vendorData.name);
    formData.append("description", vendorData.description);
    formData.append("mobile", vendorData.mobile);

    try {
      await apiInstance.patch(
        `vendor-shop-settings/${userData?.vendor_id}/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      Swal.fire({ icon: "success", title: "Shop updated successfully" });
      await fetchVendorData();
    } catch (error) {
      console.error("Error updating shop:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-6">
        {/* Tabs */}
        <div className="flex space-x-4 border-b mb-6">
          <button className="px-4 py-2 border-b-2 border-blue-600 text-blue-600">
            Shop Settings
          </button>
          {/* <button className="px-4 py-2 text-gray-600 hover:text-blue-600">
            Profile
          </button> */}
        </div>

        {/* Shop Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-2xl p-6 flex flex-col items-center">
            <img
              src={vendorImage}
              alt="Shop Avatar"
              className="w-40 h-40 rounded-full object-cover"
            />
            <h4 className="mt-4 text-lg font-semibold">{vendorData.name}</h4>
            <p className="text-sm text-gray-500">{vendorData.description}</p>
          </div>
          <div className="md:col-span-2 bg-white shadow rounded-2xl p-6">
            <form
              onSubmit={handleShopFormSubmit}
              className="space-y-4"
              encType="multipart/form-data"
            >
              <div>
                <label className="block text-sm font-medium">Shop Avatar</label>
                <input
                  type="file"
                  name="image"
                  onChange={handleShopFileChange}
                  className="mt-1 block w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Shop Name</label>
                <input
                  type="text"
                  name="name"
                  value={vendorData?.name || ""}
                  onChange={handleShopInputChange}
                  className="mt-1 block w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Shop Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={vendorData?.description || ""}
                  onChange={handleShopInputChange}
                  className="mt-1 block w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Mobile</label>
                <input
                  type="text"
                  name="mobile"
                  value={vendorData?.mobile || ""}
                  onChange={handleShopInputChange}
                  className="mt-1 block w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Update Shop <CheckCircle size={18} />
                </button>
                <Link
                  to={`/vendor/${vendorData.slug}/`}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  View Shop <Store size={18} />
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* TODO: Profile section - same conversion with Tailwind */}
      </div>
    </div>
  );
}

export default Settings;
