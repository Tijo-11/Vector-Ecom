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
        title: "Missing Fields!",
        text: "All fields are required to create a product",
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

      specifications.forEach((specification, index) => {
        Object.entries(specification).forEach(([key, value]) => {
          formData.append(`specifications[${index}][${key}]`, value);
        });
      });

      colors.forEach((color, index) => {
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
          } else {
            formData.append(`colors[${index}][${key}]`, String(value));
          }
        });
      });

      sizes.forEach((size, index) => {
        Object.entries(size).forEach(([key, value]) => {
          formData.append(`sizes[${index}][${key}]`, value);
        });
      });

      gallery.forEach((item, index) => {
        if (item.image) {
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
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row h-full">
          <Sidebar />
          <div className="md:w-3/4 lg:w-4/5 mt-6">
            <form onSubmit={handleSubmit} encType="multipart/form-data">
              <div className="flex justify-center mb-6 space-x-4">
                <button
                  type="button"
                  className={`px-4 py-2 font-semibold rounded-lg ${
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
                  className={`px-4 py-2 font-semibold rounded-lg ${
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
                  className={`px-4 py-2 font-semibold rounded-lg ${
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
                  className={`px-4 py-2 font-semibold rounded-lg ${
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
                  className={`px-4 py-2 font-semibold rounded-lg ${
                    activeTab === "color"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  onClick={() => setActiveTab("color")}
                >
                  Color
                </button>
              </div>

              <div>
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

                <div className="flex justify-center mt-6 mb-8">
                  {isLoading ? (
                    <button
                      disabled
                      className="w-1/2 bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center opacity-50 cursor-not-allowed"
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
                      className="w-1/2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
                    >
                      Create Product <CheckCircle className="w-5 h-5 ml-2" />
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;
