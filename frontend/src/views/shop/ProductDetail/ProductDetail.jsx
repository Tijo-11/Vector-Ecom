import { useState, useEffect } from "react";
import { ShoppingCart, Heart } from "lucide-react";
import { useParams } from "react-router-dom";
// Enables reading dynamic route params like /product/:slug
import apiInstance from "../../../utils/axios";
import ProductDetailPlaceholder from "./ProductDetailPlaceHolder";

export default function ProductDetail() {
  const [product, setProduct] = useState({});
  const [loading, setLoading] = useState(false);
  const [mainImage, setMainImage] = useState("");
  const param = useParams();
  const [colorValue, setColorValue] = useState("No Color");
  const [colorImage, setColorImage] = useState("image-url.jpg");
  const [size, setSize] = useState([]);
  const [color, setColor] = useState(["Green"]);
  const [sizeValue, setSizeValue] = useState("No Size");
  const [qtyValue, setQtyValue] = useState(1);
  useEffect(() => {
    setLoading(true);
    apiInstance.get(`products/${param.slug}/`).then((response) => {
      setProduct(response.data);
      setMainImage(response.data.image);
      setColor(response.data.color);
      setSize(response.data.size);
      console.log(response.data);
      setLoading(false);
    });
  }, []);
  const allImages = [
    { id: "main", image: product.image }, // Adds main image with a manual id to match gallery format
    ...(product?.gallery || []), // Merges gallery images if available; ensures fallback to empty array
  ];
  if (loading) {
    return <ProductDetailPlaceholder />; // render placeholder while loading
  }

  return (
    <div className="bg-gray-100">
      <div className="container mx-auto px-4 py-8 ml-24">
        <div className="flex flex-wrap -mx-4">
          {/* Product Images */}
          <div className="w-full md:w-1/2 px-4 mb-8">
            {mainImage && (
              <img
                src={mainImage}
                alt="Product"
                className="w-full h-auto rounded-lg shadow-md mb-4"
              />
            )}
            <div className="flex gap-4 py-4 justify-center overflow-x-auto">
              {allImages.map((item) => (
                <img
                  key={item.id}
                  src={item.image}
                  alt={`Thumbnail ${item.id}`}
                  onClick={() => setMainImage(item.image)}
                  className={`size-16 sm:size-20 object-cover rounded-md cursor-pointer transition duration-300 ${
                    mainImage === item.image ? "opacity-100" : "opacity-60"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="w-full md:w-1/2 px-4">
            <h2 className="text-3xl font-bold mb-2">{product.title}</h2>
            <p className="text-gray-600 mb-4">SKU: {product.sku}</p>
            <div className="mb-4">
              <span className="text-2xl font-bold mr-2">₹{product.price}</span>
              <span className="text-gray-500 line-through">
                ₹{product.old_price}
              </span>
            </div>

            {/* Rating */}
            <div className="flex items-center mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={
                    i < Math.floor(product.rating) ? "currentColor" : "none"
                  }
                  stroke="currentColor"
                  className="size-6 text-yellow-500"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 
                    2.424 0l2.082 5.006 5.404.434c1.164.093 
                    1.636 1.545.749 2.305l-4.117 3.527 
                    1.257 5.273c.271 1.136-.964 2.033-1.96 
                    1.425L12 18.354 7.373 21.18c-.996.608-2.231
                    -.29-1.96-1.425l1.257-5.273-4.117-3.527c
                    -.887-.76-.415-2.212.749-2.305l5.404-.434 
                    2.082-5.005Z"
                    clipRule="evenodd"
                  />
                </svg>
              ))}
              <span className="ml-2 text-gray-600">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Key Features:</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4">
                <li>Category: {product.category?.title}</li>
                <li>Brand: {product.brand}</li>
              </ul>
              <hr />
              <div>
                <div className="flex flex-col">
                  {/* Quantity */}
                  <div className="w-full md:w-1/2 mb-4">
                    <div className="mb-2">
                      <label
                        className="block text-sm font-medium"
                        htmlFor="typeNumber"
                      >
                        <b>Quantity</b>
                      </label>
                      <input
                        type="number"
                        id="typeNumber"
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 quantity"
                        min={1}
                        value={qtyValue}
                        onChange={handleQuantityChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Size */}
              {size?.length > 0 ? (
                // Render something when the 'size' array has items
                <div className="w-full md:w-1/2 mb-4">
                  <div className="mb-2">
                    <label
                      className="block text-sm font-medium"
                      htmlFor="typeNumber"
                    >
                      <b>Size:</b> {sizeValue}
                    </label>
                  </div>
                  <div className="flex">
                    {size?.map((s, index) => (
                      <div key={index} className="mr-2">
                        <input
                          type="hidden"
                          className="size_name"
                          value={s.name}
                        />
                        <button
                          onClick={handleSizeButtonClick}
                          className="px-4 py-2 bg-gray-600 text-white rounded size_button"
                        >
                          {s.name}
                        </button>
                      </div>
                    ))}
                    {/* Colors */}
                    {color?.length > 0 ? (
                      <div className="w-full md:w-1/2 mb-4">
                        <div className="mb-2">
                          <label
                            className="block text-sm font-medium"
                            htmlFor="typeNumber"
                          >
                            <b>Color:</b> <span>{colorValue}</span>
                          </label>
                        </div>
                        <div className="flex">
                          {color?.map((c, index) => (
                            <div key={index}>
                              <input
                                type="hidden"
                                className="color_name"
                                value={c.name}
                              />
                              <input
                                type="hidden"
                                className="color_image"
                                value={c.image}
                              />
                              <button
                                className="p-3 mr-2 rounded color_button"
                                onClick={handleColorButtonClick}
                                style={{ backgroundColor: `${c.color_code}` }}
                              ></button>
                            </div>
                          ))}
                        </div>
                        <hr className="my-4 border-gray-300" />
                      </div>
                    ) : (
                      // Render empty div
                      <div></div>
                    )}
                  </div>
                </div>
              ) : (
                // Render empty div
                <div></div>
              )}

              <div className="mt-4 flex flex-col gap-2">
                <button className="flex items-center justify-center gap-2 w-2/5 rounded-lg bg-blue-600 text-white py-1.5 hover:bg-blue-700 transition">
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
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-12">
          <h3 className="text-2xl font-semibold mb-6">Related Products</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* {product.related.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <h4 className="font-semibold">{item.name}</h4>
                  <p className="text-gray-600">{item.price}</p>
                </div>
              </div>
            ))} */}
          </div>
        </div>
      </div>
    </div>
  );
}
