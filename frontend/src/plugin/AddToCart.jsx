import apiInstance from "../utils/axios";
import Swal from "sweetalert2";
import { CartContext } from "../plugin/Context";
import { useContext } from "react";
import CartId from "../views/shop/ProductDetail/cartId";
import { useAuthStore } from "../store/auth";

const Toast = Swal.mixin({
  toast: true,
  position: "top",
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: true,
});

export const addToCart = async (
  product_slug, // 👈 change this to slug so we can fetch product info easily
  product_id,
  qty,
  price,
  shipping_amount,
  current_address,
  color,
  size,
  setIsAddingToCart
) => {
  const [cartCount, setCartCount] = useContext(CartContext);
  const { user, isLoggedIn } = useAuthStore();
  const cart_id = CartId();

  if (setIsAddingToCart) setIsAddingToCart("Processing...");

  try {
    // 1️⃣ Get product details (for stock check)
    const productRes = await apiInstance.get(`/products/${product_slug}/`);
    const stock_qty = productRes.data.stock_qty;
    const product_name = productRes.data.title;

    // 2️⃣ Get current cart list
    const cartUrl =
      isLoggedIn && user?.user_id
        ? `/cart-list/${cart_id}/${user.user_id}/`
        : `/cart-list/${cart_id}/`;

    const cartRes = await apiInstance.get(cartUrl);
    const cartItems = cartRes.data;

    // 3️⃣ Find if this product already exists in cart
    const existingItem = cartItems.find(
      (item) => item.product.id === product_id
    );
    const existingQty = existingItem ? existingItem.qty : 0;

    // 4️⃣ Check if adding exceeds stock
    if (existingQty + qty > stock_qty) {
      Swal.fire({
        icon: "warning",
        title: "Insufficient Stock",
        text: `Only ${stock_qty} unit(s) of "${product_name}" available. You already have ${existingQty} in cart.`,
      });
      if (setIsAddingToCart) setIsAddingToCart("Add To Cart");
      return; // ❌ stop here
    }

    // 5️⃣ Proceed with add to cart
    const payload = {
      product: product_id,
      user: isLoggedIn ? user?.user_id : "",
      qty,
      price,
      shipping_amount,
      country: current_address,
      size: size || "",
      color: color || "",
      cart_id,
    };

    const response = await apiInstance.post("cart/", payload);

    Toast.fire({
      icon: "success",
      title: "Added To Cart",
    });

    // 6️⃣ Refresh cart count
    const res = await apiInstance.get(cartUrl);
    const totalQty = res.data.reduce((sum, item) => sum + item.qty, 0);
    setCartCount(totalQty);

    if (setIsAddingToCart) setIsAddingToCart("Added To Cart");
  } catch (error) {
    console.log(error);
    if (setIsAddingToCart) setIsAddingToCart("An Error Occurred");
  }
};
