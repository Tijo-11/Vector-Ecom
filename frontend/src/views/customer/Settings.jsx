import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Swal from "sweetalert2";
import log from "loglevel";

function Settings() {
  const [profileData, setProfileData] = useState({
    full_name: "",
    mobile: "",
    email: "",
    about: "",
    country: "",
    city: "",
    state: "",
    postal_code: "",
    address: "",
    p_image: "",
  });
  const [loading, setLoading] = useState(false);

  const axios = apiInstance;
  const userData = UserData();

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userData?.user_id) return;

      try {
        const res = await axios.get(`user/profile/${userData.user_id}/`);
        setProfileData({
          full_name: res.data?.full_name || "",
          email: res.data.user?.email || "",
          phone: res.data.user?.phone || "",
          about: res.data?.about || "",
          country: res.data?.country || "",
          city: res.data?.city || "",
          state: res.data?.state || "",
          postal_code: res.data?.postal_code || "",
          address: res.data?.address || "",
          p_image: res.data?.image || "",
        });
      } catch (error) {
        log.error("Error fetching profile data:", error);
      }
    };

    fetchProfileData();
  }, [userData?.user_id]);

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.files[0],
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.get(`user/profile/${userData?.user_id}/`);
      const formData = new FormData();

      if (profileData.p_image && profileData.p_image !== res.data.image) {
        formData.append("image", profileData.p_image);
      }

      Object.entries({
        full_name: profileData.full_name,
        about: profileData.about,
        country: profileData.country,
        city: profileData.city,
        state: profileData.state,
        postal_code: profileData.postal_code,
        address: profileData.address,
      }).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      await apiInstance.patch(
        `customer/setting/${userData?.user_id}/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Profile updated successfully",
      });
    } catch (error) {
      log.error("Error updating profile:", error);

      // ✅ Show error notification
      let errorMessage = "Something went wrong!";
      if (error.response?.data) {
        // Show first validation error from backend if exists
        const errors = error.response.data;
        errorMessage = Object.values(errors).flat().join("\n");
      }

      Swal.fire({
        icon: "error",
        title: "Profile update failed",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <main className="mt-5 mb-10">
        <div className="container mx-auto px-4">
          <section className="flex flex-col lg:flex-row gap-6">
            <Sidebar />
            <div className="flex-1 mt-2">
              <main className="mb-5">
                <div className="px-4">
                  <h3 className="mb-6 flex items-center text-xl font-semibold">
                    <i className="fas fa-gear fa-spin mr-2" /> Settings
                  </h3>

                  <form
                    onSubmit={handleFormSubmit}
                    method="POST"
                    encType="multipart/form-data"
                    className="space-y-6"
                  >
                    {/* Profile Image */}
                    <div>
                      <label className="block mb-2 font-medium">
                        Profile Image
                      </label>
                      <input
                        type="file"
                        className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer focus:outline-none"
                        onChange={handleFileChange}
                        name="p_image"
                      />
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block mb-2 font-medium">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={profileData?.full_name}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring focus:ring-blue-300 focus:outline-none"
                      />
                    </div>

                    {/* Email + Mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block mb-2 font-medium">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={profileData?.email}
                          readOnly
                          className="w-full bg-gray-100 rounded-lg border border-gray-300 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium">Mobile</label>
                        <input
                          type="text"
                          name="phone"
                          value={profileData?.phone}
                          readOnly
                          className="w-full bg-gray-100 rounded-lg border border-gray-300 px-3 py-2"
                        />
                      </div>
                    </div>

                    {/* Address / City / State / Country */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block mb-2 font-medium">
                          Address
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={profileData?.address}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring focus:ring-blue-300 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium">City</label>
                        <input
                          type="text"
                          name="city"
                          value={profileData?.city}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring focus:ring-blue-300 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium">
                          Pincode
                        </label>
                        <input
                          type="text"
                          name="postal_code"
                          value={profileData?.postal_code}
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6);
                            setProfileData({
                              ...profileData,
                              postal_code: value,
                            });
                          }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring focus:ring-blue-300 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium">State</label>
                        <input
                          type="text"
                          name="state"
                          value={profileData?.state}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring focus:ring-blue-300 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium">
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={profileData?.country}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring focus:ring-blue-300 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Save button */}
                    <div>
                      {!loading ? (
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-6 py-2 rounded-lg bg-blue-400 text-white font-medium flex items-center gap-2"
                        >
                          Saving... <i className="fas fa-spinner fa-spin"></i>
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </main>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Settings;
