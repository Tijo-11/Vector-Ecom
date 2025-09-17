import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ShoppingCart, Plus, Edit } from "lucide-react";

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";

function OrderDetail() {
  const [order, setOrder] = useState({});
  const [orderItems, setOrderItems] = useState([]);

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const axios = apiInstance;
  const userData = UserData();
  const param = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `vendor/orders/${userData?.vendor_id}/${param.oid}`
        );
        setOrder(response.data);
        setOrderItems(response.data.orderitem);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto px-4" id="main">
      <div className="flex flex-col md:flex-row h-full">
        <Sidebar />
        <div className="md:w-3/4 lg:w-5/6 mt-4">
          <main className="mb-10">
            {/* Summary Section */}
            <section className="mb-8">
              <h3 className="flex items-center text-xl font-semibold mb-5">
                <ShoppingCart className="text-blue-600 mr-2" /> #{order.oid}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-teal-100 rounded-lg shadow p-4">
                  <p className="text-gray-600">Total</p>
                  <h2 className="text-xl font-bold">₹{order?.total}</h2>
                </div>
                <div className="bg-purple-100 rounded-lg shadow p-4">
                  <p className="text-gray-600">Payment Status</p>
                  <h2 className="text-xl font-bold">
                    {order?.payment_status?.toUpperCase()}
                  </h2>
                </div>
                <div className="bg-blue-100 rounded-lg shadow p-4">
                  <p className="text-gray-600">Order Status</p>
                  <h2 className="text-xl font-bold">{order.order_status}</h2>
                </div>
                <div className="bg-green-100 rounded-lg shadow p-4">
                  <p className="text-gray-600">Shipping Amount</p>
                  <h2 className="text-xl font-bold">
                    ₹{order.shipping_amount}
                  </h2>
                </div>
                <div className="bg-cyan-100 rounded-lg shadow p-4">
                  <p className="text-gray-600">Tax Fee</p>
                  <h2 className="text-xl font-bold">₹{order.tax_fee}</h2>
                </div>
                <div className="bg-pink-100 rounded-lg shadow p-4">
                  <p className="text-gray-600">Service Fee</p>
                  <h2 className="text-xl font-bold">₹{order.service_fee}</h2>
                </div>
                <div className="bg-indigo-100 rounded-lg shadow p-4">
                  <p className="text-gray-600">Discount</p>
                  <h2 className="text-xl font-bold">₹{order.saved}</h2>
                </div>
              </div>
            </section>

            {/* Order Items Section */}
            <section>
              <div className="rounded-lg shadow p-6 bg-white">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left">Product</th>
                      <th className="py-3 px-4 text-left">Price</th>
                      <th className="py-3 px-4 text-left">Qty</th>
                      <th className="py-3 px-4 text-left">Total</th>
                      <th className="py-3 px-4 text-left text-red-600">
                        Discount
                      </th>
                      <th className="py-3 px-4 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems?.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <img
                              src={item?.product?.image}
                              alt={item?.product?.title}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <Link
                              to={`/orders/${item.product.slug}`}
                              className="ml-3 font-medium text-gray-800 hover:underline"
                            >
                              {item?.product?.title}
                            </Link>
                          </div>
                        </td>
                        <td className="py-3 px-4">₹{item.product.price}</td>
                        <td className="py-3 px-4">{item.qty}</td>
                        <td className="py-3 px-4">₹{item.sub_total}</td>
                        <td className="py-3 px-4 text-red-600">
                          -₹{item.saved}
                        </td>
                        <td className="py-3 px-4">
                          {item.tracking_id == null ||
                          item.tracking_id === "undefined" ? (
                            <Link
                              to={`/vendor/orders/${param.oid}/${item.id}/`}
                              className="flex items-center bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                            >
                              <Plus className="w-4 h-4 mr-1" /> Add Tracking
                            </Link>
                          ) : (
                            <Link
                              to={`/vendor/orders/${param.oid}/${item.id}/`}
                              className="flex items-center bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700"
                            >
                              <Edit className="w-4 h-4 mr-1" /> Edit Tracking
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}

                    {orderItems.length < 1 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center py-6 text-gray-600"
                        >
                          No Order Item
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
