// src/components/customer/Settings.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Swal from "sweetalert2";
import log from "loglevel";

function Settings() {
  const [profileData, setProfileData] = useState({
    full_name: "",
    about: "",
    country: "",
    city: "",
    state: "",
    postal_code: "",
    address: "",
    p_image: null,
  });
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    new_password2: "",
  });

  // Email change state
  const [emailData, setEmailData] = useState({
    new_email: "",
    otp: "",
  });
  const [otpSent, setOtpSent] = useState(false);

  const axios = apiInstance;
  const userData = UserData();

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userData?.user_id) return;
      try {
        const res = await axios.get(`user/profile/${userData.user_id}/`);
        setProfileData({
          full_name: res.data?.full_name || "",
          about: res.data?.about || "",
          country: res.data?.country || "",
          city: res.data?.city || "",
          state: res.data?.state || "",
          postal_code: res.data?.postal_code || "",
          address: res.data?.address || "",
          p_image: null,
        });
        setImagePreview(res.data?.image || "");
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
    const file = e.target.files[0];
    setProfileData({ ...profileData, p_image: file });
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      if (profileData.p_image) {
        formData.append("image", profileData.p_image);
      }
      Object.entries(profileData).forEach(([key, value]) => {
        if (
          key !== "p_image" &&
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          formData.append(key, value);
        }
      });

      await apiInstance.patch(
        `customer/setting/${userData?.user_id}/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Profile updated successfully",
      });
    } catch (error) {
      log.error("Error updating profile:", error);
      let errorMessage = "Something went wrong!";
      if (error.response?.data) {
        errorMessage = Object.values(error.response.data).flat().join("\n");
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`user/change-password/`, passwordData);
      Swal.fire("Success", "Password changed successfully", "success");
      setPasswordData({
        old_password: "",
        new_password: "",
        new_password2: "",
      });
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.error || "Failed to change password",
        "error"
      );
    }
  };

  const handleEmailRequest = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`user/change-email/request/`, {
        new_email: emailData.new_email,
      });
      setOtpSent(true);
      Swal.fire("Success", "OTP sent to your new email", "success");
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.error || "Failed to send OTP",
        "error"
      );
    }
  };

  const handleEmailVerify = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`user/change-email/verify/`, { otp: emailData.otp });
      Swal.fire("Success", "Email changed successfully", "success");
      setEmailData({ new_email: "", otp: "" });
      setOtpSent(false);
      // Optionally refresh profile data
      window.location.reload();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.error || "Invalid OTP", "error");
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
                    <i className="fas fa-cog fa-spin mr-2" /> Settings
                  </h3>

                  {/* Profile Image Preview */}
                  {imagePreview && (
                    <div className="mb-6 text-center">
                      <img
                        src={imagePreview}
                        alt="Profile Preview"
                        className="w-32 h-32 rounded-full object-cover mx-auto"
                      />
                    </div>
                  )}

                  {/* Profile Update Form */}
                  <form
                    onSubmit={handleProfileSubmit}
                    encType="multipart/form-data"
                    className="space-y-6"
                  >
                    <div>
                      <label className="block mb-2 font-medium">
                        Profile Image
                      </label>
                      <input
                        type="file"
                        name="p_image"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 font-medium">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={profileData.full_name}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring focus:ring-blue-300"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 font-medium">About</label>
                      <textarea
                        name="about"
                        value={profileData.about}
                        onChange={handleInputChange}
                        rows="4"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring focus:ring-blue-300"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block mb-2 font-medium">
                          Address
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={profileData.address}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium">City</label>
                        <input
                          type="text"
                          name="city"
                          value={profileData.city}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium">State</label>
                        <input
                          type="text"
                          name="state"
                          value={profileData.state}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium">
                          Pincode
                        </label>
                        <input
                          type="text"
                          name="postal_code"
                          value={profileData.postal_code}
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6);
                            setProfileData({
                              ...profileData,
                              postal_code: value,
                            });
                          }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-medium">
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={profileData.country}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                      </div>
                    </div>

                    <div>
                      {!loading ? (
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                        >
                          Save Profile Changes
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

                  {/* Change Password Section */}
                  <div className="mt-12 border-t pt-8">
                    <h3 className="text-xl font-semibold mb-6">
                      Change Password
                    </h3>
                    <form
                      onSubmit={handlePasswordChange}
                      className="max-w-lg space-y-4"
                    >
                      <input
                        type="password"
                        placeholder="Current Password"
                        value={passwordData.old_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            old_password: e.target.value,
                          })
                        }
                        required
                        className="w-full border rounded px-3 py-2"
                      />
                      <input
                        type="password"
                        placeholder="New Password"
                        value={passwordData.new_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            new_password: e.target.value,
                          })
                        }
                        required
                        className="w-full border rounded px-3 py-2"
                      />
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={passwordData.new_password2}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            new_password2: e.target.value,
                          })
                        }
                        required
                        className="w-full border rounded px-3 py-2"
                      />
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
                      >
                        Change Password
                      </button>
                    </form>
                  </div>

                  {/* Change Email Section */}
                  <div className="mt-12 border-t pt-8">
                    <h3 className="text-xl font-semibold mb-6">
                      Change Email Address
                    </h3>
                    {!otpSent ? (
                      <form
                        onSubmit={handleEmailRequest}
                        className="max-w-lg space-y-4"
                      >
                        <input
                          type="email"
                          placeholder="New Email Address"
                          value={emailData.new_email}
                          onChange={(e) =>
                            setEmailData({
                              ...emailData,
                              new_email: e.target.value,
                            })
                          }
                          required
                          className="w-full border rounded px-3 py-2"
                        />
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700"
                        >
                          Send OTP
                        </button>
                      </form>
                    ) : (
                      <form
                        onSubmit={handleEmailVerify}
                        className="max-w-lg space-y-4"
                      >
                        <p className="text-green-600 mb-4">
                          OTP has been sent to {emailData.new_email}
                        </p>
                        <input
                          type="text"
                          placeholder="Enter OTP"
                          value={emailData.otp}
                          onChange={(e) =>
                            setEmailData({ ...emailData, otp: e.target.value })
                          }
                          required
                          className="w-full border rounded px-3 py-2"
                        />
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
                        >
                          Verify & Change Email
                        </button>
                      </form>
                    )}
                  </div>
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
