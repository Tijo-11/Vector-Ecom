import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart } from "lucide-react";
import ProductsPlaceholder from "./ProductsPlaceHolder";
import Categories from "../category/Categories";
import apiInstance from "../../../utils/axios";
import UserCountry from "../ProductDetail/UserCountry";
import UserData from "../../../plugin/UserData";
import cartID from "../ProductDetail/cartId";
import Swal from "sweetalert2";
import { CartContext } from "../../../plugin/Context";
import CartId from "../ProductDetail/cartId.jsx";
import { addToWishlist } from "../../../plugin/addToWishlist";
import { useAuthStore } from "../../../store/auth";
import StarRating from "./StarRating";
import log from "loglevel";
export default function Products() {
  const Toast = Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // New state for categories
  const [loading, setLoading] = useState(false);
  const [selectedColors, setSelectedColors] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});
  const [quantityValue, setQuantityValue] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [cartCount, setCartCount] = useContext(CartContext);
  const [wishlist, setWishlist] = useState([]);
  const userData = UserData();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  // Fetch wishlist
  const fetchWishlist = async () => {
    if (!userData?.user_id) return;
    try {
      const response = await apiInstance.get(
        `customer/wishlist/${userData?.user_id}/`,
      );
      setWishlist(response.data);
    } catch (error) {
      log.error("Error fetching wishlist:", error);
    }
  };
  useEffect(() => {
    const fetchData = async (isInitial = false) => {
      if (isInitial) setLoading(true);

      try {
        const timestamp = Date.now(); // Unique cache-buster

        const [prodResponse, catResponse] = await Promise.all([
          apiInstance.get(`products/?_=${timestamp}`),
          apiInstance.get(`category/?_=${timestamp}`),
        ]);

        // Preserve existing user selections before updating state
        const currentQuantities = { ...quantityValue };
        const currentColors = { ...selectedColors };
        const currentSizes = { ...selectedSizes };

        // Update products and categories
        setProducts(prodResponse.data);
        setCategories(catResponse.data);

        // Rebuild selections only for products that still exist
        const newQuantities = {};
        const newColors = {};
        const newSizes = {};

        prodResponse.data.forEach((product) => {
          newQuantities[product.id] = currentQuantities[product.id] ?? "0";
          newColors[product.id] = currentColors[product.id];
          newSizes[product.id] = currentSizes[product.id];
        });

        setQuantityValue(newQuantities);
        setSelectedColors(newColors);
        setSelectedSizes(newSizes);
      } catch (error) {
        log.error("Error fetching products/categories:", error);
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    // Initial fetch
    fetchData(true);

    // Poll every 30 seconds for live updates
    const intervalId = setInterval(() => {
      fetchData(false);
    }, 30000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);

  const currentAddress = UserCountry();
  const user = UserData();
  const cart_id = cartID();
  const handleColorButtonClick = (e, productId, colorName) => {
    setSelectedColors((prev) => ({ ...prev, [productId]: colorName }));
    setSelectedProduct(productId);
  };
  const handleSizeButtonClick = (e, productId, sizeName) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: sizeName }));
    setSelectedProduct(productId);
  };
  const handleQuantityChange = (e, productId) => {
    setQuantityValue((prev) => ({ ...prev, [productId]: e.target.value }));
    setSelectedProduct(productId);
  };
  // ✅ Updated with stock check logic
  const handleAddToCart = async (product_id, price, shipping_amount, slug) => {
    const qty = Number(quantityValue[product_id] || 0);
    if (qty <= 0) return;
    try {
      // 1️⃣ Get product details to check stock
      const productRes = await apiInstance.get(`/products/${slug}/`);
      const stock_qty = productRes.data.stock_qty;
      const product_name = productRes.data.title;
      // const offer_discount = productRes.data.offer_discount;
      // Calculate effective price - REMOVED: Backend handles discount
      // const effectivePrice =
      //   offer_discount > 0 ? price * (1 - offer_discount / 100) : price;
      const effectivePrice = price;
      // 2️⃣ Get current cart items
      const url = user?.user_id
        ? `/cart-list/${cart_id}/${user.user_id}/`
        : `/cart-list/${cart_id}/`;
      const cartRes = await apiInstance.get(url);
      const cartItems = cartRes.data;
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
        return; // ❌ Stop execution
      }
      // 4️⃣ Proceed as usual
      const formData = new FormData();
      formData.append("product", product_id);
      formData.append("user", user?.user_id || "");
      formData.append("qty", qty);
      formData.append("price", effectivePrice);
      formData.append("shipping_amount", shipping_amount);
      formData.append("country", currentAddress?.country || "Unknown");
      formData.append("size", selectedSizes[product_id] || "");
      formData.append("color", selectedColors[product_id] || "");
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
    } catch (error) {
      log.error("Error adding to cart:", error);
      Toast.fire({
        icon: "error",
        title: "Failed to add to cart",
      });
    }
  };
  const handleAddToWishlist = async (product_id) => {
    try {
      await addToWishlist(product_id, userData?.user_id);
      fetchWishlist(); // Refresh wishlist after adding/removing
    } catch (error) {
      log.error("Error updating wishlist:", error);
    }
  };
  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "auto" });
  };
  // Filter categories with offers
  const offeredCategories = categories.filter((cat) => cat.offer_discount > 0);
  if (loading) return <ProductsPlaceholder />;
  return (
    <div className="container mx-auto my-8 ">
      {/* Dynamic Banner for Category Offers */}
      <div className="bg-yellow-100 py-8 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Your Destination for Timeless Treasures.
        </h1>
        <p className="text-lg text-gray-600">
          Because memories never go out of style.
        </p>
        {offeredCategories.length > 0 && (
          <div className="mt-4">
            <h2 className="text-2xl font-semibold mb-2">
              Special Category Offers!
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {offeredCategories.map((cat) => (
                <div key={cat.id} className="bg-white p-4 rounded shadow">
                  <p className="font-bold">{cat.title}</p>
                  <p className="text-red-500 animate-pulse">
                    {cat.offer_discount}% OFF
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="sr-only">Products</h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8 mt-4">
          {products?.map((product) => (
            <div key={product.id} className="group flex flex-col h-full">
              <Link to={`/product/${product.slug}`}>
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-64 rounded-lg bg-gray-200 object-contain group-hover:opacity-75"
                />
                <h3 className="mt-4 text-sm text-gray-700">{product.title}</h3>
              </Link>
              <div className="flex items-center gap-2">
                {product.offer_discount > 0 ? (
                  <>
                    <p className="text-sm line-through text-gray-400">
                      ₹{product.price}
                    </p>
                    <p className="mt-1 text-lg font-medium text-gray-900">
                      ₹
                      {(
                        product.price *
                        (1 - product.offer_discount / 100)
                      ).toFixed(2)}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-lg font-medium text-gray-900">
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
                {product.stock_qty === 0 || !product.in_stock ? (
                  <p className="text-red-600 font-semibold mt-2">
                    Out of Stock
                  </p>
                ) : (
                  <p className="text-green-600 font-semibold mt-2">In Stock</p>
                )}
              </div>
              <StarRating rating={product.rating} />
              {product.category && (
                <p className="text-sm text-gray-500">
                  Category: {product.category.title}
                </p>
              )}
              <div className="mt-2">
                {product.size?.length > 0 && (
                  <div>
                    <p>Size: {selectedSizes[product.id] || "No size"}</p>
                    <ul className="flex gap-2">
                      {product.size.map((size, index) => (
                        <li key={index}>
                          <button
                            onClick={(e) =>
                              handleSizeButtonClick(e, product.id, size.name)
                            }
                            className="px-2 py-1 border rounded hover:bg-gray-100"
                          >
                            {size.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {product.color?.length > 0 && (
                  <div>
                    <p>Color: {selectedColors[product.id] || "No color"}</p>
                    <ul className="flex gap-2">
                      {product.color.map((color, index) => (
                        <li key={index}>
                          <button
                            onClick={(e) =>
                              handleColorButtonClick(e, product.id, color.name)
                            }
                            className="px-2 py-1 border rounded hover:bg-gray-100"
                            style={{ backgroundColor: color.color_code }}
                          >
                            {color.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <div>
                    <label>Quantity:</label>
                  </div>
                  <input
                    type="number"
                    value={quantityValue[product.id] || "0"}
                    onChange={(e) => handleQuantityChange(e, product.id)}
                    className="border rounded px-2 py-1 w-16 my-2"
                    min="0"
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
                        text: "This product is currently out of stock. Please check back later.",
                        confirmButtonColor: "#2563eb",
                      });
                      return;
                    }
                    if (!Number(quantityValue[product.id])) {
                      Swal.fire({
                        icon: "info",
                        title: "Select Quantity",
                        text: "Please enter a quantity before adding to cart.",
                        confirmButtonColor: "#2563eb",
                      });
                      return;
                    }
                    handleAddToCart(
                      product.id,
                      product.price, // Pass base price
                      product.shipping_amount,
                      product.slug, // 👈 pass slug here
                    );
                  }}
                  disabled={
                    product.stock_qty === 0 ||
                    !product.in_stock ||
                    !Number(quantityValue[product.id])
                  }
                  className={`flex items-center justify-center gap-2 w-full rounded-lg py-2 transition ${
                    product.stock_qty === 0 || !product.in_stock
                      ? "bg-gray-400 cursor-not-allowed"
                      : !Number(quantityValue[product.id])
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <ShoppingCart size={18} />
                  {product.stock_qty === 0 || !product.in_stock
                    ? "Out of Stock"
                    : "Add to Cart"}
                </button>
                {isLoggedIn ? (
                  <button
                    onClick={() => handleAddToWishlist(product.id)}
                    className={`flex items-center justify-center gap-2 w-full rounded-lg py-2 transition ${
                      wishlist.some((item) => item.product.id === product.id)
                        ? "bg-gray-400 text-white hover:bg-gray-500 border-none"
                        : "bg-red-600 text-white hover:bg-red-700 border-none"
                    }`}
                  >
                    <Heart size={18} />
                    {wishlist.some((item) => item.product.id === product.id)
                      ? "Remove from Wishlist"
                      : "Add to Wishlist"}
                  </button>
                ) : (
                  <></>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-12 py-2 rounded-full shadow-lg hover:bg-blue-700 transition"
        >
          ↑ Got To Top
        </button>
      )}
    </div>
  );
}
