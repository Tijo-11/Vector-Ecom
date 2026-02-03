import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart, AlertCircle, Check } from "lucide-react";
import Swal from "sweetalert2";
import log from "loglevel";
import apiInstance from "../../../utils/axios";
import { CartContext } from "../../../plugin/Context";
import UserData from "../../../plugin/UserData";
import UserCountry from "../ProductDetail/UserCountry";
import cartID from "../ProductDetail/cartId";
import { addToWishlist } from "../../../plugin/addToWishlist";
import StarRating from "./StarRating";

export default function ProductCard({ product, wishlist, onWishlistUpdate, isLoggedIn }) {
  const [selectedColor, setSelectedColor] = useState(
    product.color?.length > 0 ? product.color[0].name : ""
  );
  const [selectedSize, setSelectedSize] = useState(
    product.size?.length > 0 ? product.size[0].name : ""
  );
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useContext(CartContext);
  
  const userData = UserData();
  const currentAddress = UserCountry();
  const cid = cartID();

  const handleAddToCart = async () => {
    if (product.stock_qty === 0 || !product.in_stock) return;

    try {
      // Basic validation
      if (quantity <= 0) {
        Swal.fire({ icon: "info", title: "Invalid Quantity", text: "Please enter a valid quantity." });
        return;
      }

      // Check stock limit (simplified check, ideally should check server cart too but we'll trust current state for now or do a quick fetch)
      // For performance, we'll try to add. Server validation should handle strict limits.
      // But let's replicate the existing logic:
      
      const userIdUrl = userData?.user_id ? `${userData.user_id}/` : "";
      const cartUrl = `/cart-list/${cid}/${userIdUrl}`;
      
      // We can optionally check existing cart qty here, but for speed let's just POST and handle error?
      // The original code checked existing qty. We'll keep it to be safe.
      const cartRes = await apiInstance.get(cartUrl);
      const cartItems = Array.isArray(cartRes.data) ? cartRes.data : (cartRes.data.results || []);
      const existingItem = cartItems.find(item => item.product.id === product.id);
      const existingQty = existingItem ? existingItem.qty : 0;

      if (existingQty + quantity > product.stock_qty) {
         Swal.fire({
          icon: "warning",
          title: "Stock Limit Reached",
          text: `You have ${existingQty} in cart. Only ${product.stock_qty} available.`,
        });
        return;
      }

      const formData = new FormData();
      formData.append("product", product.id);
      formData.append("user", userData?.user_id || "");
      formData.append("qty", quantity);
      formData.append("price", product.price);
      formData.append("shipping_amount", product.shipping_amount);
      formData.append("country", currentAddress?.country || "Unknown");
      formData.append("size", selectedSize);
      formData.append("color", selectedColor);
      formData.append("cart_id", cid);

      await apiInstance.post(`cart/`, formData);
      
      // Update Context
      setCartCount(prev => prev + quantity);
      
      Swal.mixin({
        toast: true, position: "top", showConfirmButton: false, timer: 1500, timerProgressBar: true
      }).fire({ icon: "success", title: "Added to cart" });

    } catch (error) {
      log.error(error);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to add to cart" });
    }
  };

  const handleWishlist = async () => {
    try {
      await addToWishlist(product.id, userData?.user_id);
      if (onWishlistUpdate) onWishlistUpdate();
    } catch (error) {
      log.error(error);
    }
  };

  const isInWishlist = Array.isArray(wishlist) && wishlist.some(item => item.product?.id === product.id);
  const discountPrice = product.offer_discount > 0 
    ? (product.price * (1 - product.offer_discount / 100)).toFixed(2) 
    : product.price;

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden border border-gray-100">
      
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <Link to={`/product/${product.slug}`}>
          <img 
            src={product.image} 
            alt={product.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </Link>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.offer_discount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                -{product.offer_discount}%
            </span>
            )}
             {!product.in_stock || product.stock_qty === 0 ? (
                 <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                 Out of Stock
                </span>
             ) : (
                <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm bg-opacity-90 backdrop-blur-sm">
                 In Stock
                </span>
             )}
        </div>

        {/* Wishlist Button (Overlay) */}
        {isLoggedIn && (
            <button 
                onClick={handleWishlist}
                className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-red-50 transition-colors"
            >
                <Heart className={`h-4 w-4 ${isInWishlist ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
            </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-2">
            <p className="text-xs text-gray-500 uppercase font-medium">{product.category?.title}</p>
            <Link to={`/product/${product.slug}`} className="block">
                <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors" title={product.title}>
                    {product.title}
                </h3>
            </Link>
        </div>

        <div className="flex items-end gap-2 mb-3">
             <span className="text-lg font-bold text-gray-900">₹{discountPrice}</span>
             {product.offer_discount > 0 && (
                <span className="text-sm text-gray-400 line-through mb-0.5">₹{product.price}</span>
             )}
        </div>

        <div className="mb-4">
            <StarRating rating={product.rating} />
        </div>

        {/* Variants & Actions - Only visible/interactive if needed, or keep compact */}
        <div className="mt-auto space-y-3">
             {/* Simple Selectors */}
             {(product.size?.length > 0 || product.color?.length > 0) && (
                 <div className="flex gap-2 text-xs">
                    {product.size?.length > 0 && (
                        <select 
                            value={selectedSize} 
                            onChange={(e) => setSelectedSize(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded px-1 py-1 focus:outline-none focus:border-blue-500"
                        >
                            {product.size.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    )}
                    {product.color?.length > 0 && (
                        <select 
                            value={selectedColor} 
                            onChange={(e) => setSelectedColor(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded px-1 py-1 focus:outline-none focus:border-blue-500"
                        >
                            {product.color.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    )}
                 </div>
             )}

            <button 
                onClick={handleAddToCart}
                disabled={!product.in_stock || product.stock_qty === 0}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                     !product.in_stock || product.stock_qty === 0
                     ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                     : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transform active:scale-95"
                }`}
            >
                <ShoppingCart className="h-4 w-4" />
                {!product.in_stock || product.stock_qty === 0 ? "Unavailable" : "Add to Cart"}
            </button>
        </div>
      </div>
    </div>
  );
}
