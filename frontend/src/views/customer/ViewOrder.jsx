// ViewOrder.jsx
import React, { useState, useEffect } from "react";
import apiInstance from "../../utils/axios";
import { Link, useParams } from "react-router-dom";
import log from "loglevel";

function ViewOrder() {
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const axios = apiInstance;
  const { order_oid } = useParams(); // Get order ID from URL
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`view-order/${order_oid}`);
        setOrder(res.data);
        setOrderItems(res.data.orderitem);
      } catch (err) {
        log.error("Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [order_oid, axios]);
  if (loading) {
    return (
      <div className="container mx-auto text-center">
        <img
          className="mx-auto"
          src="https://cdn.dribbble.com/users/2046015/screenshots/5973727/06-loader_telega.gif"
          alt="Loading"
        />
      </div>
    );
  }
  if (!order) {
    return <div className="text-center mt-10">Order not found.</div>;
  }
  return (
    <div>
      <main className="mt-5">
        <div className="container mx-auto">
          <div className="flex justify-center">
            <div className="w-full lg:w-3/4">
              <main className="mb-5">
                <div className="px-4">
                  {/* Section: Summary */}
                  <section className="mb-5">
                    <h3 className="mb-3 text-2xl font-bold">
                      <i className="fas fa-shopping-cart text-blue-600 mr-2" />{" "}
                      Order ID : {order.oid}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="rounded-lg shadow bg-teal-100 p-4">
                        <div className="flex items-center">
                          <div>
                            <p className="mb-1 text-sm">Original Total</p>
                            <h2 className="text-xl font-semibold">
                              ₹{order.initial_total}
                            </h2>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg shadow bg-purple-100 p-4">
                        <div className="flex items-center">
                          <div>
                            <p className="mb-1 text-sm">Saved</p>
                            <h2 className="text-xl font-semibold">
                              ₹{order.saved}
                            </h2>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg shadow bg-blue-100 p-4">
                        <div className="flex items-center">
                          <div>
                            <p className="mb-1 text-sm">
                              Subtotal (after discounts)
                            </p>
                            <h2 className="text-xl font-semibold">
                              ₹{order.sub_total}
                            </h2>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg shadow bg-green-100 p-4">
                        <div className="flex items-center">
                          <div>
                            <p className="mb-1 text-sm">Shipping Amount</p>
                            <h2 className="text-xl font-semibold">
                              ₹{order.shipping_amount}
                            </h2>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg shadow bg-indigo-100 p-4 mt-4">
                        <div className="flex items-center">
                          <div>
                            <p className="mb-1 text-sm">Grand Total</p>
                            <h2 className="text-xl font-semibold">
                              ₹{order.total}
                            </h2>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                  {/* Section: Order Items */}
                  <section>
                    <div className="rounded-lg shadow p-3 bg-white">
                      <div>
                        <table className="w-full text-left">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-3">Product</th>
                              <th className="p-3">Price</th>
                              <th className="p-3">Qty</th>
                              <th className="p-3">Subtotal</th>
                              <th className="p-3 text-red-600">Saved</th>
                              <th className="p-3">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orderItems?.map((item, index) => (
                              <tr key={index} className="border-b">
                                <td className="p-3">
                                  <div className="flex items-center">
                                    <img
                                      src={item?.product?.image}
                                      className="w-20 h-20 object-cover rounded-lg mr-2"
                                      alt=""
                                    />
                                    <Link
                                      to={`/detail/${item.product.slug}`}
                                      className="font-bold text-gray-800"
                                    >
                                      {item?.product?.title}
                                    </Link>
                                  </div>
                                </td>
                                <td className="p-3">₹{item.product.price}</td>
                                <td className="p-3">{item.qty}</td>
                                <td className="p-3">₹{item.sub_total}</td>
                                <td className="p-3 text-red-600">
                                  ₹{item.saved}
                                </td>
                                <td className="p-3">
                                  {item.tracking_id ? (
                                    <a
                                      className="btn bg-green-500 text-white text-sm hover:bg-green-600"
                                      target="_blank"
                                      href={`${item.delivery_couriers?.tracking_website}?${item.delivery_couriers?.url_parameter}=${item.tracking_id}`}
                                    >
                                      Track Item{" "}
                                      <i className="fas fa-location-arrow ml-1"></i>
                                    </a>
                                  ) : (
                                    <button
                                      className="btn bg-gray-400 text-white text-sm cursor-not-allowed"
                                      disabled
                                    >
                                      No Tracking Yet
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                </div>
              </main>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
export default ViewOrder;
