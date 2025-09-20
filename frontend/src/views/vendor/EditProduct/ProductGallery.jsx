import React from "react";
import { Plus, Trash2 } from "lucide-react";

function ProductGallery({
  gallery,
  setGallery,
  handleImageChange,
  handleRemove,
  handleAddMore,
}) {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h4 className="text-xl font-semibold mb-4">Product Image</h4>
      <div className="space-y-6">
        {gallery.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-4 items-center">
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
            <div className="col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Image
              </label>
              <input
                type="file"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => handleImageChange(index, e, setGallery)}
              />
            </div>
            <div className="col-span-3">
              <button
                type="button"
                onClick={() => handleRemove(index, setGallery)}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
              >
                <Trash2 className="w-5 h-5 mr-2" /> Remove
              </button>
            </div>
          </div>
        ))}
        {gallery.length < 1 && (
          <h4 className="text-lg text-gray-600">No Images Selected</h4>
        )}
        <button
          type="button"
          onClick={() => handleAddMore(setGallery)}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" /> Add More Images
        </button>
      </div>
    </div>
  );
}

export default ProductGallery;
