import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import Swal from "sweetalert2";

function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // Construct URL with page param
  const getAddressesUrl = (page) => {
    const base = "user/addresses/";
    return page <= 1 ? base : `${base}?page=${page}`;
  };

  const fetchAddresses = async (page = currentPage) => {
    setLoading(true);
    try {
      const fullUrl = getAddressesUrl(page);
      const res = await apiInstance.get(fullUrl);

      // Handle paginated response safely
      const data = res.data;
      const addressList = Array.isArray(data) ? data : data.results || [];
      const count = data.count ?? addressList.length;
      const next = data.next ?? null;
      const prev = data.previous ?? null;

      setAddresses(addressList);
      setTotalCount(count);
      setHasNext(!!next);
      setHasPrev(!!prev);
      setCurrentPage(page);
    } catch (err) {
      console.error("Error fetching addresses:", err);
      Swal.fire("Error", "Failed to load addresses", "error");
      setAddresses([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses(1);
  }, []);

  useEffect(() => {
    fetchAddresses(currentPage);
  }, [currentPage]);

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
      // Reset form
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
      // Refetch current page (or page 1 after add)
      fetchAddresses(editingId ? currentPage : 1);
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
        fetchAddresses(currentPage);
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

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                <p className="text-lg text-gray-600">Loading addresses...</p>
              </div>
            ) : (
              <>
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
                <h4 className="text-xl mb-4">Saved Addresses ({totalCount})</h4>
                {addresses.length === 0 ? (
                  <p className="text-gray-600 text-center py-10">
                    No saved addresses yet.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`p-5 border-2 rounded-lg transition-all ${
                            addr.status
                              ? "border-green-500 bg-green-50"
                              : "border-gray-300"
                          }`}
                        >
                          {addr.status && (
                            <span className="inline-block mb-3 px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-full">
                              Default Address
                            </span>
                          )}
                          <p className="font-semibold text-lg">
                            {addr.full_name}
                          </p>
                          <p className="mt-1">{addr.address}</p>
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
                          <div className="mt-4 flex gap-4">
                            <button
                              onClick={() => handleEdit(addr)}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(addr.id)}
                              className="text-red-600 hover:underline font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalCount > addresses.length && (
                      <div className="flex justify-center items-center mt-12 gap-8">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={!hasPrev || loading}
                          className="px-6 py-3 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                        >
                          Previous
                        </button>

                        <span className="text-lg font-medium">
                          Page {currentPage} ({totalCount} total addresses)
                        </span>

                        <button
                          onClick={() => setCurrentPage((prev) => prev + 1)}
                          disabled={!hasNext || loading}
                          className="px-6 py-3 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default Addresses;
