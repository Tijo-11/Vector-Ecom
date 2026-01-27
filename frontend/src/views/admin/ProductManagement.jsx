import React, { useState, useEffect } from "react";
import AdminSidebar from "./Sidebar";
import { Trash, Edit, Loader2, CheckCircle, XCircle } from "lucide-react";
import apiInstance from "../../utils/axios";
import Toast from "../../plugin/Toast";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const response = await apiInstance.get("/admin/products/");
      setProducts(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
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
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">Image</th>
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Vendor</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b last:border-none">
                      <td className="py-2">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-10 h-10 object-cover rounded"
                        />
                      </td>
                      <td className="py-2 font-medium">{p.title}</td>
                      <td className="py-2">₹{p.price}</td>
                      <td className="py-2">{p.category?.title}</td>
                      <td className="py-2">{p.vendor?.name}</td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            p.status === "published"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="text-right space-x-2">
                        {p.status === "published" ? (
                          <button
                            onClick={() => handleToggleStatus(p.id)}
                            className="flex items-center ml-auto text-red-600 hover:underline"
                          >
                            <XCircle size={16} className="mr-1" /> Disable
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(p.id)}
                            className="flex items-center ml-auto text-green-600 hover:underline"
                          >
                            <CheckCircle size={16} className="mr-1" /> Publish
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
