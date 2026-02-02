import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ProductsPlaceholder from "./ProductsPlaceHolder";
import apiInstance from "../../../utils/axios";
import UserData from "../../../plugin/UserData";
import { useAuthStore } from "../../../store/auth";
import log from "loglevel";
import ProductCard from "./ProductCard";
import { ShoppingBag } from "lucide-react";

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
  const selectedCategory = searchParams.get("category") || ""; // single slug

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

  const fetchData = async (page = 1, cat = "") => {
    setLoading(true);
    try {
      const timestamp = Date.now();
      let url = `products/?page=${page}&_=${timestamp}`;

      if (cat) url += `&category=${cat}`;

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
    fetchData(currentPage, selectedCategory);
  }, [searchParams]);

  useEffect(() => {
    fetchWishlist();
  }, [userData?.user_id]);

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryChange = (slug) => {
    const params = new URLSearchParams(searchParams);
    const newSlug = selectedCategory === slug ? "" : slug;

    if (newSlug) {
      params.set("category", newSlug);
    } else {
      params.delete("category");
    }

    params.set("page", "1");
    setSearchParams(params);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

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
          {/* Sidebar Categories */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-24">
              <h2 className="font-bold text-gray-900 text-lg mb-6">
                Categories
              </h2>

              <div className="space-y-1">
                <button
                  onClick={() => handleCategoryChange("")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    !selectedCategory
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                      selectedCategory === cat.slug
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {cat.title}
                  </button>
                ))}
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
                  No products available in this category at the moment.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
