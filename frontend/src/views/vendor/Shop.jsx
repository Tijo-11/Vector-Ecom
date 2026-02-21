import { useEffect, useState, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle, ShoppingCart, Loader2, Heart } from "lucide-react";

import apiInstance from "../../utils/axios";
import { CartContext } from "../../plugin/Context";
import { addToWishlist } from "../../plugin/addToWishlist";
import { addToCart } from "../../plugin/AddToCart";
import CartID from "../shop
import GetCurrentAddress from "../shop/ProductDetail/UserCountry";
import UserData from "../../plugin/UserData";
import log from "loglevel";

function Shop() {
  const [products, setProduct] = useState([]);
  const [vendor, setVendor] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedColors, setSelectedColors] = useState({});
  const [selectedSize, setSelectedSize] = useState({});
  const [colorImage, setColorImage] = useState("");
  const [colorValue, setColorValue] = useState("No Color");
  const [sizeValue, setSizeValue] = useState("No Size");
  const [qtyValue, setQtyValue] = useState(1);
  let [cartCount, setCartCount] = useContext(CartContext);

  let [isAddingToCart, setIsAddingToCart] = useState("Add To Cart");
  const [loadingStates, setLoadingStates] = useState({});

  const axios = apiInstance;
  const currentAddress = GetCurrentAddress();
  const userData = UserData();
  let cart_id = CartID();
  const param = useParams();

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  useEffect(() => {
    axios.get(`vendor-products/${param?.slug}/`).then((res) => {
      setProduct(res.data);
    });
  }, [param]);

  useEffect(() => {
    axios.get(`shop/${param?.slug}/`).then((res) => {
      setVendor(res.data);
    });
  }, [param]);

  const handleColorButtonClick = (e, product_id, colorName, colorImg) => {
    setColorValue(colorName);
    setColorImage(colorImg);
    setSelectedProduct(product_id);

    setSelectedColors((prev) => ({
      ...prev,
      [product_id]: colorName,
    }));
  };

  const handleSizeButtonClick = (e, product_id, sizeName) => {
    setSizeValue(sizeName);
    setSelectedProduct(product_id);

    setSelectedSize((prev) => ({
      ...prev,
      [product_id]: sizeName,
    }));
  };

  const handleQtyChange = (e, product_id) => {
    setQtyValue(e.target.value);
    setSelectedProduct(product_id);
  };

  const handleAddToCart = async (product_id, price, shipping_amount) => {
    setLoadingStates((prev) => ({
      ...prev,
      [product_id]: "Adding...",
    }));

    try {
      await addToCart(
        product_id,
        userData?.user_id,
        qtyValue,
        price,
        shipping_amount,
        currentAddress.country,
        colorValue,
        sizeValue,
        cart_id,
        setIsAddingToCart,
      );

      setLoadingStates((prev) => ({
        ...prev,
        [product_id]: "Added to Cart",
      }));

      setColorValue("No Color");
      setSizeValue("No Size");
      setQtyValue(1);

      const url = userData?.user_id
        ? `cart-list/${cart_id}/${userData?.user_id}/`
        : `cart-list/${cart_id}/`;
      const response = await axios.get(url);

      setCartCount(response.data.length);
    } catch (error) {
      log.error(error);
      setLoadingStates((prev) => ({
        ...prev,
        [product_id]: "Add to Cart",
      }));
    }
  };

  const handleAddToWishlist = async (product_id) => {
    try {
      await addToWishlist(product_id, userData?.user_id);
    } catch (error) {
      log.error(error);
    }
  };

  return (
    <main className="mt-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Vendor Info */}
        <section className="text-center py-10">
          <img
            src={vendor.image}
            alt={vendor.name}
            className="w-24 h-24 mx-auto rounded-full object-cover"
          />
          <h1 className="text-2xl font-semibold mt-4">{vendor.name}</h1>
          <p className="text-gray-600">{vendor.description}</p>
        </section>

        {/* Products */}
        <section className="text-center">
          <h4 className="mb-6 text-lg font-medium">
            {products?.length} Product(s)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product?.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 flex flex-col"
              >
                <Link to={`/detail/${product?.slug}`}>
                  <img
                    src={
                      selectedProduct === product?.id && colorImage
                        ? colorImage
                        : product.image
                    }
                    alt={product?.title}
                    className="w-full h-72 object-cover rounded-md"
                  />
                </Link>

                <div className="mt-4 flex-1">
                  <Link
                    to={`/detail/${product.slug}`}
                    className="block text-lg font-medium text-gray-800 hover:text-blue-600"
                  >
                    {product?.title.slice(0, 30)}...
                  </Link>
                  <p className="text-sm text-gray-500">
                    {product?.brand?.title}
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    {product.offer_discount > 0 ? (
                      <>
                        <h6 className="text-lg font-semibold text-blue-600">
                          ₹
                          {(
                            product.price *
                            (1 - product.offer_discount / 100)
                          ).toFixed(2)}
                        </h6>
                        <span className="text-sm text-gray-400 line-through">
                          ₹{product.price}
                        </span>
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                          -{product.offer_discount}%
                        </span>
                      </>
                    ) : (
                      <h6 className="text-lg font-semibold">
                        ₹{product.price}
                      </h6>
                    )}
                  </div>

                  {/* Variations */}
                  {(product.color?.length > 0 || product.size?.length > 0) && (
                    <div className="mt-3 space-y-3 text-left">
                      {/* Quantity */}
                      <input
                        type="number"
                        min={1}
                        defaultValue={1}
                        onChange={(e) => handleQtyChange(e, product.id)}
                        className="w-24 border rounded px-2 py-1 text-sm"
                      />

                      {/* Size */}
                      {product.size?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">
                            Size: {selectedSize[product.id] || "Select"}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {product.size.map((size) => (
                              <button
                                key={size.id}
                                onClick={(e) =>
                                  handleSizeButtonClick(
                                    e,
                                    product.id,
                                    size.name,
                                  )
                                }
                                className="px-2 py-1 border rounded text-sm hover:bg-gray-100"
                              >
                                {size.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Color */}
                      {product.color?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">
                            Color: {selectedColors[product.id] || "Select"}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {product.color.map((color) => (
                              <button
                                key={color.id}
                                onClick={(e) =>
                                  handleColorButtonClick(
                                    e,
                                    product.id,
                                    color.name,
                                    color.image,
                                  )
                                }
                                className="w-8 h-8 rounded-full border"
                                style={{
                                  backgroundColor: color.color_code,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() =>
                      handleAddToCart(
                        product.id,
                        product.price,
                        product.shipping_amount,
                      )
                    }
                    disabled={loadingStates[product.id] === "Adding..."}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 w-full"
                  >
                    {loadingStates[product.id] === "Added to Cart" ? (
                      <>
                        Added <CheckCircle size={18} />
                      </>
                    ) : loadingStates[product.id] === "Adding..." ? (
                      <>
                        Adding <Loader2 size={18} className="animate-spin" />
                      </>
                    ) : (
                      <>
                        {loadingStates[product.id] || "Add to Cart"}{" "}
                        <ShoppingCart size={18} />
                      </>
                    )}
                  </button>

                  {/* Wishlist */}
                  <button
                    onClick={() => handleAddToWishlist(product.id)}
                    className="p-2 rounded-md border border-gray-300 hover:bg-red-50 hover:text-red-500 transition"
                  >
                    <Heart size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default Shop;
