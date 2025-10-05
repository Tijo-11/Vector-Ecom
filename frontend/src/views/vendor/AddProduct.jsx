import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import ProductBasicInfo from "./EditProduct/ProductBasicInfo";
import ProductGallery from "./EditProduct/ProductGallery";
import ProductSpecifications from "./EditProduct/ProductSpecifications";
import ProductVariants from "./EditProduct/ProductVariants";
import { CheckCircle } from "lucide-react";

function AddProduct() {
  const userData = UserData();
  const navigate = useNavigate();
  const axios = apiInstance;

  if (userData?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const [product, setProduct] = useState({
    title: "",
    image: null,
    description: "",
    category: "",
    tags: "",
    brand: "",
    price: "",
    old_price: "",
    shipping_amount: "",
    stock_qty: "",
    vendor: userData?.vendor_id,
  });
  const [specifications, setSpecifications] = useState([
    { title: "", content: "" },
  ]);
  const [colors, setColors] = useState([
    { name: "", color_code: "", image: null },
  ]);
  const [sizes, setSizes] = useState([{ name: "", price: 0.0 }]);
  const [gallery, setGallery] = useState([{ image: null }]);
  const [category, setCategory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const handleAddMore = (setStateFunction) => {
    setStateFunction((prevState) => [...prevState, {}]);
  };

  const handleRemove = (index, setStateFunction) => {
    setStateFunction((prevState) => {
      const newState = [...prevState];
      newState.splice(index, 1);
      return newState;
    });
  };

  const handleInputChange = (index, field, value, setStateFunction) => {
    setStateFunction((prevState) => {
      const newState = [...prevState];
      newState[index][field] = value;
      return newState;
    });
  };

  const handleImageChange = (index, event, setStateFunction) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStateFunction((prevState) => {
          const newState = [...prevState];
          newState[index].image = { file, preview: reader.result };
          return newState;
        });
      };
      reader.readAsDataURL(file);
    } else {
      setStateFunction((prevState) => {
        const newState = [...prevState];
        newState[index].image = null;
        newState[index].preview = null;
        return newState;
      });
    }
  };

  const handleProductInputChange = (event) => {
    setProduct({
      ...product,
      [event.target.name]: event.target.value,
    });
  };

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

  useEffect(() => {
    const fetchCategory = async () => {
      axios.get("category/").then((res) => {
        setCategory(res.data);
      });
    };
    fetchCategory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Validate only required fields
    if (
      product.title === "" ||
      product.description === "" ||
      product.price === "" ||
      product.category === "" ||
      product.shipping_amount === "" ||
      product.stock_qty === "" ||
      product.image === null
    ) {
      console.log("Please fill in all required fields");
      setIsLoading(false);
      Swal.fire({
        icon: "warning",
        title: "Missing Required Fields!",
        text: "Title, description, price, category, shipping amount, stock quantity, and thumbnail are required.",
      });
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();
      Object.entries(product).forEach(([key, value]) => {
        if (key === "image" && value) {
          formData.append(key, value.file);
        } else {
          formData.append(key, value);
        }
      });

      // Only include specifications with non-empty title or content
      const validSpecifications = specifications.filter(
        (spec) => spec.title?.trim() || spec.content?.trim()
      );
      validSpecifications.forEach((specification, index) => {
        Object.entries(specification).forEach(([key, value]) => {
          if (value) formData.append(`specifications[${index}][${key}]`, value);
        });
      });

      // Only include colors with at least one non-empty field
      const validColors = colors.filter(
        (color) => color.name?.trim() || color.color_code?.trim() || color.image
      );
      validColors.forEach((color, index) => {
        Object.entries(color).forEach(([key, value]) => {
          if (
            key === "image" &&
            value &&
            value.file &&
            value.file.type.startsWith("image/")
          ) {
            formData.append(
              `colors[${index}][${key}]`,
              value.file,
              value.file.name
            );
          } else if (value) {
            formData.append(`colors[${index}][${key}]`, String(value));
          }
        });
      });

      // Only include sizes with non-empty name or price
      const validSizes = sizes.filter(
        (size) => size.name?.trim() || size.price
      );
      validSizes.forEach((size, index) => {
        Object.entries(size).forEach(([key, value]) => {
          if (value) formData.append(`sizes[${index}][${key}]`, value);
        });
      });

      // Include gallery images if present
      gallery.forEach((item, index) => {
        if (item.image && item.image.file) {
          formData.append(`gallery[${index}][image]`, item.image.file);
        }
      });

      const response = await apiInstance.post(
        `vendor-product-create/${userData?.vendor_id}/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Product Created Successfully",
        text: "This product has been successfully created",
      });

      // navigate('/vendor/products/');
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create product. Please try again.",
      });
    }
  };

  return (
    <div className="w-full px-4" id="main">
      <div className="flex flex-row h-full">
        <div className="w-full" id="main">
          <div className="flex h-full">
            <Sidebar />
            <div className="flex-1 mt-4 px-4">
              <h4 className="text-xl font-semibold mb-4">Add New Product</h4>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-sm text-blue-700">
                <strong>Note:</strong> Specifications, Sizes, Colors, and
                Gallery images are optional.
              </div>

              <form onSubmit={handleSubmit} encType="multipart/form-data">
                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <button
                    type="button"
                    className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                      activeTab === "basic"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setActiveTab("basic")}
                  >
                    Basic Information
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                      activeTab === "gallery"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setActiveTab("gallery")}
                  >
                    Gallery
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                      activeTab === "specifications"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setActiveTab("specifications")}
                  >
                    Specifications
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                      activeTab === "size"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setActiveTab("size")}
                  >
                    Size
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                      activeTab === "color"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                    onClick={() => setActiveTab("color")}
                  >
                    Color
                  </button>
                </div>

                <hr className="my-6" />

                {/* Tab Content */}
                <div className="bg-white rounded-xl shadow p-6 mb-6">
                  {activeTab === "basic" && (
                    <ProductBasicInfo
                      product={product}
                      setProduct={setProduct}
                      category={category}
                      handleProductInputChange={handleProductInputChange}
                      handleProductFileChange={handleProductFileChange}
                    />
                  )}
                  {activeTab === "gallery" && (
                    <ProductGallery
                      gallery={gallery}
                      setGallery={setGallery}
                      handleImageChange={handleImageChange}
                      handleRemove={handleRemove}
                      handleAddMore={handleAddMore}
                    />
                  )}
                  {activeTab === "specifications" && (
                    <ProductSpecifications
                      specifications={specifications}
                      setSpecifications={setSpecifications}
                      handleInputChange={handleInputChange}
                      handleRemove={handleRemove}
                      handleAddMore={handleAddMore}
                    />
                  )}
                  {activeTab === "size" && (
                    <ProductVariants
                      type="size"
                      items={sizes}
                      setItems={setSizes}
                      handleInputChange={handleInputChange}
                      handleRemove={handleRemove}
                      handleAddMore={handleAddMore}
                    />
                  )}
                  {activeTab === "color" && (
                    <ProductVariants
                      type="color"
                      items={colors}
                      setItems={setColors}
                      handleInputChange={handleInputChange}
                      handleImageChange={handleImageChange}
                      handleRemove={handleRemove}
                      handleAddMore={handleAddMore}
                    />
                  )}
                </div>

                <hr className="my-6" />

                {/* Submit Button */}
                <div className="flex justify-center mb-6">
                  {isLoading ? (
                    <button
                      disabled
                      className="w-full max-w-md bg-green-600 text-white px-6 py-3 rounded-lg flex items-center justify-center opacity-50 cursor-not-allowed"
                    >
                      Creating...{" "}
                      <svg
                        className="animate-spin w-5 h-5 ml-2"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="w-full max-w-md bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      Create Product <CheckCircle className="w-5 h-5 ml-2" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;
