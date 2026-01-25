import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, Pencil, Trash2 } from "lucide-react";

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
  const [fetchUrl, setFetchUrl] = useState(""); // Base URL (main or filtered)

  const axios = apiInstance;
  const userData = UserData();

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const vendorId = userData?.vendor_id;

  // Construct full URL with optional page param
  const getFullUrl = (baseUrl, page) => {
    if (page <= 1) return baseUrl;
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}page=${page}`;
  };

  // Shared function to load products
  const loadProducts = async (baseUrl, page = currentPage) => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const fullUrl = getFullUrl(baseUrl, page);
      const response = await axios.get(fullUrl);

      // Handle both paginated object and direct array (fallback)
      const data = response.data;
      const productList = Array.isArray(data) ? data : data.results || [];
      const count = data.count ?? productList.length;
      const next = data.next ?? null;
      const prev = data.previous ?? null;

      setProducts(productList);
      setTotalCount(count);
      setHasNext(!!next);
      setHasPrev(!!prev);
      // Update current page to match what was actually fetched
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

  // Initial load (main list)
  useEffect(() => {
    if (vendorId) {
      const mainUrl = `vendor/products/${vendorId}/`;
      setFetchUrl(mainUrl);
      loadProducts(mainUrl, 1);
    }
  }, [vendorId]);

  // Load whenever page or fetchUrl changes
  useEffect(() => {
    if (fetchUrl) {
      loadProducts(fetchUrl, currentPage);
    }
  }, [currentPage, fetchUrl]);

  const handleDeleteProduct = async (productPid) => {
    try {
      await deleteProduct(vendorId, productPid);
      // Refetch current page (or fall back to page 1 if current page becomes empty)
      loadProducts(fetchUrl, currentPage);
    } catch (error) {
      log.error("Error deleting product:", error);
    }
  };

  const handleFilterProduct = async (param) => {
    const filterUrl =
      param === "no-filter"
        ? `vendor/products/${vendorId}/`
        : `vendor-product-filter/${vendorId}?filter=${param}`;
    setFetchUrl(filterUrl);
    setCurrentPage(1); // Reset to first page on filter change
  };

  return (
    <div className="w-full px-4" id="main">
      <div className="flex flex-row h-full">
        <Sidebar />
        <div className="flex-1 mt-4 px-4">
          <h4 className="text-xl font-semibold flex items-center mb-4">
            <i className="bi bi-grid mr-2" /> All Products
          </h4>

          <div className="flex flex-wrap gap-3 mb-6">
            {/* Filter Dropdown */}
            <div className="relative group">
              <button
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
                type="button"
              >
                Filter <i className="fas fa-sliders ml-2" />
              </button>
              <ul className="absolute left-0 mt-1 hidden group-hover:block bg-white shadow-lg rounded-md z-10 w-48">
                <li>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => handleFilterProduct("no-filter")}
                  >
                    No Filter
                  </button>
                </li>
                <li>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => handleFilterProduct("published")}
                  >
                    Status: Published
                  </button>
                </li>
                <li>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => handleFilterProduct("draft")}
                  >
                    Status: In Draft
                  </button>
                </li>
                <li>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => handleFilterProduct("in-review")}
                  >
                    Status: In-review
                  </button>
                </li>
                <li>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => handleFilterProduct("disabled")}
                  >
                    Status: Disabled
                  </button>
                </li>
                <hr className="my-2" />
                <li>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => handleFilterProduct("latest")}
                  >
                    Date: Latest
                  </button>
                </li>
                <li>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => handleFilterProduct("oldest")}
                  >
                    Date: Oldest
                  </button>
                </li>
              </ul>
            </div>

            {/* Add Product Button */}
            <Link
              to={"/vendor/product/new/"}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add Product
            </Link>
          </div>

          <hr className="my-6" />

          {/* Table Container */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                  <p className="text-lg text-gray-600">Loading products...</p>
                </div>
              ) : (
                <>
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-800 text-white">
                      <tr>
                        <th className="py-3 px-4 text-left">#ID</th>
                        <th className="py-3 px-4 text-left">Name</th>
                        <th className="py-3 px-4 text-left">Price</th>
                        <th className="py-3 px-4 text-left">Quantity</th>
                        <th className="py-3 px-4 text-left">Orders</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.pid} className="border-b hover:bg-gray-50">
                          <th className="py-3 px-4 font-medium" scope="row">
                            #{p.sku}
                          </th>
                          <td className="py-3 px-4">{p.title}</td>
                          <td className="py-3 px-4">₹{p.price}</td>
                          <td className="py-3 px-4">{p.stock_qty}</td>
                          <td className="py-3 px-4">{p.order_count}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-200">
                              {p?.status?.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Link
                                to={`/detail/${p.slug}`}
                                className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 flex items-center justify-center"
                              >
                                <Eye size={16} />
                              </Link>
                              <Link
                                to={`/vendor/product/update/${p.pid}/`}
                                className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 flex items-center justify-center"
                              >
                                <Pencil size={16} />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.pid)}
                                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 flex items-center justify-center"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr>
                          <td
                            colSpan="7"
                            className="text-center py-8 text-lg text-gray-500"
                          >
                            No Products Yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  {totalCount > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center py-4 px-6 border-t bg-gray-50">
                      <p className="text-sm text-gray-700 mb-2 sm:mb-0">
                        Showing page {currentPage} ({totalCount} total products)
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={!hasPrev || loading}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage((prev) => prev + 1)}
                          disabled={!hasNext || loading}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductsVendor;
