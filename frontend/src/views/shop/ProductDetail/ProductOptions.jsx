import { useState, useEffect, useContext } from "react";
import { ShoppingCart, Heart } from "lucide-react";
import apiInstance from "../../../utils/axios";
import Swal from "sweetalert2";
import { CartContext } from "../../../plugin/Context";
import CartId from "../ProductDetail/cartId.jsx";
import UserData from "../../../plugin/UserData.js";
import { addToWishlist } from "../../../plugin/addToWishlist";
import { useAuthStore } from "../../../store/auth";

export default function ProductOptions({
  product,
  setMainImage,
  country,
  user,
  cartId,
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
        `customer/wishlist/${userData?.user_id}/`
      );
      setWishlist(response.data);
    } catch (error) {
      console.log("Error fetching wishlist:", error);
    }
  };

  useEffect(() => {
    if (product && product.id) {
      setColor(product.color || []);
      setSize(product.size || []);
      setSpecification(product.specification || []);
    }
  }, [product]);

  // Fetch wishlist on component mount if user is logged in
  useEffect(() => {
    if (userData?.user_id) {
      fetchWishlist();
    }
  }, [userData?.user_id]);

  const handleColorButtonClick = (colorName, colorImage) => {
    setColorValue(colorName);
    if (colorImage) {
      setMainImage(colorImage);
    }
  };

  const handleSizeButtonClick = (sizeName, sizeImage) => {
    setSizeValue(sizeName);
    if (sizeImage) {
      setMainImage(sizeImage);
    }
  };

  const handleQuantityChange = (event) => {
    setQtyValue(event.target.value);
  };

  const handleAddToCart = async () => {
    const formData = new FormData();
    formData.append("product", product.id);
    formData.append("user", user || "");
    formData.append("qty", qtyValue);
    formData.append("price", product.price);
    formData.append("shipping_amount", product.shipping_amount);
    formData.append("country", country || "Unknown");
    formData.append("size", sizeValue);
    formData.append("color", colorValue);
    formData.append("cart_id", cartId || "");

    // Optimistic update
    setCartCount((prev) => prev + Number(qtyValue));

    try {
      const response = await apiInstance.post("cart/", formData);
      Toast.fire({
        icon: "success",
        title: response.data.message || "Added to cart",
      });

      // Sync with backend
      const cart_id = CartId();
      const userData = UserData();

      const url = userData?.user_id
        ? `/cart-list/${cart_id}/${userData.user_id}/`
        : `/cart-list/${cart_id}/`;

      const res = await apiInstance.get(url);

      const totalQty = res.data.reduce((sum, item) => sum + item.qty, 0);
      setCartCount(totalQty);
    } catch (error) {
      console.error("Error adding to cart:", error);

      // Rollback optimistic update
      setCartCount((prev) => Math.max(prev - Number(qtyValue), 0));

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
      console.log("Error updating wishlist:", error);
    }
  };

  return (
    <div>
      {/* Features (Specifications) */}
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

      {/* Color Selection */}
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

      {/* Size Selection */}
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

      {/* Quantity Input */}
      <div className="mb-4">
        <label className="text-lg font-semibold mb-2">Quantity:</label>
        <input
          type="number"
          min="1"
          value={qtyValue}
          onChange={handleQuantityChange}
          className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <button
          className="flex items-center justify-center gap-2 w-2/5 rounded-lg bg-blue-600 text-white py-1.5 hover:bg-blue-700 transition"
          onClick={handleAddToCart}
        >
          <ShoppingCart size={16} /> Add
        </button>
        {isLoggedIn ? (
          <button
            onClick={() => handleAddToWishlist(product.id)}
            className={`flex items-center justify-center gap-2 w-2/5 rounded-lg py-1.5 transition ${
              wishlist.some((item) => item.product.id === product.id)
                ? "bg-gray-400 text-white hover:bg-gray-500 border-none"
                : "bg-red-600 text-white hover:bg-red-700 border-none"
            }`}
          >
            <Heart size={16} />
            {wishlist.some((item) => item.product.id === product.id)
              ? "Remove from Wishlist"
              : "Add to Wishlist"}
          </button>
        ) : null}
      </div>

      <h3 className="text-lg font-semibold mb-2">Description:</h3>
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
