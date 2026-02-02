import React from "react";
import ProductCard from "../Products/ProductCard";

export default function RelatedProducts({ products, wishlist, onWishlistUpdate, isLoggedIn }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          wishlist={wishlist}
          onWishlistUpdate={onWishlistUpdate}
          isLoggedIn={isLoggedIn}
        />
      ))}
    </div>
  );
}
