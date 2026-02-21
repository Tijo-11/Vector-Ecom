import React, { useState, useEffect, useContext } from "react";
import Sidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import { ShoppingCart, Heart } from "lucide-react";
import UserData from "../../plugin/UserData";
import moment from "moment";
import { Link } from "react-router-dom";
import { addToWishlist } from "../../plugin/addToWishlist";
import log from "loglevel";
import Swal from "sweetalert2";
import { CartContext } from "../../plugin/Context";
import UserCountry from "../shop/ProductDetail/UserCountry";
import CartId from "../shop/ProductDetail/CartId.jsx";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);

  const axios = apiInstance;
  const userData = UserData();
  const currentAddress = UserCountry();
  const cart_id = CartId();
  const [cartCount, setCartCount] = useContext(CartContext);

  // Placeholder image for broken or missing images
  const placeholderImage =
    "https://via.placeholder.com/300x300.png?text=No+Image";

  const Toast = Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
  });

  // Construct URL with page param
  const getWishlistUrl = (page) => {
    const base = `customer/wishlist/${userData?.user_id}/`;
    return page <= 1 ? base : `${base}?page=${page}`;
  };

  const fetchWishlist = async (page = currentPage) => {
    if (!userData?.user_id) {
      setWishlist([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const fullUrl = getWishlistUrl(page);
      const response = await axios.get(fullUrl);

      // Handle paginated response safely
      const data = response.data;
      const wishlistList = Array.isArray(data) ? data : data.results || [];
      const count = data.count ?? wishlistList.length;
      const next = data.next ?? null;
      const prev = data.previous ?? null;

      setWishlist(wishlistList);
      setTotalCount(count);
      setHasNext(!!next);
      setHasPrev(!!prev);
      setCurrentPage(page);
    } catch (error) {
      log.error("Error fetching wishlist:", error);
      setWishlist([]);
      setTotalCount(0);
      setHasNext(false);
      setHasPrev(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist(1);
  }, [userData?.user_id]);

  useEffect(() => {
    fetchWishlist(currentPage);
  }, [currentPage]);

  const handleAddToWishlist = async (product_id) => {
    try {
      await addToWishlist(product_id, userData?.user_id);
      fetchWishlist(currentPage); // Refetch current page
    } catch (error) {
      log.error("Error updating wishlist:", error);
    }
  };

  const handleAddToCart = async (product_id, price, shipping_amount, slug) => {
    const qty = 1;

    try {
      // 1️⃣ Get product details to check stock
      const productRes = await apiInstance.get(`/products/${slug}/`);
      const stock_qty = productRes.data.stock_qty;
      const product_name = productRes.data.title;

      // 2️⃣ Get current cart items
      const url = userData?.user_id
        ? `/cart-list/${cart_id}/${userData.user_id}/`
        : `/cart-list/${cart_id}/`;
      const cartRes = await apiInstance.get(url);

      // Safe guard for cart items
      const cartItems = Array.isArray(cartRes.data)
        ? cartRes.data
        : cartRes.data.results || cartRes.data.items || [];

      const existingItem = cartItems.find(
        (item) => item.product.id === product_id,
      );
      const existingQty = existingItem ? existingItem.qty : 0;

      // 3️⃣ Check stock availability
      if (existingQty + qty > stock_qty) {
        Swal.fire({
          icon: "warning",
          title: "Stock Limit Reached",
          text: `Only ${stock_qty} unit(s) of "${product_name}" available. You already have ${existingQty} in your cart. Please order up to ${
            stock_qty - existingQty
          } more.`,
          confirmButtonColor: "#2563eb",
        });
        return;
      }

      // 4️⃣ Proceed as usual
      const formData = new FormData();
      formData.append("product", product_id);
      formData.append("user", userData?.user_id || "");
      formData.append("qty", qty);
      formData.append("price", price);
      formData.append("shipping_amount", shipping_amount);
      formData.append("country", currentAddress?.country || "Unknown");
      formData.append("size", "");
      formData.append("color", "");
      formData.append("cart_id", cart_id);

      // ✅ Optimistic update
      setCartCount((prev) => prev + qty);

      const response = await apiInstance.post(`cart/`, formData);
      Toast.fire({
        icon: "success",
        title: response.data.message || "Added to cart",
      });

      // ✅ Sync with backend
      const res = await apiInstance.get(url);
      const syncedItems = Array.isArray(res.data)
        ? res.data
        : res.data.results || res.data.items || [];
      const totalQty = syncedItems.reduce(
        (sum, item) => sum + (item.qty || 0),
        0,
      );
      setCartCount(totalQty);

      // Remove from wishlist after successful add to cart
      await addToWishlist(product_id, userData?.user_id);
      fetchWishlist(currentPage);
    } catch (error) {
      log.error("Error adding to cart:", error);
      Toast.fire({
        icon: "error",
        title: "Failed to add to cart",
      });
    }
  };

  const handleImageError = (e) => {
    e.target.src = placeholderImage;
  };

  return (
    <div>
      <main className="mt-5">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-lg text-gray-600">Loading wishlist...</p>
            </div>
          ) : (
            <section>
              <div className="flex flex-col lg:flex-row gap-6">
                <Sidebar />
                <div className="lg:w-3/4 mt-1 lg:ml-4">
                  <section>
                    <main className="mb-10">
                      <div className="container mx-auto">
                        <section>
                          <h3 className="mb-6 text-2xl font-semibold flex items-center gap-2">
                            <i className="fas fa-heart text-red-600 animate-pulse" />{" "}
                            Wishlist ({totalCount})
                          </h3>
                          {wishlist.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {wishlist.map((w) => (
                                <div
                                  key={w.product.id}
                                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                                >
                                  {/* Clickable Image Area - Navigates to Product Detail */}
                                  <Link
                                    to={`/detail/${w.product.slug || ""}`}
                                    className="block w-full h-64 items-center justify-center bg-gray-100 group"
                                  >
                                    <img
                                      src={w.product.image || placeholderImage}
                                      alt={w.product.title || "Product Image"}
                                      onError={handleImageError}
                                      className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
                                    />
                                  </Link>

                                  <div className="p-4">
                                    {/* Clickable Title - Navigates to Product Detail */}
                                    <Link
                                      to={`/detail/${w.product.slug || ""}`}
                                      className="block text-gray-800 hover:text-blue-600 transition-colors"
                                    >
                                      <h6 className="text-lg font-semibold mb-2 line-clamp-2">
                                        {w.product.title || "No Title"}
                                      </h6>
                                    </Link>

                                    {/* Brand */}
                                    {w.product?.brand ? (
                                      <Link
                                        to={`/brand/${w.product.brand.slug || ""}`}
                                        className="text-gray-600 hover:text-blue-600 transition-colors"
                                      >
                                        <p className="text-sm mb-2">
                                          {w.product.brand.title ||
                                            "Unknown Brand"}
                                        </p>
                                      </Link>
                                    ) : (
                                      <p className="text-sm mb-2 text-gray-600">
                                        No Brand
                                      </p>
                                    )}

                                    <div className="flex items-baseline gap-2 mb-4">
                                      {w.product.offer_discount > 0 ? (
                                        <>
                                          <h6 className="text-lg font-bold text-blue-600">
                                            ₹
                                            {(
                                              w.product.price *
                                              (1 -
                                                w.product.offer_discount / 100)
                                            ).toFixed(2)}
                                          </h6>
                                          <span className="text-sm text-gray-400 line-through">
                                            ₹{w.product.price}
                                          </span>
                                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                            -{w.product.offer_discount}%
                                          </span>
                                        </>
                                      ) : (
                                        <h6 className="text-lg font-bold">
                                          ₹{w.product.price || "0.00"}
                                        </h6>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                      <button
                                        onClick={() =>
                                          handleAddToWishlist(w.product.id)
                                        }
                                        type="button"
                                        className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                                      >
                                        <Heart size={18} /> Remove
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleAddToCart(
                                            w.product.id,
                                            w.product.price,
                                            w.product.shipping_amount || 0,
                                            w.product.slug,
                                          )
                                        }
                                        type="button"
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                                      >
                                        <ShoppingCart size={18} /> Add to Cart
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <h4 className="text-center text-gray-600 p-10 text-xl">
                              No items in wishlist
                            </h4>
                          )}

                          {/* Pagination Controls */}
                          {totalCount > wishlist.length && (
                            <div className="flex justify-center items-center mt-12 gap-8">
                              <button
                                onClick={() =>
                                  setCurrentPage((prev) =>
                                    Math.max(prev - 1, 1),
                                  )
                                }
                                disabled={!hasPrev || loading}
                                className="px-6 py-3 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                              >
                                Previous
                              </button>

                              <span className="text-lg font-medium">
                                Page {currentPage} ({totalCount} total items)
                              </span>

                              <button
                                onClick={() =>
                                  setCurrentPage((prev) => prev + 1)
                                }
                                disabled={!hasNext || loading}
                                className="px-6 py-3 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </section>
                      </div>
                    </main>
                  </section>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default Wishlist;
