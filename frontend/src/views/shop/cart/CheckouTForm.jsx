// src/components/checkout/CheckoutForm.jsx (or wherever your checkout form is located)
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import apiInstance from "../../../utils/axios";
import { useAuthStore } from "../../../store/auth";
import cartID from "../ProductDetail/cartId";

function CheckoutForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const cart_id = cartID();

  // Fetch saved addresses
  useEffect(() => {
    if (user?.user_id) {
      const fetchAddresses = async () => {
        try {
          const res = await apiInstance.get("user/addresses/");
          setSavedAddresses(res.data);
        } catch (err) {
          console.error("Error fetching addresses:", err);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to load saved addresses.",
          });
        } finally {
          setLoadingAddresses(false);
        }
      };
      fetchAddresses();
    } else {
      setLoadingAddresses(false);
    }
  }, [user?.user_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === "pincode") {
      processedValue = value.replace(/\D/g, "").slice(0, 6);
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  // Select saved address → autofill
  const selectAddress = (addr) => {
    setSelectedAddress(addr.id);
    setFormData({
      fullName: addr.full_name || "",
      email: addr.email || "",
      mobile: addr.mobile || "",
      address: addr.address || "",
      city: addr.town_city || "",
      state: addr.state || "",
      country: addr.country || "",
      pincode: addr.zip || "",
    });
    Swal.fire({
      icon: "success",
      title: "Address Selected",
      text: "Form autofilled with selected address.",
      timer: 1500,
    });
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedAddress(null);
    setFormData({
      fullName: "",
      email: "",
      mobile: "",
      address: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
    });
  };

  // Email & Mobile validation
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidMobile = (mobile) => /^[0-9]{10}$/.test(mobile);

  // Geolocation autofill
  const autofillAddress = () => {
    if (!navigator.geolocation) {
      Swal.fire({
        icon: "error",
        title: "Geolocation not supported",
        text: "Your browser does not support location access.",
      });
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          const address = data.address || {};

          setFormData((prev) => ({
            ...prev,
            city: address.city || address.town || address.village || "",
            state: address.state || "",
            country: address.country || "",
            pincode: address.postcode || "",
          }));

          Swal.fire({
            icon: "success",
            title: "Address Autofilled",
            text: "Location-based details filled.",
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Location Error",
            text: "Unable to fetch address.",
          });
        } finally {
          setLoadingLocation(false);
        }
      },
      () => {
        Swal.fire({
          icon: "error",
          title: "Access Denied",
          text: "Please allow location access.",
        });
        setLoadingLocation(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.values(formData).some((val) => !val.trim())) {
      Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "All fields are required.",
      });
      return;
    }

    if (!isValidEmail(formData.email)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Email",
        text: "Please enter a valid email.",
      });
      return;
    }

    if (!isValidMobile(formData.mobile)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Mobile",
        text: "Mobile must be 10 digits.",
      });
      return;
    }

    const data = new FormData();
    data.append("full_name", formData.fullName);
    data.append("email", formData.email);
    data.append("mobile", formData.mobile);
    data.append("address", formData.address);
    data.append("city", formData.city);
    data.append("state", formData.state);
    data.append("country", formData.country);
    data.append("pincode", formData.pincode);
    data.append("cart_id", cart_id);
    data.append("user_id", user?.user_id || "0");

    try {
      const response = await apiInstance.post("/create-order/", data);
      navigate(`/checkout/${response.data.order_oid}`);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create order.",
      });
      console.error("Order error:", error);
    }
  };

  return (
    <div className="mt-8">
      {/* Saved Addresses (Amazon-style) */}
      {user?.user_id && (
        <div className="mb-8">
          <h2 className="font-semibold text-xl mb-4">Select Saved Address</h2>
          {loadingAddresses ? (
            <p className="text-gray-600">Loading addresses...</p>
          ) : savedAddresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedAddresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => selectAddress(addr)}
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedAddress === addr.id
                      ? "border-blue-600 bg-blue-50 shadow-xl"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {addr.status && (
                    <span className="inline-block mb-3 px-4 py-1 text-sm font-semibold text-white bg-green-600 rounded-full">
                      Default Address
                    </span>
                  )}
                  <p className="font-bold text-lg">{addr.full_name}</p>
                  <p className="mt-2">{addr.address}</p>
                  <p>
                    {addr.town_city}
                    {addr.state ? `, ${addr.state}` : ""} - {addr.zip}
                  </p>
                  <p>{addr.country}</p>
                  <p className="mt-3">
                    <strong>Mobile:</strong> {addr.mobile}
                  </p>
                  <p>
                    <strong>Email:</strong> {addr.email}
                  </p>
                  <p className="mt-4 text-blue-600 font-semibold">
                    Use this address →
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">
              No saved addresses. Please enter details below.
            </p>
          )}

          {selectedAddress && (
            <button
              onClick={clearSelection}
              className="mt-6 text-blue-600 underline hover:no-underline"
            >
              ← Use a different address
            </button>
          )}
        </div>
      )}

      <h1 className="font-semibold text-2xl border-b pb-4">
        Contact Information
      </h1>

      {["fullName", "email", "mobile"].map((field) => (
        <div className="mt-4" key={field}>
          <label className="font-medium block mb-1 text-sm uppercase text-gray-700">
            {field === "fullName"
              ? "Full Name"
              : field.charAt(0).toUpperCase() + field.slice(1)}
          </label>
          <input
            type={
              field === "email" ? "email" : field === "mobile" ? "tel" : "text"
            }
            name={field}
            value={formData[field]}
            onChange={handleChange}
            placeholder={`Enter your ${field}`}
            className="p-2 text-sm w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      ))}

      <h1 className="font-semibold text-2xl border-b pb-4 mt-6">
        Shipping Details
      </h1>

      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={autofillAddress}
          disabled={loadingLocation}
          className="bg-green-500 text-white text-xs px-4 py-2 rounded-md hover:bg-green-600 transition"
        >
          {loadingLocation ? "Fetching..." : "Autofill Address"}
        </button>
      </div>

      {["address", "city", "state", "country", "pincode"].map((field) => (
        <div className="mt-4" key={field}>
          <label className="font-medium block mb-1 text-sm uppercase text-gray-700">
            {field.charAt(0).toUpperCase() + field.slice(1)}
          </label>
          <input
            type="text"
            name={field}
            value={formData[field]}
            onChange={handleChange}
            placeholder={`Enter your ${field}`}
            className="p-2 text-sm w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="w-full mt-8 bg-blue-600 text-white py-3 rounded-md text-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
        disabled={Object.values(formData).some((val) => !val.trim())}
      >
        Proceed to Payment
      </button>
    </div>
  );
}

export default CheckoutForm;
