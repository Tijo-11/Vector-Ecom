import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart } from "lucide-react";
import ProductsPlaceholder from "./ProductsPlaceHolder";
import Categories from "../category/Categories";
import apiInstance from "../../../utils/axios";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedColors, setSelectedColors] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});
  const [quantityValue, setQuantityValue] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiInstance.get(`products/`).then((response) => {
      setProducts(response.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    apiInstance.get(`category/`).then((response) => {
      setCategories(response.data);
    });
  }, []);

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

  if (loading) return <ProductsPlaceholder />;

  return (
    <div className="container p-6">
      <div className="bg-gray-100 py-4 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Your Destination for Timeless Treasures.
        </h1>
        <p className="text-lg text-gray-600">
          Because memories never go out of style.
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="sr-only">Products</h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
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
                {product.old_price && (
                  <p className="text-sm line-through text-gray-400">
                    ₹{product.old_price}
                  </p>
                )}
                <p className="mt-1 text-lg font-medium text-gray-900">
                  ₹{product.price}
                </p>
              </div>

              {product.rating && (
                <p className="mt-2 text-yellow-500 text-sm">
                  ⭐ {product.rating}
                </p>
              )}

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
                  <label>Quantity:</label>
                  <input
                    type="number"
                    onChange={(e) => handleQuantityChange(e, product.id)}
                    className="border rounded px-2 py-1 w-16"
                    min="1"
                  />
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-2">
                <button className="flex items-center justify-center gap-2 w-full rounded-lg bg-blue-600 text-white py-2 hover:bg-blue-700 transition">
                  <ShoppingCart size={18} /> Add to Cart
                </button>
                <button className="flex items-center justify-center gap-2 w-full rounded-lg border border-gray-300 py-2 hover:bg-gray-100 transition">
                  <Heart size={18} /> Add to Wishlist
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {categories && categories.length > 0 ? (
        <Categories categories={categories} />
      ) : null}
    </div>
  );
}
