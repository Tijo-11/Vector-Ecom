import React, { useState, useEffect } from "react";
import { Tag, Trash, Plus, CheckCircle } from "lucide-react";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";

function Offers() {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [offerTotalCount, setOfferTotalCount] = useState(0);
  const [productTotalCount, setProductTotalCount] = useState(0);
  const [offerCurrentPage, setOfferCurrentPage] = useState(1);
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  const [offerHasNext, setOfferHasNext] = useState(false);
  const [offerHasPrev, setOfferHasPrev] = useState(false);
  const [productHasNext, setProductHasNext] = useState(false);
  const [productHasPrev, setProductHasPrev] = useState(false);
  const [formData, setFormData] = useState({
    discount_percentage: "",
    start_date: "",
    end_date: "",
    product_ids: [],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const axios = apiInstance;
  const userData = UserData();
  const vendorId = userData?.vendor_id;

  if (userData?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  // URL constructors
  const getOffersUrl = (page) => {
    const base = `vendor/offers/${vendorId}/`;
    return page <= 1 ? base : `${base}?page=${page}`;
  };

  const getProductsUrl = (page) => {
    const base = `vendor/products/${vendorId}/`;
    return page <= 1 ? base : `${base}?page=${page}`;
  };

  const fetchData = async (
    offerPage = offerCurrentPage,
    productPage = productCurrentPage,
  ) => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const [offersRes, productsRes] = await Promise.all([
        axios.get(getOffersUrl(offerPage)),
        axios.get(getProductsUrl(productPage)),
      ]);

      // Handle offers (paginated)
      const offersData = offersRes.data;
      const offerList = Array.isArray(offersData)
        ? offersData
        : offersData.results || [];
      setOffers(offerList);
      setOfferTotalCount(offersData.count ?? offerList.length);
      setOfferHasNext(!!offersData.next);
      setOfferHasPrev(!!offersData.previous);
      setOfferCurrentPage(offerPage);

      // Handle products (paginated) - for select
      const productsData = productsRes.data;
      const productList = Array.isArray(productsData)
        ? productsData
        : productsData.results || [];
      setProducts(productList);
      setProductTotalCount(productsData.count ?? productList.length);
      setProductHasNext(!!productsData.next);
      setProductHasPrev(!!productsData.previous);
      setProductCurrentPage(productPage);
    } catch (err) {
      console.error("Fetch error:", err);
      setOffers([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, 1);
  }, [vendorId]);

  // Separate effects for page changes
  useEffect(() => {
    fetchData(offerCurrentPage, productCurrentPage);
  }, [offerCurrentPage, productCurrentPage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const discount = Number(formData.discount_percentage);

    if (isNaN(discount) || discount <= 0 || discount >= 100) {
      setError(
        "Discount percentage must be greater than 0% and less than 100%.",
      );
      return;
    }

    if (formData.product_ids.length === 0) {
      setError("Please select at least one product.");
      return;
    }

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (start >= end) {
        setError("End date and time must be after the start date and time.");
        return;
      }
    }

    try {
      const startDateUtc = formData.start_date
        ? new Date(formData.start_date).toISOString()
        : null;
      const endDateUtc = formData.end_date
        ? new Date(formData.end_date).toISOString()
        : null;

      const payload = {
        discount_percentage: discount,
        start_date: startDateUtc,
        end_date: endDateUtc,
        product_ids: formData.product_ids.map((id) => Number(id)),
      };

      await axios.post(`vendor/offers/${vendorId}/`, payload);
      setSuccess("Offer created successfully!");
      fetchData(1, productCurrentPage); // Reset offers to page 1
      setFormData({
        discount_percentage: "",
        start_date: "",
        end_date: "",
        product_ids: [],
      });
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Create offer error:", err.response?.data || err);
      setError(
        err.response?.data?.detail ||
          JSON.stringify(err.response?.data) ||
          "Failed to create offer",
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`vendor/offers/${vendorId}/${id}/`);
      setSuccess("Offer deleted successfully!");
      fetchData(offerCurrentPage, productCurrentPage);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete offer");
    }
  };

  const formatDate = (dateString, type = "end") => {
    if (!dateString) {
      return type === "start" ? "Immediate" : "No end date";
    }
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <h4 className="text-2xl font-bold mb-8 flex items-center">
          <Tag className="mr-3" size={28} /> Manage Product Offers
        </h4>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-lg text-gray-600">
              Loading offers and products...
            </p>
          </div>
        ) : (
          <>
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-6 flex items-center">
                <CheckCircle className="mr-3" size={24} />
                <span className="font-medium">{success}</span>
              </div>
            )}

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
                      min="0.01"
                      max="99.99"
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
                    <p className="text-xs text-gray-500 mt-1">
                      Must be greater than 0% and less than 100%
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date & Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to start immediately
                    </p>
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
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty for no expiration
                    </p>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Products <span className="text-red-500">*</span>
                  </label>
                  {products.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No products available yet. Create products first to apply
                      offers.
                    </p>
                  ) : (
                    <>
                      <select
                        multiple
                        size="8"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            product_ids: Array.from(
                              e.target.selectedOptions,
                              (option) => option.value,
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
                      {/* Simple pagination for products in select */}
                      {productTotalCount > products.length && (
                        <div className="flex justify-center gap-4 mt-4">
                          <button
                            type="button"
                            onClick={() =>
                              setProductCurrentPage((prev) =>
                                Math.max(prev - 1, 1),
                              )
                            }
                            disabled={!productHasPrev}
                            className="px-4 py-2 bg-gray-600 text-white rounded disabled:bg-gray-400"
                          >
                            Prev Products
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setProductCurrentPage((prev) => prev + 1)
                            }
                            disabled={!productHasNext}
                            className="px-4 py-2 bg-gray-600 text-white rounded disabled:bg-gray-400"
                          >
                            Next Products
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={products.length === 0}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium px-8 py-4 rounded-lg flex items-center transition"
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
                <>
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
                              {formatDate(offer.start_date, "start")}
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
                                {offer.is_active
                                  ? "Active"
                                  : "Expired/Inactive"}
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

                  {/* Pagination for Offers */}
                  {offerTotalCount > offers.length && (
                    <div className="flex justify-center items-center mt-8 gap-6">
                      <button
                        onClick={() =>
                          setOfferCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={!offerHasPrev || loading}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                      >
                        Previous
                      </button>

                      <span className="text-lg font-medium">
                        Page {offerCurrentPage} ({offerTotalCount} total offers)
                      </span>

                      <button
                        onClick={() => setOfferCurrentPage((prev) => prev + 1)}
                        disabled={!offerHasNext || loading}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Offers;
