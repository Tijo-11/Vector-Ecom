import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";
import { useNavigate, useParams } from "react-router-dom";
import ProductBasicInfo from "./EditProduct/ProductBasicInfo";
import ProductGallery from "./EditProduct/ProductGallery";
import ProductSpecifications from "./EditProduct/ProductSpecifications";
import ProductVariants from "./EditProduct/ProductVariants";
import { CheckCircle } from "lucide-react";
import log from "loglevel";

function UpdateProduct() {
  const userData = UserData();
  const navigate = useNavigate();
  const { product_pid } = useParams();
  const axios = apiInstance;

  if (userData?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const [product, setProduct] = useState({
    title: "",
    image: null, // {preview: url} if existing, {file, preview} if new upload
    description: "",
    category_id: "", // ← Unified to category_id (number/string)
    tags: "",
    brand: "",
    price: "",
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
  2;
  const [category, setCategory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Fetch product data + categories
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const response = await axios.get(
          `vendor-product-edit/${userData?.vendor_id}/${product_pid}/`,
        );
        const productData = response.data;

        setProduct({
          title: productData.title || "",
          image: productData.image ? { preview: productData.image } : null,
          description: productData.description || "",
          category_id: productData.category?.id || "", // ← Set existing category ID
          tags: productData.tags || "",
          brand: productData.brand || "",
          price: productData.price || "",
          shipping_amount: productData.shipping_amount || "",
          stock_qty: productData.stock_qty || "",
          vendor: userData?.vendor_id,
        });

        // Specifications
        setSpecifications(
          productData.specification?.length > 0
            ? productData.specification.map((spec) => ({
                title: spec.title || "",
                content: spec.content || "",
              }))
            : [{ title: "", content: "" }],
        );

        // Colors
        setColors(
          productData.color?.length > 0
            ? productData.color.map((color) => ({
                name: color.name || "",
                color_code: color.color_code || "",
                image: color.image ? { preview: color.image } : null,
              }))
            : [{ name: "", color_code: "", image: null }],
        );

        // Sizes
        setSizes(
          productData.size?.length > 0
            ? productData.size.map((size) => ({
                name: size.name || "",
                price: size.price || 0.0,
              }))
            : [{ name: "", price: 0.0 }],
        );

        // Gallery
        setGallery(
          productData.gallery?.length > 0
            ? productData.gallery.map((item) => ({
                image: item.image ? { preview: item.image } : null,
              }))
            : [{ image: null }],
        );
      } catch (error) {
        log.error("Error fetching product data:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load product data.",
        });
      }
    };

    const fetchCategory = async () => {
      axios.get("category/").then((res) => {
        setCategory(res.data);
      });
    };

    fetchProductData();
    fetchCategory();
  }, [product_pid, userData?.vendor_id]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Debug log (remove after testing)
    console.log("Product state on submit:", product);

    // Improved validation with exact missing fields
    const missing = [];
    if (!product.title?.trim()) missing.push("Title");
    if (!product.description?.trim()) missing.push("Description");
    if (!product.price?.toString().trim()) missing.push("Price");
    if (!product.category_id) missing.push("Category");
    if (!product.shipping_amount?.toString().trim())
      missing.push("Shipping Amount");
    if (!product.stock_qty?.toString().trim()) missing.push("Stock Quantity");
    if (!product.image) missing.push("Thumbnail"); // null = missing, object (preview or file) = present

    if (missing.length > 0) {
      setIsLoading(false);
      Swal.fire({
        icon: "warning",
        title: "Missing Required Fields!",
        text: `Please fill: ${missing.join(", ")}`,
      });
      return;
    }

    try {
      const formData = new FormData();

      // Append product fields (only send image if new file uploaded)
      Object.entries(product).forEach(([key, value]) => {
        if (key === "image" && value?.file) {
          formData.append(key, value.file);
        } else if (key !== "image" && value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      // Nested data (same as add)
      const validSpecifications = specifications.filter(
        (spec) => spec.title?.trim() || spec.content?.trim(),
      );
      validSpecifications.forEach((spec, index) => {
        Object.entries(spec).forEach(([k, v]) => {
          if (v) formData.append(`specifications[${index}][${k}]`, v);
        });
      });

      const validColors = colors.filter(
        (color) =>
          color.name?.trim() || color.color_code?.trim() || color.image,
      );
      validColors.forEach((color, index) => {
        Object.entries(color).forEach(([k, v]) => {
          if (k === "image" && v?.file) {
            formData.append(`colors[${index}][${k}]`, v.file, v.file.name);
          } else if (v) {
            formData.append(`colors[${index}][${k}]`, String(v));
          }
        });
      });

      const validSizes = sizes.filter(
        (size) => size.name?.trim() || size.price,
      );
      validSizes.forEach((size, index) => {
        Object.entries(size).forEach(([k, v]) => {
          if (v) formData.append(`sizes[${index}][${k}]`, v);
        });
      });

      gallery.forEach((item, index) => {
        if (item.image?.file) {
          formData.append(`gallery[${index}][image]`, item.image.file);
        }
      });

      await axios.patch(
        `vendor-product-edit/${userData?.vendor_id}/${product_pid}/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      Swal.fire({
        icon: "success",
        title: "Product Updated Successfully",
      });
      navigate("/vendor/products/");
    } catch (error) {
      console.error("Update error:", error.response?.data || error);
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update product.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row h-full">
          <Sidebar />
          <div className="md:w-3/4 lg:w-4/5 mt-6">
            <h2 className="text-2xl font-semibold mb-4">Update Product</h2>
            <div className="mb-4 text-center text-sm text-gray-600">
              Note: Specifications, Sizes, Colors, and Gallery images are
              optional.
            </div>
            <form onSubmit={handleSubmit} encType="multipart/form-data">
              {/* Tabs same as before */}
              <div className="flex justify-center mb-6 space-x-4">
                {/* ... your tab buttons ... */}
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
                {/* ... other tabs ... */}

                <div className="flex justify-center mt-6 mb-8">
                  {isLoading ? (
                    <button
                      disabled
                      className="w-1/2 bg-green-600 text-white px-4 py-2 rounded-lg opacity-50"
                    >
                      Updating...
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="w-1/2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Update Product <CheckCircle className="w-5 h-5 ml-2" />
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

export default UpdateProduct;
