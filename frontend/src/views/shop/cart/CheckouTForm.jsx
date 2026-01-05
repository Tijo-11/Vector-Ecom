import React, { useState } from "react";
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

  const [loadingLocation, setLoadingLocation] = useState(false);

  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const cart_id = cartID();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Email validation
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ✅ Mobile validation (10 digits)
  const isValidMobile = (mobile) => /^[0-9]{10}$/.test(mobile);

  // 📍 Autofill address using browser location + OpenStreetMap
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
            text: "City, state, country, and pincode have been filled automatically.",
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Location Error",
            text: "Unable to fetch address details.",
          });
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        Swal.fire({
          icon: "error",
          title: "Location Access Denied",
          text: "Please allow location access to autofill address.",
        });
        setLoadingLocation(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation for all fields
    if (Object.values(formData).some((val) => !val.trim())) {
      Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "All fields are required before checkout.",
      });
      return;
    }

    if (!isValidEmail(formData.email)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Email",
        text: "Please enter a valid email address.",
      });
      return;
    }

    if (!isValidMobile(formData.mobile)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Mobile Number",
        text: "Mobile number must be 10 digits.",
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
        text: "Failed to create order. Please try again.",
      });
      console.error("Error creating order:", error);
    }
  };

  return (
    <div className="mt-8">
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
          />
        </div>
      ))}

      <h1 className="font-semibold text-2xl border-b pb-4 mt-6">
        Shipping Details
      </h1>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={autofillAddress}
          disabled={loadingLocation}
          className="bg-green-500 text-white text-xs px-3 py-2 rounded-md hover:bg-green-600 transition mt-2"
        >
          {loadingLocation ? "Fetching location..." : "Autofill Address"}
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
            onChange={(e) => {
              let value = e.target.value;
              if (field === "pincode") {
                value = value.replace(/\D/g, "").slice(0, 6);
              }
              handleChange({ target: { name: field, value } });
            }}
            placeholder={`Enter your ${field}`}
            className="p-2 text-sm w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="w-full mt-6 bg-blue-500 text-white py-3 rounded-md text-sm uppercase font-semibold hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        disabled={Object.values(formData).some((val) => !val.trim())}
      >
        Proceed to Checkout
      </button>
    </div>
  );
}

export default CheckoutForm;
