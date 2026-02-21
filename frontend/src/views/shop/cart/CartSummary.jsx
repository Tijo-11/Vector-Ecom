import { useState, useEffect } from "react";
import apiInstance from "../../../utils/axios";
import cartID from "../ProductDetail/CartId";
import log from "loglevel";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";

function CartSummary({ cartItems, setCartTotal }) {
  const [cart_total, setCartTotalLocal] = useState({
    mrp_total: 0,
    discounted_total: 0,
    shipping: 0,
    grand_total: 0,
  });
  const cart_id = cartID();
  const navigate = useNavigate();
  const location = useLocation();

  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
  const itemCount = safeCartItems.length;

  const hasInsufficientStock = safeCartItems.some(
    (item) => (item.qty || 0) > (item.product?.stock_qty || 0),
  );

  useEffect(() => {
    const fetchCartTotal = async () => {
      if (!cart_id || cart_id === "undefined") {
        const emptyTotals = {
          mrp_total: 0,
          discounted_total: 0,
          shipping: 0,
          grand_total: 0,
        };
        setCartTotalLocal(emptyTotals);
        setCartTotal({ itemCount, ...emptyTotals });
        return;
      }

      try {
        const response = await apiInstance.get(`/cart-detail/${cart_id}/`);
        const serverTotals = {
          mrp_total: response.data.mrp_total || 0,
          discounted_total: response.data.discounted_total || 0,
          shipping: response.data.shipping || 0,
          grand_total: response.data.grand_total || 0,
        };
        setCartTotalLocal(serverTotals);
        setCartTotal({ itemCount, ...serverTotals });
      } catch (error) {
        // Silent fail/retry logic could go here, but for now fallback to 0
        const fallback = {
          mrp_total: 0,
          discounted_total: 0,
          shipping: 0,
          grand_total: 0,
        };
        setCartTotalLocal(fallback);
      }
    };

    fetchCartTotal();
  }, [cart_id, cartItems, setCartTotal]);

  const isAddressPage = location.pathname === "/address"; // Adjust based on actual route
  const shippingDisplay =
    cart_total.shipping > 0 ? `₹${cart_total.shipping.toFixed(2)}` : "Free";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

      <div className="space-y-4 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({itemCount} items)</span>
          <span className="font-medium text-gray-900">
            ₹{cart_total.mrp_total.toFixed(2)}
          </span>
        </div>

        {cart_total.mrp_total > cart_total.discounted_total && (
          <div className="flex justify-between text-green-600">
            <span>Total Discount</span>
            <span className="font-medium">
              -₹
              {(cart_total.mrp_total - cart_total.discounted_total).toFixed(2)}
            </span>
          </div>
        )}

        <div className="flex justify-between text-gray-600 items-center">
          <span>Shipping</span>
          <span className="font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
            {shippingDisplay}
          </span>
        </div>

        <div className="border-t border-dashed border-gray-200 pt-4 mt-4">
          <div className="flex justify-between items-end">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-blue-600">
              ₹{cart_total.grand_total.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">
            Including all taxes
          </p>
        </div>
      </div>

      {hasInsufficientStock ? (
        <div className="mt-6 bg-red-50 border border-red-100 rounded-lg p-3 text-center">
          <p className="text-sm text-red-600 font-medium animate-pulse">
            Some items exceed available stock.
            <br />
            Adjusting automatically...
          </p>
        </div>
      ) : (
        !isAddressPage && (
          <button
            onClick={() => navigate("/address")} // Direct to checkout or address as per flow
            className="w-full mt-8 bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 hover:shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            Proceed to Checkout
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        )
      )}

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
        <ShieldCheck className="w-4 h-4" />
        Secure Checkout
      </div>
    </div>
  );
}

export default CartSummary;
