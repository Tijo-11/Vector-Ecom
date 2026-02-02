import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiInstance from "../../utils/axios";
import { 
  ArrowRight, Star, Truck, ShieldCheck, Clock, 
  MapPin, ChevronRight, ShoppingBag
} from "lucide-react";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          apiInstance.get(`products/?page=1`), // Fetch first page
          apiInstance.get(`category/`)
        ]);
        setProducts(prodRes.data.results?.slice(0, 8) || []); // Limit to 8
        setCategories(catRes.data?.slice(0, 6) || []); // Limit to 6
      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white min-h-screen font-sans">
      
      {/* Hero Section */}
      <div className="relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550948537-130a1ce83314?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 drop-shadow-lg">
            Rediscover the <span className="text-blue-400">Past</span>.<br/>
            Relive the <span className="text-purple-400">Memories</span>.
          </h1>
          <p className="max-w-2xl text-lg md:text-xl text-gray-300 mb-10 leading-relaxed">
            Your destination for authentic vintage treasures. From retro cameras to classic vinyls, find the pieces that tell a story.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/products"
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-blue-500/30"
            >
              Shop Collection <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              to="/category"
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-gray-900 bg-white rounded-full hover:bg-gray-50 transition-all transform hover:-translate-y-1 shadow-lg"
            >
              Explore Categories
            </Link>
          </div>
        </div>
      </div>

      {/* Features Stripe */}
      <div className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="p-3 bg-blue-50 rounded-full text-blue-600 mb-4">
                <Truck className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Worldwide Shipping</h3>
              <p className="text-sm text-gray-500">Secure delivery to your doorstep.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-3 bg-green-50 rounded-full text-green-600 mb-4">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Authentic Guarantee</h3>
              <p className="text-sm text-gray-500">Every item verified by experts.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-3 bg-purple-50 rounded-full text-purple-600 mb-4">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Timeless Value</h3>
              <p className="text-sm text-gray-500">Invest in pieces that last.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Curated Categories</h2>
            <p className="mt-2 text-gray-500">Browse by your favorite era or style.</p>
          </div>
          <Link to="/category" className="hidden sm:flex items-center text-blue-600 font-medium hover:text-blue-700 group">
            View All <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.slice(0, 6).map((cat, idx) => (
            <Link 
              key={idx} 
              to={`/category/${cat.slug}`}
              className="group flex flex-col items-center text-center space-y-3"
            >
              <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-md group-hover:shadow-xl transition-all ring-4 ring-transparent group-hover:ring-blue-50">
                <img 
                  src={cat.image} 
                  alt={cat.title} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
              </div>
              <span className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                {cat.title}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Trending Products */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Trending Now</h2>
              <p className="mt-2 text-gray-500">Top picks from our community.</p>
            </div>
            <Link to="/products" className="sm:flex items-center text-blue-600 font-medium hover:text-blue-700 group">
              Shop All <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.length > 0 ? (
              products.map((product) => (
                <div key={product.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {product.offer_discount > 0 && (
                      <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                        {product.offer_discount}% OFF
                      </span>
                    )}
                    
                    {/* Hover Overlay */}
                    <Link 
                      to={`/product/${product.slug}`}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <button className="bg-white text-gray-900 px-6 py-2 rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-all shadow-lg hover:bg-gray-100">
                        View Details
                      </button>
                    </Link>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      {product.category?.title || "Vintage"}
                    </p>
                    <Link to={`/product/${product.slug}`}>
                      <h3 className="font-bold text-gray-900 line-clamp-1 hover:text-blue-600 transition-colors">
                        {product.title}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center gap-1 mt-2 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${i < Math.round(product.rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"}`} 
                        />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">({product.rating || 0})</span>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex flex-col">
                         {product.old_price && (
                           <span className="text-xs text-gray-400 line-through">₹{product.old_price}</span>
                         )}
                         <span className="text-lg font-bold text-blue-600">₹{product.price}</span>
                      </div>
                      <Link 
                        to={`/product/${product.slug}`}
                        className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
               // Simple Skeletons
               [...Array(4)].map((_, i) => (
                 <div key={i} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse">
                   <div className="w-full h-48 bg-gray-200 rounded-xl mb-4"></div>
                   <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                   <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                 </div>
               ))
            )}
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="bg-blue-900 relative overflow-hidden">
         <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-800/20 rounded-full blur-3xl"></div>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center relative z-10">
           <h2 className="text-3xl font-bold text-white mb-4">Join the Collector's Club</h2>
           <p className="text-blue-100 max-w-2xl mx-auto mb-8">
             Subscribe for exclusive access to new arrivals, special offers, and tales from the past.
           </p>
           <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
             <input 
               type="email" 
               placeholder="Enter your email address" 
               className="flex-1 px-5 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
             />
             <button className="px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-full transition-colors shadow-lg">
               Subscribe
             </button>
           </form>
         </div>
      </div>

    </div>
  );
}
