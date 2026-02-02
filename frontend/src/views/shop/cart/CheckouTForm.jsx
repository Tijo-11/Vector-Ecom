import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import apiInstance from "../../../utils/axios";
import { useAuthStore } from "../../../store/auth";
import cartID from "../ProductDetail/cartId";
import { MapPin, User, Mail, Phone, Locate } from "lucide-react";

// Reusable InputField component (moved outside CheckoutForm to prevent re-creation on every render)
const InputField = ({
  label,
  name,
  type = "text",
  icon: Icon,
  placeholder,
  value,
  onChange,
}) => (
  <div className="relative">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2.5 ${
          Icon ? "pl-10" : "pl-3"
        }`}
        required
      />
    </div>
  </div>
);

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const cart_id = cartID();

  useEffect(() => {
    if (user?.user_id) {
      const fetchAddresses = async () => {
        try {
          const res = await apiInstance.get("user/addresses/");
          setSavedAddresses(res.data);
        } catch (err) {
          console.error("Error fetching addresses:", err);
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
  };

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

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidMobile = (mobile) => /^[0-9]{10}$/.test(mobile);

  const autofillAddress = () => {
    if (!navigator.geolocation) {
      Swal.fire({ icon: "error", title: "Geolocation not supported" });
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
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
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Address Autofilled",
            showConfirmButton: false,
            timer: 1500,
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Location Error",
            text: "Unable to fetch details.",
          });
        } finally {
          setLoadingLocation(false);
        }
      },
      () => {
        Swal.fire({
          icon: "error",
          title: "Access Denied",
          text: "Allow location access",
        });
        setLoadingLocation(false);
      },
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

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
        text: "Please check your email.",
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

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Saved Addresses Section */}
      {user?.user_id && !loadingAddresses && savedAddresses.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
            Saved Addresses
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedAddresses.map((addr) => (
              <div
                key={addr.id}
                onClick={() => selectAddress(addr)}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedAddress === addr.id
                    ? "border-blue-600 bg-white shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-900">
                    {addr.full_name}
                  </span>
                  {addr.status && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                      DEFAULT
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {addr.address}, {addr.town_city}
                </p>
                <p className="text-xs text-gray-500 mt-1">{addr.mobile}</p>

                {selectedAddress === addr.id && (
                  <div className="absolute top-2 right-2 text-blue-600">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
          {selectedAddress && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-blue-600 font-medium hover:underline mt-3"
            >
              Enter a new address instead
            </button>
          )}
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Full Name"
            name="fullName"
            icon={User}
            placeholder="John Doe"
            value={formData.fullName}
            onChange={handleChange}
          />
          <InputField
            label="Email Address"
            name="email"
            type="email"
            icon={Mail}
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Mobile Number"
            name="mobile"
            type="tel"
            icon={Phone}
            placeholder="9876543210"
            value={formData.mobile}
            onChange={handleChange}
          />
          <InputField
            label="Pincode"
            name="pincode"
            type="tel"
            icon={MapPin}
            placeholder="123456"
            value={formData.pincode}
            onChange={handleChange}
          />
        </div>

        <div className="border-t border-gray-100 pt-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Address Details</h3>
            <button
              type="button"
              onClick={autofillAddress}
              disabled={loadingLocation}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              <Locate
                className={`w-4 h-4 ${loadingLocation ? "animate-spin" : ""}`}
              />
              {loadingLocation ? "Locating..." : "Use My Current Location"}
            </button>
          </div>

          <div className="space-y-6">
            <InputField
              label="Flat, House no., Building, Company, Apartment"
              name="address"
              placeholder=""
              value={formData.address}
              onChange={handleChange}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputField
                label="City / Town"
                name="city"
                placeholder=""
                value={formData.city}
                onChange={handleChange}
              />
              <InputField
                label="State"
                name="state"
                placeholder=""
                value={formData.state}
                onChange={handleChange}
              />
              <InputField
                label="Country"
                name="country"
                placeholder=""
                value={formData.country}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-md transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Processing..." : "Proceed to Payment"}
      </button>
    </form>
  );
}

export default CheckoutForm;
