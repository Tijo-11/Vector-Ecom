import { useState, useEffect, useContext } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart } from "lucide-react";
import ProductsPlaceholder from "./Products/ProductsPlaceHolder";
import apiInstance from "../../utils/axios";
import UserCountry from "./ProductDetail/UserCountry";
import UserData from "../../plugin/UserData";
import cartID from "./ProductDetail/cartId";
import Swal from "sweetalert2";
import log from "loglevel";
import { CartContext } from "../../plugin/Context";
import { addToWishlist } from "../../plugin/addToWishlist";
import { useAuthStore } from "../../store/auth";
import StarRating from "./Products/StarRating";

export default function SearchPage() {
  const Toast = Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
  });

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedColors, setSelectedColors] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});
  const [quantityValue, setQuantityValue] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("query") || "";

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState([]); // string[]
  const [tempPriceMin, setTempPriceMin] = useState("");
  const [tempPriceMax, setTempPriceMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const [cartCount, setCartCount] = useContext(CartContext);
  const [wishlist, setWishlist] = useState([]); // Always an array
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  const currentAddress = UserCountry();
  const user = UserData();
  const cart_id = cartID();

  const fetchWishlist = async () => {
    if (!user?.user_id) {
      setWishlist([]);
      return;
    }
    try {
      const response = await apiInstance.get(
        `customer/wishlist/${user?.user_id}/`,
      );
      // Ensure wishlist is always an array (safe fallback)
      const wishlistData = Array.isArray(response.data) ? response.data : [];
      setWishlist(wishlistData);
    } catch (error) {
      log.error("Error fetching wishlist:", error);
      setWishlist([]); // Reset to empty array on error
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user?.user_id]);

  // Fetch categories once
  useEffect(() => {
    apiInstance.get(`category/`).then((response) => {
      setCategories(response.data);
    });
  }, []);

  // Sync all filters from URL
  useEffect(() => {
    const cats = searchParams.getAll("category");
    setSelectedCategories(cats.map(String));

    const pmin = searchParams.get("price_min") || "";
    setPriceMin(pmin);
    setTempPriceMin(pmin);

    const pmax = searchParams.get("price_max") || "";
    setPriceMax(pmax);
    setTempPriceMax(pmax);
  }, [searchParams]);

  // Update URL whenever filters change
  useEffect(() => {
    const currentParams = new URLSearchParams();

    if (query) {
      currentParams.set("query", query);
    }

    selectedCategories.forEach((id) => currentParams.append("category", id));
    if (priceMin) currentParams.set("price_min", priceMin);
    if (priceMax) currentParams.set("price_max", priceMax);

    const newSearch = currentParams.toString();
    const currentSearch = searchParams.toString();

    if (newSearch !== currentSearch) {
      navigate(`/search?${newSearch}`, { replace: true });
    }
  }, [selectedCategories, priceMin, priceMax, query, searchParams, navigate]);

  // Debounce price inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setPriceMin(tempPriceMin || "");
      setPriceMax(tempPriceMax || "");
    }, 600);
    return () => clearTimeout(timer);
  }, [tempPriceMin, tempPriceMax]);

  // Fetch products
  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams();

    if (query) {
      params.set("query", query);
    }

    selectedCategories.forEach((catId) => {
      params.append("category", catId);
    });

    if (priceMin) {
      params.set("price_min", priceMin);
    }
    if (priceMax) {
      params.set("price_max", priceMax);
    }

    let url = "search/";
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    apiInstance
      .get(url)
      .then((response) => {
        setProducts(response.data);
        const initialQuantities = response.data.reduce(
          (acc, product) => ({
            ...acc,
            [product.id]: "0",
          }),
          {},
        );
        setQuantityValue(initialQuantities);
        setSelectedColors({});
        setSelectedSizes({});
        setLoading(false);
      })
      .catch((error) => {
        log.error("Error fetching search results:", error);
        setLoading(false);
      });
  }, [query, selectedCategories, priceMin, priceMax]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > window.innerHeight);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCategoryToggle = (catId) => {
    const idStr = catId.toString();
    setSelectedCategories((prev) =>
      prev.includes(idStr)
        ? prev.filter((id) => id !== idStr)
        : [...prev, idStr],
    );
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setPriceMin("");
    setPriceMax("");
    setTempPriceMin("");
    setTempPriceMax("");
  };

  const handleColorButtonClick = (e, productId, colorName) => {
    setSelectedColors((prev) => ({ ...prev, [productId]: colorName }));
  };

  const handleSizeButtonClick = (e, productId, sizeName) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: sizeName }));
  };

  const handleQuantityChange = (e, productId) => {
    setQuantityValue((prev) => ({ ...prev, [productId]: e.target.value }));
  };

  const handleAddToCart = async (product_id, price, shipping_amount, slug) => {
    const qty = Number(quantityValue[product_id] || 0);
    if (qty <= 0) return;

    try {
      const productRes = await apiInstance.get(`/products/${slug}/`);
      const stock_qty = productRes.data.stock_qty;
      const product_name = productRes.data.title;

      const url = user?.user_id
        ? `/cart-list/${cart_id}/${user.user_id}/`
        : `/cart-list/${cart_id}/`;

      const cartRes = await apiInstance.get(url);
      const existingQty =
        cartRes.data.find((item) => item.product.id === product_id)?.qty || 0;

      if (existingQty + qty > stock_qty) {
        Swal.fire({
          icon: "warning",
          title: "Stock Limit Reached",
          text: `Only ${stock_qty} unit(s) of "${product_name}" available.`,
          confirmButtonColor: "#2563eb",
        });
        return;
      }

      const formData = new FormData();
      formData.append("product", product_id);
      formData.append("user", user?.user_id || "");
      formData.append("qty", qty);
      formData.append("price", price);
      formData.append("shipping_amount", shipping_amount);
      formData.append("country", currentAddress?.country || "Unknown");
      formData.append("size", selectedSizes[product_id] || "");
      formData.append("color", selectedColors[product_id] || "");
      formData.append("cart_id", cart_id);

      setCartCount((prev) => prev + qty);

      const response = await apiInstance.post(`cart/`, formData);
      Toast.fire({
        icon: "success",
        title: response.data.message || "Added to cart",
      });

      const res = await apiInstance.get(url);
      const totalQty = res.data.reduce((sum, item) => sum + item.qty, 0);
      setCartCount(totalQty);
    } catch (error) {
      log.error("Error adding to cart:", error);
      Toast.fire({
        icon: "error",
        title: "Failed to add to cart",
      });
    }
  };

  const handleAddToWishlist = async (product_id) => {
    if (!isLoggedIn || !user?.user_id) return;

    try {
      await addToWishlist(product_id, user?.user_id);
      await fetchWishlist(); // Refresh wishlist after change
    } catch (error) {
      log.error("Error updating wishlist:", error);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const hasActiveFilters =
    query || selectedCategories.length > 0 || priceMin || priceMax;

  // Helper to safely check if product is in wishlist
  const isInWishlist = (productId) => {
    return (
      Array.isArray(wishlist) &&
      wishlist.some((item) => item?.product?.id === productId)
    );
  };

  if (loading) return <ProductsPlaceholder />;

  return (
    <div className="container mx-auto my-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        {/* Title */}
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-3xl font-bold">
            {query ? `Search Results for "${query}"` : "Browse Products"}
          </h1>
          {products.length > 0 && (
            <p className="text-lg text-gray-600 mt-2">
              {products.length} product{products.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>

        {/* Filters + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:sticky lg:top-20 space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-red-600 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <h4 className="font-medium mb-4">Categories</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id.toString())}
                      onChange={() => handleCategoryToggle(cat.id)}
                      className="mr-3 form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="text-gray-700">{cat.title}</span>
                  </label>
                ))}
              </div>

              <h4 className="font-medium mt-8 mb-4">Price Range (₹)</h4>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Min"
                  min="0"
                  value={tempPriceMin}
                  onChange={(e) => setTempPriceMin(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  min="0"
                  value={tempPriceMax}
                  onChange={(e) => setTempPriceMax(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Changes apply automatically after typing
              </p>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {products.length === 0 && !loading && (
              <div className="text-center py-20">
                {hasActiveFilters ? (
                  <p className="text-xl text-gray-500">
                    No products found. Try adjusting your search or filters.
                  </p>
                ) : (
                  <div className="max-w-2xl mx-auto">
                    <p className="text-2xl font-semibold text-gray-700 mb-6">
                      Welcome to our store!
                    </p>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Use the{" "}
                      <strong>search bar in the navigation header</strong> to
                      find specific products,
                      <br />
                      or select a <strong>category</strong> and/or{" "}
                      <strong>price range</strong> from the filters on the left
                      to start browsing.
                    </p>
                  </div>
                )}
              </div>
            )}

            {products.length > 0 && (
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
                {products.map((product) => (
                  <div key={product.id} className="group flex flex-col h-full">
                    <Link to={`/product/${product.slug}`}>
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-64 rounded-lg bg-gray-200 object-contain group-hover:opacity-75"
                      />
                      <h3 className="mt-4 text-sm text-gray-700">
                        {product.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mt-2">
                      {product.offer_discount > 0 ? (
                        <>
                          <p className="text-sm line-through text-gray-400">
                            ₹{product.price}
                          </p>
                          <p className="text-lg font-medium text-gray-900">
                            ₹
                            {(
                              product.price *
                              (1 - product.offer_discount / 100)
                            ).toFixed(2)}
                          </p>
                        </>
                      ) : (
                        <p className="text-lg font-medium text-gray-900">
                          ₹{product.price}
                        </p>
                      )}
                      {product.old_price && (
                        <p className="text-sm line-through text-gray-400">
                          ₹{product.old_price}
                        </p>
                      )}
                      {product.offer_discount > 0 && (
                        <span className="text-red-500 font-bold animate-pulse">
                          {product.offer_discount}% OFF
                        </span>
                      )}
                    </div>
                    {product.stock_qty === 0 || !product.in_stock ? (
                      <p className="text-red-600 font-semibold mt-2">
                        Out of Stock
                      </p>
                    ) : (
                      <p className="text-green-600 font-semibold mt-2">
                        In Stock
                      </p>
                    )}
                    <StarRating rating={product.rating} />
                    {product.category && (
                      <p className="text-sm text-gray-500 mt-1">
                        Category: {product.category.title}
                      </p>
                    )}
                    <div className="mt-4">
                      {product.size?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium">
                            Size: {selectedSizes[product.id] || "Select size"}
                          </p>
                          <ul className="flex gap-2 flex-wrap mt-1">
                            {product.size.map((size, index) => (
                              <li key={index}>
                                <button
                                  onClick={(e) =>
                                    handleSizeButtonClick(
                                      e,
                                      product.id,
                                      size.name,
                                    )
                                  }
                                  className={`px-3 py-1 border rounded hover:bg-gray-100 transition ${
                                    selectedSizes[product.id] === size.name
                                      ? "bg-blue-600 text-white"
                                      : ""
                                  }`}
                                >
                                  {size.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {product.color?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium">
                            Color:{" "}
                            {selectedColors[product.id] || "Select color"}
                          </p>
                          <ul className="flex gap-2 flex-wrap mt-1">
                            {product.color.map((color, index) => (
                              <li key={index}>
                                <button
                                  onClick={(e) =>
                                    handleColorButtonClick(
                                      e,
                                      product.id,
                                      color.name,
                                    )
                                  }
                                  className={`w-10 h-10 border-2 rounded-full transition ${
                                    selectedColors[product.id] === color.name
                                      ? "border-blue-600 scale-110"
                                      : "border-gray-300"
                                  }`}
                                  style={{
                                    backgroundColor: color.color_code || "#ccc",
                                  }}
                                  title={color.name}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="mb-3">
                        <label className="text-sm font-medium">Quantity:</label>
                        <input
                          type="number"
                          value={quantityValue[product.id] || "0"}
                          onChange={(e) => handleQuantityChange(e, product.id)}
                          className="border rounded px-3 py-1 w-20 ml-2"
                          min="1"
                          max={product.stock_qty}
                        />
                      </div>
                    </div>
                    <div className="mt-auto flex flex-col gap-2">
                      <button
                        onClick={() => {
                          if (product.stock_qty === 0 || !product.in_stock) {
                            Swal.fire({
                              icon: "warning",
                              title: "Out of Stock",
                              text: "This product is currently out of stock.",
                              confirmButtonColor: "#2563eb",
                            });
                            return;
                          }
                          if (
                            !Number(quantityValue[product.id]) ||
                            Number(quantityValue[product.id]) < 1
                          ) {
                            Swal.fire({
                              icon: "info",
                              title: "Select Quantity",
                              text: "Please enter a valid quantity.",
                              confirmButtonColor: "#2563eb",
                            });
                            return;
                          }
                          handleAddToCart(
                            product.id,
                            product.price,
                            product.shipping_amount,
                            product.slug,
                          );
                        }}
                        disabled={
                          product.stock_qty === 0 ||
                          !product.in_stock ||
                          !Number(quantityValue[product.id]) ||
                          Number(quantityValue[product.id]) < 1
                        }
                        className={`flex items-center justify-center gap-2 w-full rounded-lg py-3 transition font-medium ${
                          product.stock_qty === 0 || !product.in_stock
                            ? "bg-gray-400 cursor-not-allowed text-gray-700"
                            : !Number(quantityValue[product.id]) ||
                                Number(quantityValue[product.id]) < 1
                              ? "bg-gray-400 cursor-not-allowed text-gray-700"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        <ShoppingCart size={20} />
                        {product.stock_qty === 0 || !product.in_stock
                          ? "Out of Stock"
                          : "Add to Cart"}
                      </button>

                      {isLoggedIn && (
                        <button
                          onClick={() => handleAddToWishlist(product.id)}
                          className={`flex items-center justify-center gap-2 w-full rounded-lg py-3 transition font-medium ${
                            isInWishlist(product.id)
                              ? "bg-gray-600 text-white hover:bg-gray-700"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                        >
                          <Heart size={20} />
                          {isInWishlist(product.id)
                            ? "Remove from Wishlist"
                            : "Add to Wishlist"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-12 py-3 rounded-full shadow-lg hover:bg-blue-700 transition font-medium"
        >
          ↑ Go to Top
        </button>
      )}
    </div>
  );
}
