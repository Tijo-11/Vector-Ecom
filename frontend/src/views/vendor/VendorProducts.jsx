import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, Pencil, Trash2 } from "lucide-react";

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";
import { deleteProduct } from "../../plugin/DeleteProduct";

function ProductsVendor() {
  const [products, setProducts] = useState([]);

  const axios = apiInstance;
  const userData = UserData();

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `vendor/products/${userData?.vendor_id}/`
      );
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteProduct = async (productPid) => {
    try {
      await deleteProduct(userData?.vendor_id, productPid);
      await fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const handleFilterProduct = async (param) => {
    try {
      const response = await axios.get(
        `vendor-product-filter/${userData?.vendor_id}?filter=${param}`
      );
      setProducts(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="w-full px-4" id="main">
      <div className="flex flex-row h-full">
        <div className="w-full" id="main">
          <div className="flex h-full">
            <Sidebar />
            <div className="flex-1 mt-4 px-4">
              <h4 className="text-xl font-semibold flex items-center mb-4">
                <i className="bi bi-grid mr-2" /> All Products
              </h4>

              <div className="flex flex-wrap gap-3 mb-6">
                {/* Filter Dropdown */}
                <div className="relative group">
                  <button
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
                    type="button"
                    id="dropdownMenuButton1"
                  >
                    Filter <i className="fas fa-sliders ml-2" />
                  </button>
                  <ul
                    className="absolute left-0 mt-1 hidden group-hover:block bg-white shadow-lg rounded-md z-10 w-40"
                    aria-labelledby="dropdownMenuButton1"
                  >
                    <li>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFilterProduct("no-filter")}
                      >
                        No Filter
                      </button>
                    </li>
                    <li>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFilterProduct("published")}
                      >
                        Status: Published
                      </button>
                    </li>
                    <li>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFilterProduct("draft")}
                      >
                        Status: In Draft
                      </button>
                    </li>
                    <li>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFilterProduct("in-review")}
                      >
                        Status: In-review
                      </button>
                    </li>
                    <li>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFilterProduct("disabled")}
                      >
                        Status: Disabled
                      </button>
                    </li>
                    <hr />
                    <li>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFilterProduct("latest")}
                      >
                        Date: Latest
                      </button>
                    </li>
                    <li>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFilterProduct("oldest")}
                      >
                        Date: Oldest
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Add Product Button */}
                <Link
                  to={"/vendor/product/new/"}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add Product
                </Link>
              </div>

              <hr className="my-6" />

              <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-800 text-white">
                      <tr>
                        <th className="py-3 px-4 text-left">#ID</th>
                        <th className="py-3 px-4 text-left">Name</th>
                        <th className="py-3 px-4 text-left">Price</th>
                        <th className="py-3 px-4 text-left">Quantity</th>
                        <th className="py-3 px-4 text-left">Orders</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products?.map((p, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <th className="py-3 px-4 font-medium" scope="row">
                            #{p.sku}
                          </th>
                          <td className="py-3 px-4">{p.title}</td>
                          <td className="py-3 px-4">₹{p.price}</td>
                          <td className="py-3 px-4">{p.stock_qty}</td>
                          <td className="py-3 px-4">{p.order_count}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-200">
                              {p?.status?.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Link
                                to={`/detail/${p.slug}`}
                                className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 flex items-center justify-center"
                              >
                                <Eye size={16} />
                              </Link>
                              <Link
                                to={`/vendor/product/update/${p.pid}/`}
                                className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 flex items-center justify-center"
                              >
                                <Pencil size={16} />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.pid)}
                                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 flex items-center justify-center"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {products?.length < 1 && (
                        <tr>
                          <td
                            colSpan="7"
                            className="text-center py-8 text-lg text-gray-500"
                          >
                            No Products Yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductsVendor;
