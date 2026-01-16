// src/components/customer/Addresses.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import Swal from "sweetalert2";

function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [formData, setFormData] = useState({
    full_name: "",
    mobile: "",
    email: "",
    address: "",
    town_city: "",
    state: "",
    zip: "",
    country: "",
    status: false,
  });
  const [editingId, setEditingId] = useState(null);

  const fetchAddresses = async () => {
    try {
      const res = await apiInstance.get("user/addresses/");
      setAddresses(res.data);
    } catch (err) {
      console.error("Error fetching addresses:", err);
      Swal.fire("Error", "Failed to load addresses", "error");
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiInstance.patch(`user/addresses/${editingId}/`, formData);
        Swal.fire("Success", "Address updated successfully", "success");
      } else {
        await apiInstance.post("user/addresses/", formData);
        Swal.fire("Success", "Address added successfully", "success");
      }
      setFormData({
        full_name: "",
        mobile: "",
        email: "",
        address: "",
        town_city: "",
        state: "",
        zip: "",
        country: "",
        status: false,
      });
      setEditingId(null);
      fetchAddresses();
    } catch (err) {
      console.error("Error saving address:", err);
      Swal.fire("Error", "Failed to save address", "error");
    }
  };

  const handleEdit = (addr) => {
    setFormData({
      full_name: addr.full_name || "",
      mobile: addr.mobile || "",
      email: addr.email || "",
      address: addr.address || "",
      town_city: addr.town_city || "",
      state: addr.state || "",
      zip: addr.zip || "",
      country: addr.country || "",
      status: addr.status || false,
    });
    setEditingId(addr.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This address will be deleted permanently",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });
    if (result.isConfirmed) {
      try {
        await apiInstance.delete(`user/addresses/${id}/`);
        Swal.fire("Deleted", "Address deleted", "success");
        fetchAddresses();
      } catch (err) {
        Swal.fire("Error", "Failed to delete address", "error");
      }
    }
  };

  return (
    <main className="mt-5 mb-10">
      <div className="container mx-auto px-4">
        <section className="flex flex-col lg:flex-row gap-6">
          <Sidebar />
          <div className="flex-1">
            <h3 className="text-2xl font-semibold mb-6">Manage Addresses</h3>

            {/* Add/Edit Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h4 className="text-xl mb-4">
                {editingId ? "Edit Address" : "Add New Address"}
              </h4>
              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  required
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Mobile"
                  required
                  className="border rounded px-3 py-2"
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Address Line"
                  required
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  name="town_city"
                  value={formData.town_city}
                  onChange={handleChange}
                  placeholder="Town/City"
                  required
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  required
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  placeholder="ZIP Code"
                  required
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Country"
                  required
                  className="border rounded px-3 py-2"
                />
                <div className="flex items-center col-span-1 md:col-span-2">
                  <input
                    type="checkbox"
                    name="status"
                    checked={formData.status}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label>Set as default address</label>
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                  >
                    {editingId ? "Update Address" : "Add Address"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setFormData({
                          full_name: "",
                          mobile: "",
                          email: "",
                          address: "",
                          town_city: "",
                          state: "",
                          zip: "",
                          country: "",
                          status: false,
                        });
                      }}
                      className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Saved Addresses List */}
            <h4 className="text-xl mb-4">Saved Addresses</h4>
            {addresses.length === 0 ? (
              <p className="text-gray-600">No saved addresses yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-5 border rounded-lg ${
                      addr.status
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300"
                    }`}
                  >
                    {addr.status && (
                      <span className="inline-block mb-2 px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-full">
                        Default Address
                      </span>
                    )}
                    <p className="font-semibold">{addr.full_name}</p>
                    <p>{addr.address}</p>
                    <p>
                      {addr.town_city}
                      {addr.state ? `, ${addr.state}` : ""} - {addr.zip}
                    </p>
                    <p>{addr.country}</p>
                    <p className="mt-2">
                      <strong>Mobile:</strong> {addr.mobile}
                    </p>
                    <p>
                      <strong>Email:</strong> {addr.email}
                    </p>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleEdit(addr)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(addr.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default Addresses;
