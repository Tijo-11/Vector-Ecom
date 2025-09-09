import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import moment from "moment";
import { Link } from "react-router-dom";
import { addToWishlist } from "../../plugin/addToWishlist";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const axios = apiInstance;
  const userData = UserData();

  const fetchWishlist = async () => {
    try {
      const response = await axios.get(
        `customer/wishlist/${userData?.user_id}/`
      );
      setWishlist(response.data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.user_id) {
      fetchWishlist();
    }
  }, [userData?.user_id]);

  console.log(wishlist);

  const handleAddToWishlist = async (product_id) => {
    try {
      await addToWishlist(product_id, userData?.user_id);
      fetchWishlist();
    } catch (error) {
      console.log(error);
    }
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
                                  <div className="relative group">
                                    <img
                                      src={w.product.image}
                                      className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                                      alt={w.product.title}
                                    />
                                    <div className="absolute inset-0 bg-gray-100 bg-opacity-10 transition-opacity duration-300 group-hover:bg-opacity-20"></div>
                                    <div className="absolute bottom-2 left-2">
                                      <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
                                        New
                                      </span>
                                    </div>
                                  </div>
                                  <div className="p-4">
                                    <Link
                                      to={`/detail/${w.product.slug}`}
                                      className="text-gray-800 hover:text-blue-600"
                                    >
                                      <h6 className="text-lg font-semibold mb-2">
                                        {w.product.title.slice(0, 30)}...
                                      </h6>
                                    </Link>
                                    <Link
                                      to={`/brand/${w.product?.brand.slug}`}
                                      className="text-gray-600 hover:text-blue-600"
                                    >
                                      <p className="text-sm mb-2">
                                        {w.product?.brand.title}
                                      </p>
                                    </Link>
                                    <h6 className="text-lg font-bold mb-3">
                                      ₹{w.product.price}
                                    </h6>
                                    <button
                                      onClick={() =>
                                        handleAddToWishlist(w.product.id)
                                      }
                                      type="button"
                                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                                    >
                                      <i className="fas fa-heart" />
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
