import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart } from "lucide-react";
import ProductsPlaceholder from "./ProductsPlaceHolder";
import apiInstance from "../../../utils/axios";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
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
    // console.log(products);
  }, []); //empty dependence array means useEffect runs once

  useEffect(() => {
    apiInstance.get(`category/`).then((response) => {
      setCategories(response.data);
      console.log(response.data);
    });
  }, []);

  if (loading) {
    return <ProductsPlaceholder />; // render placeholder while loading
  }
  return (
    <div className="container p-6">
      <div className="bg-gray-100 py-4 text-center">
        {/*  vertical padding (py-16 → 4rem top & bottom),centered text alignment (text-center)*/}
        <h1 className="text-4xl font-bold mb-4">
          Your Destination for Timeless Treasures.
        </h1>
        <p className="text-lg text-gray-600 ">
          Because memories never go out of style.
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="sr-only">Products</h2>

        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
          {products?.map((product) => (
            <div
              key={product.id} // Unique key for React list rendering
              className="group flex flex-col h-full"
            >
              <Link to={`/product/${product.slug}`}>
                {/*  Link to product detail page using slug */}
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

              {/* Category */}
              {product.category && (
                <p className="text-sm text-gray-500">
                  Category: {product.category.title}
                </p>
              )}

              {/* New Buttons */}
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
        <div className="mt-6 ml-8">
          <h2 className="text-xl font-bold mb-4">Categories</h2>

          {/* Netflix-style horizontal scroll */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex-shrink-0 w-40 cursor-pointer group"
              >
                <div className="relative h-24 w-40 rounded-lg overflow-hidden">
                  <Link to={`\products/${cat.slug}`}>
                    <img
                      src={cat.image}
                      alt={cat.title}
                      className="h-full w-full  transition-transform duration-300 group-hover:scale-105"
                    />
                  </Link>
                </div>
                <p className="mt-2 text-sm font-medium text-gray-700 text-center">
                  {cat.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
