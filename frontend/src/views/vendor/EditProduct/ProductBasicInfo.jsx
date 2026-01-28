import React from "react";

function ProductBasicInfo({
  product,
  setProduct,
  category,
  handleProductInputChange,
  handleProductFileChange,
}) {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h4 className="text-xl font-semibold mb-4">Product Details</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow h-full p-4 flex flex-col items-center">
            <img
              src={
                product.image && product.image.preview
                  ? product.image.preview
                  : "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png"
              }
              alt="Product Thumbnail Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <h4 className="mt-3 text-lg font-medium text-gray-800">
              {product.title || "Product Title"}
            </h4>
            {/* Show selected category name for better UX */}
            {product.category_id && (
              <p className="mt-2 text-sm text-gray-600">
                Category:{" "}
                <strong>
                  {category.find(
                    (c) => String(c.id) === String(product.category_id),
                  )?.title || "Unknown"}
                </strong>
              </p>
            )}
          </div>
        </div>
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Thumbnail <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  name="image"
                  onChange={handleProductFileChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  name="title"
                  value={product.title || ""}
                  onChange={handleProductInputChange}
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  cols={30}
                  rows={6}
                  name="description"
                  value={product.description || ""}
                  onChange={handleProductInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  name="category_id" // ← CRITICAL FIX: Must be category_id
                  value={product.category_id || ""}
                  onChange={handleProductInputChange}
                  required
                >
                  <option value="">- Select Category -</option>
                  {category.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                {/* Helpful feedback below dropdown */}
                {product.category_id && (
                  <p className="mt-1 text-xs text-green-600">
                    Selected:{" "}
                    <strong>
                      {
                        category.find((c) => c.id === product.category_id)
                          ?.title
                      }
                    </strong>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  name="brand"
                  value={product.brand || ""}
                  onChange={handleProductInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sale Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  name="price"
                  value={product.price || ""}
                  onChange={handleProductInputChange}
                  placeholder="₹0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  name="shipping_amount"
                  value={product.shipping_amount || ""}
                  onChange={handleProductInputChange}
                  placeholder="₹0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Qty <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  name="stock_qty"
                  value={product.stock_qty || ""}
                  onChange={handleProductInputChange}
                  min="0"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  name="tags"
                  value={product.tags || ""}
                  onChange={handleProductInputChange}
                />
                <span className="text-xs text-gray-500">
                  NOTE: Separate tags with commas
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductBasicInfo;
