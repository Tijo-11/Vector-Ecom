import React, { useState } from "react";

function CheckoutForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    country: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid = Object.values(formData).every((val) => val.trim() !== "");

  const handleSubmit = () => {
    if (isFormValid) {
      onSubmit(formData); // Pass data back to parent
    }
  };

  return (
    <div>
      <h1 className="font-semibold text-2xl border-b pb-8 mt-10">
        Contact Information
      </h1>

      {["fullName", "email", "mobile"].map((field) => (
        <div className="mt-5" key={field}>
          <label className="font-medium inline-block mb-2 text-sm uppercase">
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
            className="p-2 text-sm w-full border border-gray-200 focus:outline-none"
          />
        </div>
      ))}

      <h1 className="font-semibold text-2xl border-b pb-8 mt-10">
        Shipping Details
      </h1>

      {["address", "city", "state", "country"].map((field) => (
        <div className="mt-5" key={field}>
          <label className="font-medium inline-block mb-2 text-sm uppercase">
            {field.charAt(0).toUpperCase() + field.slice(1)}
          </label>
          <input
            type="text"
            name={field}
            value={formData[field]}
            onChange={handleChange}
            placeholder={`Enter your ${field}`}
            className="p-2 text-sm w-full border border-gray-200 focus:outline-none"
          />
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={!isFormValid}
        className={`py-3 text-sm text-white uppercase w-full mt-8 font-semibold ${
          isFormValid
            ? "bg-indigo-500 hover:bg-indigo-600"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        Proceed to Checkout
      </button>
    </div>
  );
}

export default CheckoutForm;
