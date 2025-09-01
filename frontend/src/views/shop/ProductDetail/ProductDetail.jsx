import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import apiInstance from "../../../utils/axios";
import ProductOptions from "./ProductOptions";
import RelatedProducts from "./RelatedProducts";

export default function ProductDetail() {
  const [product, setProduct] = useState({});
  const [mainImage, setMainImage] = useState("");
  const param = useParams();

  useEffect(() => {
    apiInstance.get(`products/${param.slug}/`).then((response) => {
      setProduct(response.data);
      setMainImage(response.data.image);
      console.log(response.data);
    });
  }, []);

  const allImages = [
    { id: "main", image: product.image },
    ...(product?.gallery || []),
  ];

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

            <p className="text-gray-700 mb-6">{product.brand}</p>

            {/* Product Options */}
            <ProductOptions product={product} setMainImage={setMainImage} />
          </div>
        </div>

        {/* Related Products */}
        <RelatedProducts related={product.related} />
      </div>
    </div>
  );
}
