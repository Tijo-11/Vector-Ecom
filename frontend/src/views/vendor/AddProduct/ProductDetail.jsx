import React from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

// Component for product details input fields
function ProductDetails({ product, setProduct, category }) {
  // Handle input changes
  const handleProductInputChange = (event) => {
    setProduct({
      ...product,
      [event.target.name]: event.target.value,
    });
  };

  // Handle file input changes
  const handleProductFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProduct({
          ...product,
          image: {
            file: event.target.files[0],
            preview: reader.result,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className="tab-pane fade show active"
      id="pills-home"
      role="tabpanel"
      aria-labelledby="pills-home-tab"
    >
      <div className="bg-white shadow-md rounded-lg p-6">
        <h4 className="text-xl font-semibold mb-4 text-gray-800">
          Product Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="bg-white shadow-sm rounded-lg p-4 h-full flex flex-col items-center">
              <img
                src={
                  product.image?.preview ||
                  "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png"
                }
                alt="Product Thumbnail Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <h4 className="mt-3 text-lg font-medium text-gray-800">
                {product.title || "Product Title"}
              </h4>
            </div>
          </div>
          <div className="col-span-2">
            <div className="bg-white shadow-sm rounded-lg p-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Thumbnail
                  </label>
                  <input
                    type="file"
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                    name="image"
                    onChange={handleProductFileChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                    name="title"
                    value={product.title || ""}
                    onChange={handleProductInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                    name="description"
                    value={product.description || ""}
                    onChange={handleProductInputChange}
                    rows={5}
                  />
                  {/* CKEditor can be re-enabled if needed
                  <CKEditor
                    editor={ClassicEditor}
                    data={product.description || ''}
                    onChange={(event, editor) => {
                      setProduct({ ...product, description: editor.getData() });
                    }}
                  />
                  */}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                      name="category"
                      value={product.category || ""}
                      onChange={handleProductInputChange}
                    >
                      <option value="">- Select -</option>
                      {category.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                      name="brand"
                      value={product.brand || ""}
                      onChange={handleProductInputChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sale Price
                    </label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                      name="price"
                      value={product.price || ""}
                      onChange={handleProductInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Regular Price
                    </label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                      name="old_price"
                      value={product.old_price || ""}
                      onChange={handleProductInputChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping Amount
                    </label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                      name="shipping_amount"
                      value={product.shipping_amount || ""}
                      onChange={handleProductInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                      name="stock_qty"
                      value={product.stock_qty || ""}
                      onChange={handleProductInputChange}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
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
    </div>
  );
}

export default ProductDetails;
