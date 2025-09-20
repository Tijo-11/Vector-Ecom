import React from "react";
import { Plus, Trash2 } from "lucide-react";

function ProductSpecifications({
  specifications,
  setSpecifications,
  handleInputChange,
  handleRemove,
  handleAddMore,
}) {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h4 className="text-xl font-semibold mb-4">Specifications</h4>
      <div className="space-y-6">
        {specifications.map((specification, index) => (
          <div key={index} className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                value={specification.title || ""}
                onChange={(e) =>
                  handleInputChange(
                    index,
                    "title",
                    e.target.value,
                    setSpecifications
                  )
                }
              />
            </div>
            <div className="col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                value={specification.content || ""}
                onChange={(e) =>
                  handleInputChange(
                    index,
                    "content",
                    e.target.value,
                    setSpecifications
                  )
                }
              />
            </div>
            <div className="col-span-3">
              <button
                type="button"
                onClick={() => handleRemove(index, setSpecifications)}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
              >
                <Trash2 className="w-5 h-5 mr-2" /> Remove
              </button>
            </div>
          </div>
        ))}
        {specifications.length < 1 && (
          <h4 className="text-lg text-gray-600">No Specification Form</h4>
        )}
        <button
          type="button"
          onClick={() => handleAddMore(setSpecifications)}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" /> Add More Specifications
        </button>
      </div>
    </div>
  );
}

export default ProductSpecifications;
