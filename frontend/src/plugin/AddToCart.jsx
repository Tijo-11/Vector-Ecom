// plugin/AddToCart.jsx
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

    console.log(response.data);

    Toast.fire({
      icon: "success",
      title: "Added To Cart",
    });

    // Refetch count
    const url =
      isLoggedIn && user?.user_id
        ? `/cart-list/${cart_id}/${user.user_id}/`
        : `/cart-list/${cart_id}/`;

    const res = await apiInstance.get(url);
    const totalQty = res.data.reduce((sum, item) => sum + item.qty, 0);
    setCartCount(totalQty);

    if (setIsAddingToCart) setIsAddingToCart("Added To Cart");
  } catch (error) {
    console.log(error);
    if (setIsAddingToCart) setIsAddingToCart("An Error Occurred");
  }
};
