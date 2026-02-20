import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import apiInstance from "../../../utils/axios";
import ProductOptions from "./ProductOptions";
import RelatedProducts from "./RelatedProducts";
import UserCountry from "./UserCountry";
import UserData from "../../../plugin/UserData";
import CartId from "./CartId";
import Review from "./Review";
import Swal from "sweetalert2";
import log from "loglevel";
import StarRating from "../Products/StarRating";
import { addToWishlist } from "../../../plugin/addToWishlist";
import { useAuthStore } from "../../../store/auth";
import {
  ChevronRight,
  Star,
  Truck,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export default function ProductDetail() {
  const [product, setProduct] = useState({});
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [mainImage, setMainImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("description"); // description, specs, reviews
  const [wishlist, setWishlist] = useState([]);

  const param = useParams();
  const currentAddress = UserCountry();
  const userData = UserData();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const cartId = CartId();

  const fetchWishlist = async () => {
    if (!userData?.user_id) return;
    try {
      const response = await apiInstance.get(
        `customer/wishlist/${userData?.user_id}/`,
      );
      const wishlistItems = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setWishlist(wishlistItems);
    } catch (error) {
      log.error("Error fetching wishlist:", error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchWishlist();
  }, [isLoggedIn, userData?.user_id]);

  useEffect(() => {
    setLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    apiInstance
      .get(`products/${param.slug}/`)
      .then((response) => {
        setProduct(response.data);
        setMainImage(response.data.image || "");

        // Fetch related products if category exists
        if (response.data?.category?.slug) {
          apiInstance
            .get(`products/?category=${response.data.category.slug}`)
            .then((res) => {
              const allProds = res.data.results || [];
              const filtered = allProds
                .filter((p) => p.id !== response.data.id)
                .slice(0, 4);
              setRelatedProducts(filtered);
            })
            .catch((err) => log.error("Error fetching related:", err));
        }
      })
      .catch((error) => {
        console.error("Error fetching product:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [param.slug]);

  const allImages = [
    { id: "main", image: product.image },
    ...(product?.gallery || []),
  ].filter((item) => item.image);

  const isOutOfStock = product.stock_qty === 0 || !product.in_stock;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Loading details...</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen font-sans pb-12">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center text-sm text-gray-500">
            <Link to="/" className="hover:text-blue-600">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link to="/products" className="hover:text-blue-600">
              Shop
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            {product.category && (
              <>
                <Link
                  to={`/category/${product.category.slug}`}
                  className="hover:text-blue-600"
                >
                  {product.category.title}
                </Link>
                <ChevronRight className="h-4 w-4 mx-2" />
              </>
            )}
            <span className="text-gray-900 font-medium truncate max-w-xs">
              {product.title}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Image Gallery */}
          <div className="flex flex-col">
            <div className="relative aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden shadow-sm mb-4">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.title}
                  className="w-full h-full object-contain hover:scale-110 transition-transform duration-500 cursor-zoom-in"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No Image
                </div>
              )}
              {product.offer_discount > 0 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white font-bold px-3 py-1 rounded-full shadow-lg">
                  -{product.offer_discount}%
                </span>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMainImage(img.image)}
                    className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      mainImage === img.image
                        ? "border-blue-600 ring-2 ring-blue-100"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.image}
                      alt="thumb"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
              {product.title}
            </h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <StarRating rating={product.rating} />
              </div>
              <span className="text-sm text-gray-500 border-l pl-4 border-gray-300">
                {product.rating_count || 0} Reviews
              </span>
              <span
                className={`text-sm font-medium px-2 py-0.5 rounded ${isOutOfStock ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
              >
                {isOutOfStock ? "Out of Stock" : "In Stock"}
              </span>
            </div>

            <div className="flex items-end gap-3 mb-6">
              {product.offer_discount > 0 ? (
                <>
                  <span className="text-4xl font-bold text-gray-900">
                    ₹
                    {(
                      product.price *
                      (1 - product.offer_discount / 100)
                    ).toFixed(2)}
                  </span>
                  <span className="text-xl text-gray-400 line-through mb-1">
                    ₹{product.price}
                  </span>
                </>
              ) : (
                <span className="text-4xl font-bold text-gray-900">
                  ₹{product.price}
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-gray-600 mb-8 line-clamp-3 leading-relaxed">
                {product.description.substring(0, 150)}...
                <button
                  onClick={() => setActiveTab("description")}
                  className="text-blue-600 hover:underline text-sm ml-1 font-medium"
                >
                  Read more
                </button>
              </p>
            )}

            {/* Purchase Options Component */}
            <ProductOptions
              product={product}
              setMainImage={setMainImage}
              country={currentAddress.country}
              user={userData?.user_id}
              cartId={cartId}
              isOutOfStock={isOutOfStock}
              wishlist={wishlist}
              onWishlistUpdate={fetchWishlist}
              isLoggedIn={isLoggedIn}
            />

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-100">
              <div className="flex flex-col items-center text-center">
                <Truck className="h-6 w-6 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500 font-medium">
                  Fast Shipping
                </span>
              </div>
              <div className="flex flex-col items-center text-center">
                <ShieldCheck className="h-6 w-6 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500 font-medium">
                  Authentic
                </span>
              </div>
              <div className="flex flex-col items-center text-center">
                <RefreshCw className="h-6 w-6 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500 font-medium">
                  Easy Returns
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-20">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8">
              {["description", "specification", "reviews"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 text-sm font-bold uppercase tracking-wide transition-colors border-b-2 ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {activeTab === "description" && (
              <div className="prose max-w-none text-gray-700">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Product Description
                </h3>
                <p className="whitespace-pre-line leading-relaxed">
                  {product.description || "No description available."}
                </p>
              </div>
            )}
            {activeTab === "specification" && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Technical Specifications
                </h3>
                {product.specification && product.specification.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                      {product.specification.map((spec, idx) => (
                        <div
                          key={idx}
                          className="flex border-b border-gray-200 pb-2"
                        >
                          <dt className="font-semibold text-gray-900 w-1/3">
                            {spec.title}
                          </dt>
                          <dd className="text-gray-600 w-2/3">
                            {spec.content}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : (
                  <p className="text-gray-500">No specifications found.</p>
                )}
              </div>
            )}
            {activeTab === "reviews" && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Customer Reviews
                </h3>
                <Review product={product} userData={userData} />
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-12 border-t border-gray-200 pt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            You May Also Like
          </h2>
          {relatedProducts.length > 0 ? (
            <RelatedProducts
              products={relatedProducts}
              wishlist={wishlist}
              onWishlistUpdate={fetchWishlist}
              isLoggedIn={isLoggedIn}
            />
          ) : (
            <p className="text-gray-500">No related products found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
