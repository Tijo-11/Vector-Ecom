import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, Pencil, Trash2, Package, Plus, Filter, ChevronLeft, ChevronRight, Box } from "lucide-react";

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";
import { deleteProduct } from "../../plugin/DeleteProduct";
import log from "loglevel";

function ProductsVendor() {
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchUrl, setFetchUrl] = useState("");
  const [activeFilter, setActiveFilter] = useState("no-filter");

  const axios = apiInstance;
  const userData = UserData();

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const vendorId = userData?.vendor_id;

  const getFullUrl = (baseUrl, page) => {
    if (page <= 1) return baseUrl;
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}page=${page}`;
  };

  const loadProducts = async (baseUrl, page = currentPage) => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const fullUrl = getFullUrl(baseUrl, page);
      const response = await axios.get(fullUrl);
      const data = response.data;
      const productList = Array.isArray(data) ? data : data.results || [];
      const count = data.count ?? productList.length;
      const next = data.next ?? null;
      const prev = data.previous ?? null;

      setProducts(productList);
      setTotalCount(count);
      setHasNext(!!next);
      setHasPrev(!!prev);
      setCurrentPage(page);
    } catch (error) {
      log.error("Error fetching products:", error);
      setProducts([]);
      setTotalCount(0);
      setHasNext(false);
      setHasPrev(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorId) {
      const mainUrl = `vendor/products/${vendorId}/`;
      setFetchUrl(mainUrl);
      loadProducts(mainUrl, 1);
    }
  }, [vendorId]);

  useEffect(() => {
    if (fetchUrl) {
      loadProducts(fetchUrl, currentPage);
    }
  }, [currentPage, fetchUrl]);

  const handleDeleteProduct = async (productPid) => {
    try {
      await deleteProduct(vendorId, productPid);
      loadProducts(fetchUrl, currentPage);
    } catch (error) {
      log.error("Error deleting product:", error);
    }
  };

  const handleFilterProduct = async (param) => {
    setActiveFilter(param);
    const filterUrl =
      param === "no-filter"
        ? `vendor/products/${vendorId}/`
        : `vendor-product-filter/${vendorId}?filter=${param}`;
    setFetchUrl(filterUrl);
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'published') return 'bg-green-100 text-green-800';
    if (statusLower === 'draft') return 'bg-gray-100 text-gray-800';
    if (statusLower === 'in-review') return 'bg-yellow-100 text-yellow-800';
    if (statusLower === 'disabled') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const filterOptions = [
    { value: "no-filter", label: "All Products" },
    { value: "published", label: "Status: Published" },
    { value: "draft", label: "Status: Draft" },
    { value: "in-review", label: "Status: In-review" },
    { value: "disabled", label: "Status: Disabled" },
    { value: "latest", label: "Date: Latest" },
    { value: "oldest", label: "Date: Oldest" },
  ];

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8 lg:p-12 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-7 h-7 text-emerald-600" />
              Products
            </h1>
            <p className="text-gray-500 mt-1">Manage your product inventory.</p>
          </div>
          <Link
            to="/vendor/product/new/"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition shadow-sm"
          >
            <Plus size={18} />
            Add Product
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Filter size={18} />
              <span className="font-medium">Filter:</span>
            </div>
            <select
              value={activeFilter}
              onChange={(e) => handleFilterProduct(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="ml-auto text-sm text-gray-500">
              {totalCount} product{totalCount !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-600 mb-4"></div>
              <p className="text-gray-500">Loading products...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((p) => (
                      <tr key={p.pid} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={p.image} 
                              alt={p.title}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-100"
                            />
                            <div>
                              <p className="font-medium text-gray-900 line-clamp-1">{p.title}</p>
                              <p className="text-xs text-gray-500">SKU: {p.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">₹{p.price}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-medium ${p.stock_qty > 10 ? 'text-green-600' : p.stock_qty > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {p.stock_qty}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {p.order_count}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(p.status)}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              to={`/detail/${p.slug}`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="View"
                            >
                              <Eye size={18} />
                            </Link>
                            <Link
                              to={`/vendor/product/update/${p.pid}/`}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Pencil size={18} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.pid)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center">
                            <Box size={48} className="text-gray-200 mb-3" />
                            <p className="text-gray-500 font-medium">No products found</p>
                            <p className="text-gray-400 text-sm mt-1">Start by adding your first product.</p>
                            <Link
                              to="/vendor/product/new/"
                              className="mt-4 inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              <Plus size={16} />
                              Add Product
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalCount > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center py-4 px-6 border-t border-gray-100 bg-gray-50">
                  <p className="text-sm text-gray-600 mb-3 sm:mb-0">
                    Page {currentPage} of {Math.ceil(totalCount / 10) || 1}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={!hasPrev || loading}
                      className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      disabled={!hasNext || loading}
                      className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductsVendor;

