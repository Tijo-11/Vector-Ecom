import React, { useState, useEffect } from "react";
import AdminSidebar from "./Sidebar";
import { Loader2, XCircle, CheckCircle } from "lucide-react";
import apiInstance from "../../utils/axios";
import Toast from "../../plugin/Toast";

// Placeholder for products with no image
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/80?text=No+Image";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const response = await apiInstance.get("/admin/products/");
      const data = response.data.results || response.data || [];
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to fetch products",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleStatus = async (id) => {
    try {
      await apiInstance.patch(`/admin/products/${id}/toggle/`);
      fetchProducts();
      Toast().fire({
        icon: "success",
        title: "Product status updated",
      });
    } catch (error) {
      console.error("Error toggling product status:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to update status",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-2xl font-semibold mb-4">Product Management</h2>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-gray-500 h-8 w-8" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No products found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-3">Image</th>
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Vendor</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b last:border-none hover:bg-gray-50"
                    >
                      <td className="py-4">
                        <img
                          src={p.image || PLACEHOLDER_IMAGE}
                          alt={p.title}
                          className="w-12 h-12 object-cover rounded-lg border"
                          onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
                        />
                      </td>
                      <td className="py-4 font-medium">
                        {p.title || "Untitled"}
                      </td>
                      <td className="py-4">₹{p.price || 0}</td>
                      <td className="py-4">{p.category_title || "N/A"}</td>
                      <td className="py-4">{p.vendor_name || "N/A"}</td>
                      <td className="py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            p.status === "published"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {p.status_display || p.status || "draft"}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {p.status === "published" ? (
                          <button
                            onClick={() => handleToggleStatus(p.id)}
                            className="inline-flex items-center text-red-600 hover:text-red-800"
                          >
                            <XCircle size={18} className="mr-1" />
                            Disable
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(p.id)}
                            className="inline-flex items-center text-green-600 hover:text-green-800"
                          >
                            <CheckCircle size={18} className="mr-1" />
                            Publish
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProductManagement;
