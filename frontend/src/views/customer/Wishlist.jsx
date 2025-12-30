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
import CartId from "../shop/ProductDetail/cartId.jsx";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
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

  const fetchWishlist = async () => {
    if (!userData?.user_id) {
      setLoading(false); // ✅ prevent invalid API call
      return;
    }
    try {
      const response = await axios.get(
        `customer/wishlist/${userData?.user_id}/`
      );
      setWishlist(response.data);
      setLoading(false);
    } catch (error) {
      log.error("Error fetching wishlist:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.user_id) {
      fetchWishlist();
    }
  }, [userData?.user_id]);

  log.debug("Wishlist data:", wishlist);

  const handleAddToWishlist = async (product_id) => {
    try {
      await addToWishlist(product_id, userData?.user_id);
      fetchWishlist();
    } catch (error) {
      log.debug("Error updating wishlist:", error);
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
      const cartItems = cartRes.data;

      const existingItem = cartItems.find(
        (item) => item.product.id === product_id
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
        return; // ❌ Stop execution
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
      const totalQty = res.data.reduce((sum, item) => sum + item.qty, 0);
      setCartCount(totalQty);

      // Remove from wishlist
      await addToWishlist(product_id, userData?.user_id);
      fetchWishlist();
    } catch (error) {
      log.error("Error adding to cart:", error);
      Toast.fire({
        icon: "error",
        title: "Failed to add to cart",
      });
    }
  };

  const handleImageError = (e) => {
    e.target.src = placeholderImage; // Set fallback image on error
  };

  return (
    <div>
      <main className="mt-5">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center">
              <img
                className="mx-auto"
                src="https://cdn.dribbble.com/users/2046015/screenshots/5973727/06-loader_telega.gif"
                alt="Loading"
              />
            </div>
          ) : (
            <section>
              <div className="flex flex-col lg:flex-row gap-6">
                <Sidebar />
                <div className="lg:w-3/4 mt-1 lg:ml-4">
                  <section>
                    <main className="mb-10">
                      <div className="container mx-auto">
                        {/* Section: Summary */}
                        <section>
                          <h3 className="mb-6 text-2xl font-semibold flex items-center gap-2">
                            <i className="fas fa-heart text-red-600 animate-pulse" />{" "}
                            Wishlist
                          </h3>
                          {wishlist.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {wishlist.map((w, index) => (
                                <div
                                  key={index}
                                  className="bg-white rounded-lg shadow-lg overflow-hidden"
                                >
                                  <div className="w-full h-64 flex items-center justify-center bg-gray-100">
                                    <img
                                      src={w.product.image || placeholderImage}
                                      alt={w.product.title || "Product Image"}
                                      onError={handleImageError}
                                      className="max-h-full max-w-full object-contain"
                                    />
                                  </div>

                                  <div className="p-4">
                                    <Link
                                      to={`/detail/${w.product.slug || ""}`}
                                      className="text-gray-800 hover:text-blue-600"
                                    >
                                      <h6 className="text-lg font-semibold mb-2">
                                        {w.product.title.slice(0, 30)}...
                                      </h6>
                                    </Link>
                                    {w.product?.brand ? (
                                      <Link
                                        to={`/brand/${
                                          w.product.brand.slug || ""
                                        }`}
                                        className="text-gray-600 hover:text-blue-600"
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
                                    <h6 className="text-lg font-bold mb-3">
                                      ₹{w.product.price || "0.00"}
                                    </h6>
                                    <button
                                      onClick={() =>
                                        handleAddToWishlist(w.product.id)
                                      }
                                      type="button"
                                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                                    >
                                      <Heart size={18} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleAddToCart(
                                          w.product.id,
                                          w.product.price,
                                          w.product.shipping_amount || 0,
                                          w.product.slug
                                        )
                                      }
                                      type="button"
                                      className="bg-blue-600 text-white mx-3 px-3 py-1 rounded hover:bg-red-700 transition-colors"
                                    >
                                      <ShoppingCart size={18} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <h4 className="text-center text-gray-600 p-4">
                              No items in wishlist
                            </h4>
                          )}
                        </section>
                        {/* Section: Summary */}
                        {/* Section: MSC */}
                        {/* Section: MSC */}
                      </div>
                      {/* Container for demo purpose */}
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
