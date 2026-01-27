import { useState, useEffect, useContext } from "react";
import { ShoppingCart, Heart } from "lucide-react";
import apiInstance from "../../../utils/axios";
import Swal from "sweetalert2";
import { CartContext } from "../../../plugin/Context";
import CartId from "../ProductDetail/cartId.jsx";
import UserData from "../../../plugin/UserData.js";
import { addToWishlist } from "../../../plugin/addToWishlist";
import { useAuthStore } from "../../../store/auth";
import log from "loglevel";

export default function ProductOptions({
  product,
  setMainImage,
  country,
  user,
  cartId,
  isOutOfStock,
}) {
  const Toast = Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
  });

  const [color, setColor] = useState([]);
  const [size, setSize] = useState([]);
  const [specification, setSpecification] = useState([]);
  const [colorValue, setColorValue] = useState("No Color");
  const [sizeValue, setSizeValue] = useState("No Size");
  const [qtyValue, setQtyValue] = useState(1);
  const [cartCount, setCartCount] = useContext(CartContext);
  const [wishlist, setWishlist] = useState([]);
  const cart_id = CartId();
  const userData = UserData();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  // Fetch wishlist
  const fetchWishlist = async () => {
    if (!userData?.user_id) return;
    try {
      const response = await apiInstance.get(
        `customer/wishlist/${userData?.user_id}/`,
      );

      // Robust handling: support both direct array and paginated { results: [...] }
      const data = response.data;
      const wishlistItems = Array.isArray(data) ? data : data?.results || [];

      setWishlist(wishlistItems);
    } catch (error) {
      log.error("Error fetching wishlist:", error);
      setWishlist([]); // Ensure it's always an array even on error
    }
  };

  useEffect(() => {
    if (product && product.id) {
      setColor(product.color || []);
      setSize(product.size || []);
      setSpecification(product.specification || []);
    }
  }, [product]);

  useEffect(() => {
    if (userData?.user_id) {
      fetchWishlist();
    }
  }, [userData?.user_id]);

  const handleColorButtonClick = (colorName, colorImage) => {
    setColorValue(colorName);
    if (colorImage) setMainImage(colorImage);
  };

  const handleSizeButtonClick = (sizeName, sizeImage) => {
    setSizeValue(sizeName);
    if (sizeImage) setMainImage(sizeImage);
  };

  const handleQuantityChange = (event) => {
    setQtyValue(event.target.value);
  };

  // ✅ Updated Add to Cart with stock check
  const handleAddToCart = async () => {
    if (isOutOfStock) {
      Swal.fire({
        icon: "info",
        title: "Out of Stock",
        text: "This product is currently unavailable.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    const qty = Number(qtyValue || 0);
    if (qty <= 0) {
      Swal.fire({
        icon: "info",
        title: "Select Quantity",
        text: "Please enter a valid quantity before adding to cart.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    try {
      // 1️ Fetch product stock info
      const productRes = await apiInstance.get(`/products/${product.slug}/`);
      const stock_qty = productRes.data.stock_qty;

      // 2️ Get existing cart items
      const url = userData?.user_id
        ? `/cart-list/${cart_id}/${userData.user_id}/`
        : `/cart-list/${cart_id}/`;

      const cartRes = await apiInstance.get(url);
      const existingItem = cartRes.data.find(
        (item) => item.product.id === product.id,
      );
      const existingQty = existingItem ? existingItem.qty : 0;

      // 3️ Stock validation
      if (existingQty + qty > stock_qty) {
        Swal.fire({
          icon: "warning",
          title: "Insufficient Stock",
          text: `Only ${stock_qty} unit(s) of "${product.title}" available. You already have ${existingQty} in your cart.`,
          confirmButtonColor: "#2563eb",
        });
        return;
      }

      // 4️ Proceed to add to cart
      const formData = new FormData();
      formData.append("product", product.id);
      formData.append("user", user || "");
      formData.append("qty", qty);
      formData.append("price", product.price);
      formData.append("shipping_amount", product.shipping_amount);
      formData.append("country", country || "Unknown");
      formData.append("size", sizeValue);
      formData.append("color", colorValue);
      formData.append("cart_id", cartId || "");

      setCartCount((prev) => prev + qty); // optimistic update

      const response = await apiInstance.post("cart/", formData);

      Toast.fire({
        icon: "success",
        title: response.data.message || "Added to cart",
      });

      // 5️ Sync updated cart count
      const res = await apiInstance.get(url);
      const totalQty = res.data.reduce((sum, item) => sum + item.qty, 0);
      setCartCount(totalQty);
    } catch (error) {
      log.error("Error adding to cart:", error);
      setCartCount((prev) => Math.max(prev - qty, 0));
      Toast.fire({
        icon: "error",
        title: "Failed to add to cart",
      });
    }
  };

  const handleAddToWishlist = async (product_id) => {
    try {
      await addToWishlist(product_id, userData?.user_id);
      fetchWishlist();
    } catch (error) {
      console.log("Error updating wishlist:", error);
    }
  };

  // Safe check for wishlist membership (prevents crash if structure is unexpected)
  const isInWishlist =
    Array.isArray(wishlist) &&
    wishlist.some((item) => item?.product?.id === product.id);

  return (
    <div>
      {/* Features */}
      <h3 className="text-lg font-semibold mb-2">Key Features:</h3>
      <ul className="list-disc list-inside text-gray-700">
        {specification.length > 0 ? (
          specification.map((s, index) => (
            <li key={index}>
              {s.title}: {s.content}
            </li>
          ))
        ) : (
          <li>No specifications available.</li>
        )}
      </ul>

      {/* Color */}
      {color.length > 0 && (
        <>
          <h6 className="text-lg font-semibold mb-2">
            Color: <span>{colorValue}</span>
          </h6>
          <div className="flex gap-2 mb-4">
            {color.map((c, index) => (
              <button
                key={index}
                type="button"
                className="px-4 py-2 rounded-md hover:opacity-80 transition"
                style={{ backgroundColor: c.color_code }}
                onClick={() => handleColorButtonClick(c.name, c.image)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Size */}
      {size.length > 0 && (
        <>
          <h6 className="text-lg font-semibold mb-2">
            Size: <span>{sizeValue}</span>
          </h6>
          <div className="flex gap-2 mb-4">
            {size.map((s, index) => (
              <button
                key={index}
                type="button"
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition"
                onClick={() => handleSizeButtonClick(s.name, s.image)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Quantity */}
      <div className="mb-4">
        <label className="text-lg font-semibold mb-2">Quantity:</label>
        <input
          type="number"
          min="1"
          value={qtyValue}
          onChange={handleQuantityChange}
          disabled={isOutOfStock}
          className={`w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isOutOfStock ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
        />
      </div>

      {/* Buttons */}
      <div className="mt-4 flex flex-col gap-2">
        <button
          className={`flex items-center justify-center gap-2 w-2/5 rounded-lg py-1.5 transition ${
            isOutOfStock
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          <ShoppingCart size={16} />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>

        {isLoggedIn && (
          <button
            onClick={() => handleAddToWishlist(product.id)}
            disabled={isOutOfStock}
            className={`flex items-center justify-center gap-2 w-2/5 rounded-lg py-1.5 transition ${
              isInWishlist
                ? "bg-gray-400 text-white hover:bg-gray-500"
                : "bg-red-600 text-white hover:bg-red-700"
            } ${isOutOfStock ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <Heart size={16} />
            {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
          </button>
        )}
      </div>

      {/* Description */}
      <h3 className="text-lg font-semibold mb-2 mt-4">Description:</h3>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 max-w-full overflow-auto">
        {product.description ? (
          <p className="text-gray-700 whitespace-pre-line">
            {product.description}
          </p>
        ) : (
          <p className="text-gray-500">No description available.</p>
        )}
      </div>
    </div>
  );
}
