import apiInstance from "../utils/axios";
import Swal from "sweetalert2";

export const addToWishlist = async (productId, userId) => {
  const axios = apiInstance;

  try {
    // Send POST request to add/remove from wishlist
    const formData = new FormData();
    formData.append("product_id", productId);
    formData.append("user_id", userId);

    const response = await axios.post(`customer/wishlist/create/`, formData);

    Swal.fire({
      icon: "success",
      title: response.data.message || "Wishlist updated successfully",
    });

    console.log(response.data);
  } catch (error) {
    console.log(error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to update wishlist. Please try again.",
    });
  }
};
