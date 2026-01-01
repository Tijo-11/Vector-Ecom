import React, { useState, useEffect } from "react";
import { Tag, Trash, Plus, CheckCircle } from "lucide-react";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";

function Offers() {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    discount_percentage: "",
    start_date: "",
    end_date: "",
    product_ids: [],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    try {
      const [offersRes, productsRes] = await Promise.all([
        apiInstance.get(`vendor/offers/${UserData()?.vendor_id}/`),
        apiInstance.get(`vendor/products/${UserData()?.vendor_id}/`),
      ]);
      setOffers(offersRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const payload = {
        discount_percentage: Number(formData.discount_percentage),
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        product_ids: formData.product_ids.map((id) => Number(id)),
      };
      await apiInstance.post(
        `vendor/offers/${UserData()?.vendor_id}/`,
        payload
      );
      setSuccess("Offer created successfully!");
      fetchData();
      setFormData({
        discount_percentage: "",
        start_date: "",
        end_date: "",
        product_ids: [],
      });

      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Create offer error:", err.response?.data || err);
      setError(
        err.response?.data?.detail ||
          JSON.stringify(err.response?.data) ||
          "Failed to create offer"
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiInstance.delete(`vendor/offers/${UserData()?.vendor_id}/${id}/`);
      setSuccess("Offer deleted successfully!");
      fetchData();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete offer");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No end date";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <h4 className="text-2xl font-bold mb-8 flex items-center">
          <Tag className="mr-3" size={28} /> Manage Product Offers
        </h4>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-6 flex items-center">
            <CheckCircle className="mr-3" size={24} />
            <span className="font-medium">{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Create Offer Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-10">
          <h5 className="text-xl font-semibold mb-6">Create New Offer</h5>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Percentage (%){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  step="0.01"
                  value={formData.discount_percentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_percentage: e.target.value,
                    })
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Products <span className="text-red-500">*</span>
              </label>
              <select
                multiple
                size="8"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    product_ids: Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    ),
                  })
                }
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (ID: {p.id})
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-2">
                Hold Ctrl/Cmd to select multiple products
              </p>
            </div>

            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-4 rounded-lg flex items-center transition"
            >
              <Plus className="mr-3" size={20} /> Create Offer
            </button>
          </form>
        </div>

        {/* Existing Offers Table */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h5 className="text-xl font-semibold mb-6">Existing Offers</h5>
          {offers.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              No offers created yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                      Discount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                      Products
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                      Start Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                      End Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {offers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {offer.discount_percentage}%
                      </td>
                      <td className="px-6 py-4">
                        {offer.products?.length || 0} products
                      </td>
                      <td className="px-6 py-4">
                        {formatDate(offer.start_date)}
                      </td>
                      <td className="px-6 py-4">
                        {formatDate(offer.end_date)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            offer.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {offer.is_active ? "Active" : "Expired/Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDelete(offer.id)}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          <Trash size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Offers;
