import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShoppingCart, Heart } from "lucide-react";
import ProductsPlaceholder from "./Products/ProductsPlaceHolder";
import Categories from "./category/Categories";
import apiInstance from "../../utils/axios";
import UserCountry from "./ProductDetail/UserCountry";
import UserData from "../../plugin/UserData";
import cartID from "./ProductDetail/cartId";
import Swal from "sweetalert2";
import log from "loglevel";

export default function Search() {
  const Toast = Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedColors, setSelectedColors] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({});
  const [quantityValue, setQuantityValue] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query");

  useEffect(() => {
    setLoading(true);
    apiInstance.get(`search/?query=${query}`).then((response) => {
      const initialQuantities = response.data.reduce(
        (acc, product) => ({
          ...acc,
          [product.id]: "0",
        }),
        {}
      );
      setProducts(response.data);
      setQuantityValue(initialQuantities);
      setLoading(false);
    });
  }, [query]);

  useEffect(() => {
    apiInstance.get(`category/`).then((response) => {
      setCategories(response.data);
    });
  }, []);
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      setShowScrollTop(scrollY > viewportHeight);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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

  const handleAddToCart = async (product_id, price, shipping_amount) => {
    const formData = new FormData();
    formData.append("product", product_id);
    formData.append("user", user?.user_id);
    formData.append("qty", quantityValue[product_id] || "0");
    formData.append("price", price);
    formData.append("shipping_amount", shipping_amount);
    formData.append("country", currentAddress?.country);
    formData.append("size", selectedSizes[product_id] || "");
    formData.append("color", selectedColors[product_id] || "");
    formData.append("cart_id", cart_id);

    const response = await apiInstance.post(`cart/`, formData);
    log.debug(response.data);
    Toast.fire({
      icon: "success",
      title: response.data.message || "Added to cart",
    });
  };
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "auto" }); // Instant scroll
  };

  if (loading) return <ProductsPlaceholder />;

  return (
    <div className="container mx-auto my-8 ">
      <div className="bg-yellow-100 py-8 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Your Destination for Timeless Treasures.
        </h1>
        <p className="text-lg text-gray-600">
          Because memories never go out of style.
        </p>
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
                  disabled={!Number(quantityValue[product.id])}
                  onClick={() =>
                    handleAddToCart(
                      product.id,
                      product.price,
                      product.shipping_amount
                    )
                  }
                  className={`flex items-center justify-center gap-2 w-full rounded-lg py-2 transition ${
                    !Number(quantityValue[product.id])
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
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
