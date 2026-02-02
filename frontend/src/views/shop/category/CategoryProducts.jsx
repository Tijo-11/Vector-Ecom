import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import ProductsPlaceholder from "../Products/ProductsPlaceHolder";
import apiInstance from "../../../utils/axios";
import UserData from "../../../plugin/UserData";
import { useAuthStore } from "../../../store/auth";
import log from "loglevel";
import ProductCard from "../Products/ProductCard";
import { Filter, ShoppingBag, ArrowLeft } from "lucide-react";

const PAGE_SIZE = 12;

export default function CategoryProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  
  const { slug } = useParams();
  const navigate = useNavigate();
  const userData = UserData();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  // Reset page when slug changes
  useEffect(() => {
    setCurrentPage(1);
  }, [slug]);

  const fetchWishlist = async () => {
    if (!userData?.user_id) return;
    try {
      const response = await apiInstance.get(`customer/wishlist/${userData?.user_id}/`);
      const wishlistItems = Array.isArray(response.data)
        ? response.data
        : response.data.results || response.data.wishlist_items || [];
      setWishlist(wishlistItems);
    } catch (error) {
      log.error("Error fetching wishlist:", error);
    }
  };

  useEffect(() => {
    const fetchCats = async () => {
        try {
            const res = await apiInstance.get(`category/`);
            const catList = Array.isArray(res.data) ? res.data : res.data.results || [];
            setCategories(catList);
            const cat = catList.find(c => c.slug === slug);
            setCurrentCategory(cat || null);
        } catch (err) {
            log.error(err);
        }
    };
    fetchCats();
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", currentPage);
    if (slug) params.append("category", slug);

    apiInstance.get(`products/?${params.toString()}`)
      .then((res) => {
        setProducts(res.data.results || []);
        setTotalCount(res.data.count || 0);
      })
      .catch((err) => {
        log.error("Error fetching products:", err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [currentPage, slug]);

  useEffect(() => {
     if (isLoggedIn) fetchWishlist();
  }, [isLoggedIn, userData?.user_id]);

  const pageTitle = currentCategory ? currentCategory.title : "Category";
  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-12">
      
      {/* Dynamic Banner */}
      <div className="bg-gradient-to-r from-yellow-300/10 to-orange-100 py-12 text-center border-b border-yellow-100">
        <h1 className="text-4xl font-extrabold mb-4 text-gray-900">{pageTitle}</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {currentCategory
            ? `Explore our handpicked collection of ${currentCategory.title}.`
            : "Discover timeless treasures."}
        </p>

        {currentCategory?.offer_discount > 0 && (
          <div className="mt-6 inline-block bg-white px-6 py-3 rounded-xl shadow-md border border-red-100">
            <span className="text-gray-900 font-bold mr-2">Special Offer:</span>
            <span className="text-red-600 font-bold animate-pulse text-lg">
              flat {currentCategory.offer_discount}% OFF on all items!
            </span>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0">
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-24">
                 <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-5 w-5 text-gray-700" />
                  <h2 className="font-bold text-gray-900">Explore Categories</h2>
                </div>
                
                <div className="space-y-1">
                    <Link 
                        to="/products"
                        className="flex items-center gap-2 px-2 py-2 rounded text-gray-600 hover:bg-gray-50 text-sm mb-2 font-medium"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to All Products
                    </Link>
                    {categories.map(cat => (
                         <Link
                           key={cat.id}
                           to={`/category/${cat.slug}`}
                           className={`w-full text-left px-2 py-1.5 rounded transition-colors text-sm flex items-center justify-between group ${
                             slug === cat.slug 
                               ? "bg-blue-50 text-blue-700 font-medium" 
                               : "text-gray-600 hover:bg-gray-50"
                           }`}
                         >
                            <span>{cat.title}</span>
                         </Link>
                      ))}
                </div>
             </div>
          </aside>

          {/* Main Grid */}
          <div className="flex-1">
            {loading ? (
                <ProductsPlaceholder />
             ) : products.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map(product => (
                       <ProductCard 
                          key={product.id} 
                          product={product} 
                          wishlist={wishlist}
                          onWishlistUpdate={fetchWishlist}
                          isLoggedIn={isLoggedIn}
                       />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-12 gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          currentPage === 1 
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" 
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        Previous
                      </button>
                      <span className="px-4 text-sm font-medium text-gray-700">Page {currentPage} of {totalPages}</span>
                      <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          currentPage === totalPages 
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" 
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
             ) : (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
                   <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <ShoppingBag className="h-8 w-8 text-gray-400" />
                   </div>
                   <h3 className="text-lg font-bold text-gray-900">No products found</h3>
                   <p className="text-gray-500 mt-2">There appear to be no products in this category yet.</p>
                   <Link 
                      to="/products"
                      className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                   >
                      Browse All Products
                   </Link>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
