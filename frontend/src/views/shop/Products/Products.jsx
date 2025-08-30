import { useState, useEffect } from "react";
import { ShoppingCart, Heart } from "lucide-react";
import ProductsPlaceholder from "./ProductsPlaceHolder";
import apiInstance from "../../../utils/axios";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  // useState([]) returns [stateValue, setStateFunction]
  // Destructuring assigns: products = stateValue, setProducts = updater function
  useEffect(() => {
    setLoading(true); // start loading before API call
    apiInstance.get(`products/`).then((response) => {
      // apiInstance.get(...) returns a Promise, so .then() handles its result
      // .then() is a method of a Promise object
      // .then() handles the response asynchronously once data is received
      // It registers a callback to run when the Promise resolves successfully
      setProducts(response.data);
      setLoading(false); // stop loading after data is fetched
    });
  }, []); //empty dependence array means useEffect runs once
  console.log(products);

  if (loading) {
    return <ProductsPlaceholder />; // render placeholder while loading
  }
  return (
    <div className="container p-6">
      <h1 className="text-5xl text-center font-bold mb-10">Products</h1>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="sr-only">Products</h2>

        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
          {products?.map((product) => (
            <a
              key={product.id}
              href={`/product/${product.slug}`}
              className="group"
            >
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-64 rounded-lg bg-gray-200 object-contain group-hover:opacity-75"
              />
              <h3 className="mt-4 text-sm text-gray-700">{product.title}</h3>

              <div className="flex items-center gap-2">
                {product.old_price && (
                  <p className="text-sm line-through text-gray-400">
                    ${product.old_price}
                  </p>
                )}
                <p className="mt-1 text-lg font-medium text-gray-900">
                  ${product.price}
                </p>
              </div>

              {product.rating && (
                <p className="mt-2 text-yellow-500 text-sm">
                  ⭐ {product.rating}
                </p>
              )}
              {/* New Buttons */}
              <div className="mt-4 flex flex-col gap-2">
                <button className="flex items-center justify-center gap-2 w-full rounded-lg bg-blue-600 text-white py-2 hover:bg-blue-700 transition">
                  <ShoppingCart size={18} /> Add to Cart
                </button>
                <button className="flex items-center justify-center gap-2 w-full rounded-lg border border-gray-300 py-2 hover:bg-gray-100 transition">
                  <Heart size={18} /> Add to Wishlist
                </button>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
