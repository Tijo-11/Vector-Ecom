import { useState, useEffect, useContext } from "react";
import { ShoppingCart, Heart, Plus, Minus, Check } from "lucide-react";
import apiInstance from "../../../utils/axios";
import Swal from "sweetalert2";
import { CartContext } from "../../../plugin/Context";
import { addToWishlist } from "../../../plugin/addToWishlist";
import log from "loglevel";

export default function ProductOptions({
  product,
  setMainImage,
  country,
  user,
  cartId,
  isOutOfStock,
  wishlist,
  onWishlistUpdate,
  isLoggedIn
}) {
  const Toast = Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
  });

  const [color, setColor] = useState([]);
  const [size, setSize] = useState([]);
  const [colorValue, setColorValue] = useState("");
  const [sizeValue, setSizeValue] = useState("");
  const [qtyValue, setQtyValue] = useState(1);
  const [cartCount, setCartCount] = useContext(CartContext);

  useEffect(() => {
    if (product && product.id) {
      setColor(product.color || []);
      setSize(product.size || []);
      if(product.color?.length > 0) setColorValue(product.color[0].name);
      if(product.size?.length > 0) setSizeValue(product.size[0].name);
    }
  }, [product]);

  const handleColorButtonClick = (colorName, colorImage) => {
    setColorValue(colorName);
    if (colorImage) setMainImage(colorImage);
  };

  const handleSizeButtonClick = (sizeName, sizeImage) => {
    setSizeValue(sizeName);
    if (sizeImage) setMainImage(sizeImage);
  };

  const handleQtyIncrement = () => {
      setQtyValue(prev => prev + 1);
  };
  
  const handleQtyDecrement = () => {
      setQtyValue(prev => Math.max(1, prev - 1));
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) return;

    if (qtyValue <= 0) {
      Toast.fire({ icon: "info", title: "Invalid Quantity" });
      return;
    }
    
    // Check selections
    if (color.length > 0 && !colorValue) {
        Toast.fire({ icon: "info", title: "Please select a color" });
        return;
    }
    if (size.length > 0 && !sizeValue) {
        Toast.fire({ icon: "info", title: "Please select a size" });
        return;
    }

    try {
      const productRes = await apiInstance.get(`/products/${product.slug}/`);
      const stock_qty = productRes.data.stock_qty;

      const url = user
        ? `/cart-list/${cartId}/${user}/`
        : `/cart-list/${cartId}/`;

      const cartRes = await apiInstance.get(url);
      const items = Array.isArray(cartRes.data) ? cartRes.data : cartRes.data.results || [];
      const existingItem = items.find(item => item.product.id === product.id);
      const existingQty = existingItem ? existingItem.qty : 0;

      if (existingQty + qtyValue > stock_qty) {
        Swal.fire({
          icon: "warning",
          title: "Insufficient Stock",
          text: `Only ${stock_qty} unit(s) available. You have ${existingQty} in cart.`,
        });
        return;
      }

      const formData = new FormData();
      formData.append("product", product.id);
      formData.append("user", user || "");
      formData.append("qty", qtyValue);
      formData.append("price", product.price);
      formData.append("shipping_amount", product.shipping_amount);
      formData.append("country", country || "Unknown");
      formData.append("size", sizeValue || "No Size");
      formData.append("color", colorValue || "No Color");
      formData.append("cart_id", cartId || "");

      const response = await apiInstance.post("cart/", formData);
      setCartCount((prev) => prev + qtyValue); 
      Toast.fire({ icon: "success", title: response.data.message || "Added to cart" });

      // Sync
      const res = await apiInstance.get(url);
      const itemsNew = Array.isArray(res.data) ? res.data : res.data.results || [];
      const totalQty = itemsNew.reduce((sum, item) => sum + item.qty, 0);
      setCartCount(totalQty);
    } catch (error) {
      log.error("Error adding to cart:", error);
      Toast.fire({ icon: "error", title: "Failed to add to cart" });
    }
  };

  const handleAddToWishlist = async () => {
    try {
      await addToWishlist(product.id, user); // User ID passed as 'user' prop
      if (onWishlistUpdate) onWishlistUpdate();
    } catch (error) {
      console.log("Error updating wishlist:", error);
    }
  };

  const isInWishlist = Array.isArray(wishlist) && wishlist.some((item) => item?.product?.id === product.id);

  return (
    <div className="mt-8 space-y-6">
      
      {/* Color Selection */}
      {color.length > 0 && (
        <div>
           <div className="flex justify-between mb-2">
              <span className="font-semibold text-gray-900">Color</span>
              <span className="text-gray-500 text-sm">{colorValue}</span>
           </div>
           <div className="flex flex-wrap gap-3">
              {color.map((c, index) => (
                <button
                   key={index}
                   type="button"
                   onClick={() => handleColorButtonClick(c.name, c.image)}
                   className={`h-10 w-10 rounded-full border-2 focus:outline-none transition-all flex items-center justify-center ${
                      colorValue === c.name ? "border-blue-600 ring-2 ring-blue-100" : "border-gray-200 hover:border-gray-400"
                   }`}
                   style={{ backgroundColor: c.color_code }}
                   title={c.name}
                >
                   {colorValue === c.name && <Check className="h-4 w-4 text-white drop-shadow-md" />}
                </button>
              ))}
           </div>
        </div>
      )}

      {/* Size Selection */}
      {size.length > 0 && (
        <div>
           <div className="flex justify-between mb-2">
              <span className="font-semibold text-gray-900">Size</span>
              <span className="text-gray-500 text-sm">{sizeValue}</span>
           </div>
           <div className="flex flex-wrap gap-2">
              {size.map((s, index) => (
                 <button
                    key={index}
                    onClick={() => handleSizeButtonClick(s.name, s.image)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                       sizeValue === s.name 
                         ? "border-blue-600 bg-blue-50 text-blue-700" 
                         : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                 >
                    {s.name}
                 </button>
              ))}
           </div>
        </div>
      )}

      {/* Quantity & Actions */}
      <div className="pt-6 border-t border-gray-100">
         <div className="flex items-center gap-4 mb-4">
             <span className="font-semibold text-gray-900">Quantity</span>
             <div className="flex items-center border border-gray-200 rounded-lg">
                <button 
                  onClick={handleQtyDecrement}
                  disabled={isOutOfStock} 
                  className="p-2 hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                >
                    <Minus className="h-4 w-4" />
                </button>
                <input 
                  type="number" 
                  value={qtyValue} 
                  onChange={(e) => setQtyValue(parseInt(e.target.value) || 1)}
                  className="w-12 text-center text-gray-900 font-medium focus:outline-none"
                  min="1"
                  disabled={isOutOfStock}
                />
                 <button 
                  onClick={handleQtyIncrement}
                  disabled={isOutOfStock} 
                  className="p-2 hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" />
                </button>
             </div>
             
             <div className="text-sm text-gray-500">
                {product.stock_qty > 0 ? (
                    product.stock_qty < 10 ? 
                    <span className="text-orange-600 font-medium">Only {product.stock_qty} left!</span> : 
                    <span>In Stock</span>
                ) : <span>Out of Stock</span>}
             </div>
         </div>

         <div className="flex gap-4">
            <button
               onClick={handleAddToCart}
               disabled={isOutOfStock}
               className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 ${
                  isOutOfStock
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                    : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/30"
               }`}
            >
               <ShoppingCart className="h-5 w-5" />
               {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
            
            {isLoggedIn && (
               <button
                  onClick={handleAddToWishlist}
                  className={`p-3.5 rounded-xl border-2 transition-colors ${
                     isInWishlist
                       ? "border-red-100 bg-red-50 text-red-600"
                       : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
                  }`}
                  title="Add to Wishlist"
               >
                  <Heart className={`h-6 w-6 ${isInWishlist ? "fill-current" : ""}`} />
               </button>
            )}
         </div>
      </div>
    </div>
  );
}
