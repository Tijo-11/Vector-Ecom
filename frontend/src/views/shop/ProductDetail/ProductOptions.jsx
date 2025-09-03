import { useState, useEffect } from "react";
import { ShoppingCart, Heart } from "lucide-react";
import apiInstance from "../../../utils/axios";
import Swal from "sweetalert2";

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

  useEffect(() => {
    if (product && product.id) {
      setColor(product.color || []);
      setSize(product.size || []);
      setSpecification(product.specification || []);
    }
  }, [product]);

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
    formData.append("user", user || ""); /// Fix: use user directly, as it is user_id
    formData.append("qty", qtyValue);
    formData.append("price", product.price);
    formData.append("shipping_amount", product.shipping_amount);
    formData.append("country", country || "Unknown");
    formData.append("size", sizeValue);
    formData.append("color", colorValue);
    formData.append("cart_id", cartId || "");

    try {
      const response = await apiInstance.post("cart/", formData);
      console.log(response.data);
      Toast.fire({
        icon: "success",
        title: response.data.message || "Added to cart",
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
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
        <button className="flex items-center justify-center gap-2 w-2/5 rounded-lg border border-gray-300 py-1.5 hover:bg-gray-100 transition">
          <Heart size={16} /> Wishlist
        </button>
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
