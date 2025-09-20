import React from "react";
import { Plus, Trash2 } from "lucide-react";

function ProductVariants({
  type,
  items,
  setItems,
  handleInputChange,
  handleImageChange,
  handleRemove,
  handleAddMore,
}) {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h4 className="text-xl font-semibold mb-4">
        {type === "size" ? "Sizes" : "Color"}
      </h4>
      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-4 items-center">
            {type === "size" ? (
              <>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="XXL"
                    value={item.name || ""}
                    onChange={(e) =>
                      handleInputChange(index, "name", e.target.value, setItems)
                    }
                  />
                </div>
                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="₹0.00"
                    value={item.price || ""}
                    onChange={(e) =>
                      handleInputChange(
                        index,
                        "price",
                        e.target.value,
                        setItems
                      )
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Green"
                    value={item.name || ""}
                    onChange={(e) =>
                      handleInputChange(index, "name", e.target.value, setItems)
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#f4f7f6"
                    value={item.color_code || ""}
                    onChange={(e) =>
                      handleInputChange(
                        index,
                        "color_code",
                        e.target.value,
                        setItems
                      )
                    }
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <input
                    type="file"
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    onChange={(e) => handleImageChange(index, e, setItems)}
                  />
                </div>
                <div className="col-span-3">
                  <img
                    src={
                      item.image && item.image.preview
                        ? item.image.preview
                        : "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png"
                    }
                    alt={`Preview for gallery item ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                </div>
              </>
            )}
            <div className={type === "size" ? "col-span-3" : "col-span-2"}>
              <button
                type="button"
                onClick={() => handleRemove(index, setItems)}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
              >
                <Trash2 className="w-5 h-5 mr-2" /> Remove
              </button>
            </div>
          </div>
        ))}
        {items.length < 1 && (
          <h4 className="text-lg text-gray-600">
            {type === "size" ? "No Size Added" : "No Colors Added"}
          </h4>
        )}
        <button
          type="button"
          onClick={() => handleAddMore(setItems)}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" /> Add More{" "}
          {type === "size" ? "Sizes" : "Colors"}
        </button>
      </div>
    </div>
  );
}

export default ProductVariants;
