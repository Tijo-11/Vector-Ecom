const updateCart = async (
  product_id,
  qty_value,
  price,
  shipping_amount,
  color,
  size,
  slug
) => {
  const qty = Number(qty_value || 0);
  if (qty <= 0) return; // Prevent invalid quantities

  try {
    // 1️⃣ Get live stock for the product
    const productRes = await apiInstance.get(`/products/${slug}/`);
    const stock_qty = productRes.data.stock_qty;
    const product_name = productRes.data.title;

    // 2️⃣ Fetch current cart to check existing quantity
    const url = user?.user_id
      ? `/cart-list/${cart_id}/${user.user_id}/`
      : `/cart-list/${cart_id}/`;
    const cartRes = await apiInstance.get(url);
    const existingItem = cartRes.data.find(
      (item) => item.product.id === product_id
    );
    const existingQty = existingItem ? existingItem.qty : 0;

    // 3️⃣ Validate stock
    if (qty > stock_qty) {
      Swal.fire({
        icon: "warning",
        title: "Stock Limit Reached",
        text: `Only ${stock_qty} unit(s) of "${product_name}" available.`,
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    // 4️⃣ Optimistic update for CartContext
    const previousCartCount = cartCount;
    setCartCount(
      (prev) =>
        prev +
        qty -
        (cartItems.find((c) => c.product.id === product_id)?.qty || 0)
    );

    // 5️⃣ Proceed to update cart
    const formData = {
      product: product_id,
      user: user?.user_id || null,
      qty: qty,
      price: price,
      shipping_amount: shipping_amount,
      color: color || null,
      size: size || null,
      cart_id: cart_id,
      country: currentAddress?.country || null,
    };

    const response = await apiInstance.post("/cart/", formData);
    toast.fire({
      icon: "success",
      title: "Cart updated successfully",
    });

    // 6️⃣ Refresh cart and totals
    const updatedCart = await apiInstance.get(url);
    setCart(updatedCart.data || []);

    const totalResponse = await apiInstance.get(`/cart-detail/${cart_id}/`);
    setCartTotal({
      itemCount: updatedCart.data.length || 0,
      sub_total: totalResponse.data.sub_total || 0,
      shipping: totalResponse.data.shipping || 0,
      tax: totalResponse.data.tax || 0,
      service_fee: totalResponse.data.service_fee || 0,
      total: totalResponse.data.total || 0,
    });

    // 7️⃣ Sync CartContext count with backend
    const totalQty = updatedCart.data.reduce((sum, item) => sum + item.qty, 0);
    setCartCount(totalQty);
  } catch (error) {
    console.error("Error updating cart:", error);

    // Rollback optimistic update
    setCartCount(previousCartCount);

    toast.fire({
      icon: "error",
      title: "Failed to update cart",
    });
  }
};
