import React, { useState, useEffect } from "react";
import AdminSidebar from "./Sidebar";
import { Trash, Plus, Loader2 } from "lucide-react";
import apiInstance from "../../utils/axios";
import Toast from "../../plugin/Toast";
import Swal from "sweetalert2";

export default function CategoryOffer() {
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    discount_percentage: "",
    start_date: "",
    end_date: "",
  });

  const fetchData = async () => {
    try {
      const [offersRes, categoriesRes] = await Promise.all([
        apiInstance.get("/admin/category-offers/"),
        apiInstance.get("/category/"), // Use public category list or admin specific if available
      ]);
      setOffers(offersRes.data.results || offersRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await apiInstance.delete(`/admin/category-offers/${id}/`);
        setOffers(offers.filter((offer) => offer.id !== id));
        Swal.fire("Deleted!", "Offer has been deleted.", "success");
      } catch (error) {
        console.error("Error deleting offer:", error);
        Toast().fire({
          icon: "error",
          title: "Failed to delete offer",
        });
      }
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.discount_percentage) {
        Toast().fire({ icon: "error", title: "Please fill required fields" });
        return;
    }
    
    try {
      await apiInstance.post("/admin/category-offers/", formData);
      setShowModal(false);
      setFormData({
        category: "",
        discount_percentage: "",
        start_date: "",
        end_date: "",
      });
      fetchData();
      Toast().fire({
        icon: "success",
        title: "Category offer created successfully",
      });
    } catch (error) {
       console.error("Error creating offer:", error);
       Toast().fire({
        icon: "error",
        title: error.response?.data?.error || "Failed to create offer",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Category Offers</h1>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus size={18} /> Add Offer
            </button>
          </div>

          {loading ? (
             <div className="flex justify-center p-8">
               <Loader2 className="animate-spin text-gray-500" />
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="text-gray-500 border-b">
                  <tr>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Discount</th>
                    <th className="pb-2">Start Date</th>
                    <th className="pb-2">End Date</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {offers.map((offer) => (
                    <tr key={offer.id}>
                      <td className="py-2 font-medium">
                        {offer.category?.title || offer.category_name || "Unknown"}
                      </td>
                      <td className="py-2">{offer.discount_percentage}%</td>
                      <td className="py-2">
                        {new Date(offer.start_date).toLocaleDateString()}
                      </td>
                      <td className="py-2">
                        {new Date(offer.end_date).toLocaleDateString()}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDelete(offer.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {offers.length === 0 && (
                    <tr>
                        <td colSpan="5" className="text-center py-4 text-gray-400">No offers found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
              <h2 className="text-xl font-bold mb-4">Create Offer</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Discount (%)</label>
                  <input
                    type="number"
                    name="discount_percentage"
                    value={formData.discount_percentage}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    min="1"
                    max="99"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
