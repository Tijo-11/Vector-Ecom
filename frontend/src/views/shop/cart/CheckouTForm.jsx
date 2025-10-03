import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import apiInstance from "../../../utils/axios";
import { useAuthStore } from "../../../store/auth";
import cartID from "../ProductDetail/cartId";

function CheckoutForm({ onSubmit }) {
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
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const cart_id = cartID();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.mobile ||
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.country ||
      !formData.pincode
    ) {
      Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "All fields are required before checkout.",
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
      // Swal.fire({
      //   icon: "success",
      //   title: "Order Created",
      //   text: `Order ID: ${response.data.order_id}. ${response.data.message}`,
      // });
      onSubmit(formData);
      navigate(`/checkout/${response.data.order_oid}`); // Placeholder route for checkout page
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
                // Allow only digits and max 6 characters
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
