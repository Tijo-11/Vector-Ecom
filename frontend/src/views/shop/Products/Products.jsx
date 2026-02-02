import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ProductsPlaceholder from "./ProductsPlaceHolder";
import apiInstance from "../../../utils/axios";
import UserData from "../../../plugin/UserData";
import { useAuthStore } from "../../../store/auth";
import log from "loglevel";
import ProductCard from "./ProductCard";
import { Filter, ShoppingBag } from "lucide-react";

const PAGE_SIZE = 12;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);

  // URL Params
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const selectedCategories = searchParams.getAll("category"); // array of slugs
  const priceMin = searchParams.get("price_min") || "";
  const priceMax = searchParams.get("price_max") || "";

  // Temp price inputs (for debounce)
  const [tempPriceMin, setTempPriceMin] = useState(priceMin);
  const [tempPriceMax, setTempPriceMax] = useState(priceMax);

  const userData = UserData();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  // Fetch Wishlist
  const fetchWishlist = async () => {
    if (!userData?.user_id) {
      setWishlist([]);
      return;
    }
    try {
      const response = await apiInstance.get(
        `customer/wishlist/${userData?.user_id}/`,
      );
      const wishlistItems = Array.isArray(response.data)
        ? response.data
        : response.data.results || response.data.wishlist_items || [];
      setWishlist(wishlistItems);
    } catch (error) {
      log.error("Error fetching wishlist:", error);
      setWishlist([]);
    }
  };

  const fetchData = async (
    page = 1,
    cats = [],
    minPrice = "",
    maxPrice = "",
  ) => {
    setLoading(true);
    try {
      const timestamp = Date.now();
      let url = `products/?page=${page}&_=${timestamp}`;

      cats.forEach((cat) => {
        url += `&category=${cat}`;
      });

      if (minPrice) url += `&price_min=${minPrice}`;
      if (maxPrice) url += `&price_max=${maxPrice}`;

      const [prodResponse, catResponse] = await Promise.all([
        apiInstance.get(url),
        apiInstance.get(`category/?_=${timestamp}`),
      ]);

      setProducts(prodResponse.data.results || []);
      setTotalCount(prodResponse.data.count || 0);
      setCategories(catResponse.data || []);
    } catch (error) {
      log.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Sync from URL and fetch
  useEffect(() => {
    setTempPriceMin(priceMin);
    setTempPriceMax(priceMax);
    fetchData(currentPage, selectedCategories, priceMin, priceMax);
  }, [searchParams]);

  // Debounce price input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);

      if (tempPriceMin.trim()) {
        params.set("price_min", tempPriceMin.trim());
      } else {
        params.delete("price_min");
      }

      if (tempPriceMax.trim()) {
        params.set("price_max", tempPriceMax.trim());
      } else {
        params.delete("price_max");
      }

      params.set("page", "1"); // Reset to first page on price filter change
      setSearchParams(params);
    }, 600);

    return () => clearTimeout(timer);
  }, [tempPriceMin, tempPriceMax]);

  useEffect(() => {
    fetchWishlist();
  }, [userData?.user_id]);

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryToggle = (slug) => {
    const params = new URLSearchParams(searchParams);

    if (selectedCategories.includes(slug)) {
      // Remove
      const newCats = selectedCategories.filter((c) => c !== slug);
      params.delete("category");
      newCats.forEach((c) => params.append("category", c));
    } else {
      // Add
      params.append("category", slug);
    }

    params.set("page", "1"); // Reset to first page
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("category");
    params.delete("price_min");
    params.delete("price_max");
    params.set("page", "1");
    setSearchParams(params);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const hasActiveFilters =
    selectedCategories.length > 0 || priceMin || priceMax;

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-12">
      {/* Header / Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Shop Collection</h1>
          <p className="text-gray-500 text-sm mt-1">Found {totalCount} items</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-gray-700" />
                  <h2 className="font-bold text-gray-900">Filters</h2>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-red-600 hover:underline font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-8">
                {/* Categories */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Categories
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {categories.map((cat) => (
                      <label
                        key={cat.id}
                        className="flex items-center space-x-3 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat.slug)}
                          onChange={() => handleCategoryToggle(cat.slug)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {cat.title}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Price Range (₹)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Min"
                      min="0"
                      value={tempPriceMin}
                      onChange={(e) => setTempPriceMin(e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      min="0"
                      value={tempPriceMax}
                      onChange={(e) => setTempPriceMax(e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Changes apply automatically after typing
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Grid */}
          <div className="flex-1">
            {loading ? (
              <ProductsPlaceholder />
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      wishlist={wishlist}
                      onWishlistUpdate={fetchWishlist}
                      isLoggedIn={isLoggedIn}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-12 gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                                currentPage === page
                                  ? "bg-blue-600 text-white shadow-md"
                                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="px-1 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        currentPage === totalPages
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  No products found
                </h3>
                <p className="text-gray-500 mt-2">
                  {hasActiveFilters
                    ? "Try adjusting your filters or clearing them."
                    : "No products available at the moment. Come back later."}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
