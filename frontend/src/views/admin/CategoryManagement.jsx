import React, { useState, useEffect } from "react";
import AdminSidebar from "./Sidebar";
import {
  Trash,
  Plus,
  Loader2,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
} from "lucide-react";
import apiInstance from "../../utils/axios";
import Toast from "../../plugin/Toast";
import Swal from "sweetalert2";

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ title: "", image: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await apiInstance.get("/admin/categories/");
      setCategories(res.data.results || res.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ title: "", image: null });
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({ title: category.title, image: null });
    setImagePreview(category.image || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ title: "", image: null });
    setImagePreview(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      Toast().fire({ icon: "error", title: "Category title is required" });
      return;
    }

    setSubmitting(true);
    const data = new FormData();
    data.append("title", formData.title.trim());
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      if (editingCategory) {
        await apiInstance.patch(`/admin/categories/${editingCategory.id}/`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        Toast().fire({ icon: "success", title: "Category updated successfully" });
      } else {
        await apiInstance.post("/admin/categories/", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        Toast().fire({ icon: "success", title: "Category created successfully" });
      }
      closeModal();
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      Toast().fire({
        icon: "error",
        title: error.response?.data?.error || "Failed to save category",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await apiInstance.patch(`/admin/categories/${id}/toggle/`);
      setCategories(
        categories.map((cat) => (cat.id === id ? res.data : cat))
      );
      Toast().fire({
        icon: "success",
        title: `Category ${res.data.active ? "activated" : "deactivated"}`,
      });
    } catch (error) {
      console.error("Error toggling category:", error);
      Toast().fire({ icon: "error", title: "Failed to toggle category status" });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete this category!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await apiInstance.delete(`/admin/categories/${id}/`);
        setCategories(categories.filter((cat) => cat.id !== id));
        Swal.fire("Deleted!", "Category has been deleted.", "success");
      } catch (error) {
        console.error("Error deleting category:", error);
        const msg =
          error.response?.status === 500
            ? "Cannot delete — products are linked to this category"
            : "Failed to delete category";
        Toast().fire({ icon: "error", title: msg });
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Category Management</h1>
            <button
              id="add-category-btn"
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus size={18} /> Add Category
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
                    <th className="pb-2">Image</th>
                    <th className="pb-2">Title</th>
                    <th className="pb-2">Products</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td className="py-2">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.title}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <ImageIcon size={18} className="text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-2 font-medium">{cat.title}</td>
                      <td className="py-2">{cat.product_count}</td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            cat.active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {cat.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggle(cat.id)}
                            className="text-gray-500 hover:text-indigo-600"
                            title={cat.active ? "Deactivate" : "Activate"}
                          >
                            {cat.active ? (
                              <ToggleRight size={20} className="text-green-600" />
                            ) : (
                              <ToggleLeft size={20} className="text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(cat)}
                            className="text-gray-500 hover:text-blue-600"
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-gray-400">
                        No categories found
                      </td>
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
              <h2 className="text-xl font-bold mb-4">
                {editingCategory ? "Edit Category" : "Create Category"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    placeholder="e.g. Electronics"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full border rounded p-2 text-sm"
                  />
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mt-2 w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    {editingCategory ? "Update" : "Save"}
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
