import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import { ShoppingCart, Heart } from "lucide-react";
import UserData from "../../plugin/UserData";
import moment from "moment";
import { Link } from "react-router-dom";
import { addToWishlist } from "../../plugin/addToWishlist";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const axios = apiInstance;
  const userData = UserData();

  // Placeholder image for broken or missing images
  const placeholderImage =
    "https://via.placeholder.com/300x300.png?text=No+Image";

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
      console.log("Error fetching wishlist:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.user_id) {
      fetchWishlist();
    }
  }, [userData?.user_id]);

  console.log("Wishlist data:", wishlist);

  const handleAddToWishlist = async (product_id) => {
    try {
      await addToWishlist(product_id, userData?.user_id);
      fetchWishlist();
    } catch (error) {
      console.log("Error updating wishlist:", error);
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
