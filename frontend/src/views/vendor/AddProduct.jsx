import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import apiInstance from "./utils/axios"; // Assumed available
import UserData from "./plugin/UserData"; // Assumed available
import Sidebar from "./Sidebar"; // Assumed available
import { useNavigate } from "react-router-dom";
import ProductDetails from "./ProductDetails";
import ProductGallery from "./AddProduct/ProductGallery";
import ProductSpecifications from "./ProductSpecifications";
import ProductSizes from "./ProductSizes";
import ProductColors from "./ProductColors";
import TabNavigation from "./TabNavigation";

// Main component for adding a product
function AddProduct() {
  const userData = UserData();
  const navigate = useNavigate();
  const axios = apiInstance;

  // Redirect if not a vendor
  if (userData?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  // State for product data
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

  // State for dynamic fields
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

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await axios.get("category/");
        setCategory(res.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategory();
  }, []);

  // Handle adding more fields
  const handleAddMore = (setStateFunction) => {
    setStateFunction((prevState) => [...prevState, {}]);
  };

  // Handle removing fields
  const handleRemove = (index, setStateFunction) => {
    setStateFunction((prevState) => {
      const newState = [...prevState];
      newState.splice(index, 1);
      return newState;
    });
  };

  // Handle input changes for dynamic fields
  const handleInputChange = (index, field, value, setStateFunction) => {
    setStateFunction((prevState) => {
      const newState = [...prevState];
      newState[index][field] = value;
      return newState;
    });
  };

  // Handle image changes for dynamic fields
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (
      !product.title ||
      !product.description ||
      !product.price ||
      !product.category ||
      !product.shipping_amount ||
      !product.stock_qty ||
      !product.image
    ) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields!",
        text: "All fields are required to create a product",
      });
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(product).forEach(([key, value]) => {
        if (key === "image" && value) {
          formData.append(key, value.file);
        } else {
          formData.append(key, value);
        }
      });

      specifications.forEach((spec, index) => {
        Object.entries(spec).forEach(([key, value]) => {
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

      await axios.post(
        `vendor-product-create/${userData?.vendor_id}/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Product Created Successfully",
        text: "This product has been successfully created",
      });

      setIsLoading(false);
      navigate("/vendor/products/");
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row h-full">
          <Sidebar />
          <div className="flex-1 mt-6 lg:ml-4">
            <form onSubmit={handleSubmit} encType="multipart/form-data">
              <TabNavigation />
              <div className="tab-content">
                <ProductDetails
                  product={product}
                  setProduct={setProduct}
                  category={category}
                />
                <ProductGallery
                  gallery={gallery}
                  handleImageChange={handleImageChange}
                  handleRemove={handleRemove}
                  handleAddMore={handleAddMore}
                  setGallery={setGallery}
                />
                <ProductSpecifications
                  specifications={specifications}
                  handleInputChange={handleInputChange}
                  handleRemove={handleRemove}
                  handleAddMore={handleAddMore}
                  setSpecifications={setSpecifications}
                />
                <ProductSizes
                  sizes={sizes}
                  handleInputChange={handleInputChange}
                  handleRemove={handleRemove}
                  handleAddMore={handleAddMore}
                  setSizes={setSizes}
                />
                <ProductColors
                  colors={colors}
                  handleInputChange={handleInputChange}
                  handleImageChange={handleImageChange}
                  handleRemove={handleRemove}
                  handleAddMore={handleAddMore}
                  setColors={setColors}
                />
              </div>
              <div className="flex justify-center my-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full max-w-md py-2 px-4 rounded-md text-white font-semibold ${
                    isLoading
                      ? "bg-green-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  } flex items-center justify-center`}
                >
                  {isLoading ? (
                    <>
                      Creating... <i className="fas fa-spinner fa-spin ml-2" />
                    </>
                  ) : (
                    <>
                      Create Product <i className="fas fa-check-circle ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;
