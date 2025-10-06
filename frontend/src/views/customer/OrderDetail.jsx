import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import moment from "moment";
import { Link, useParams } from "react-router-dom";
import log from "loglevel";

function OrderDetail() {
  const [order, setOrder] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const axios = apiInstance;
  const userData = UserData();
  const param = useParams();
  log.debug(param);

  useEffect(() => {
    axios
      .get(`customer/order/detail/${userData?.user_id}/${param?.order_oid}`)
      .then((res) => {
        setOrder(res.data);
        setOrderItems(res.data.orderitem);
        if (order) {
          setLoading(false);
        }
      });
  }, []);

  log.debug(order);

  return (
    <div>
      {loading === false && (
        <main className="mt-5">
          <div className="container mx-auto">
            <section>
              <div className="flex flex-col lg:flex-row">
                <Sidebar />
                <div className="lg:w-3/4 mt-1 lg:ml-4">
                  <main className="mb-5">
                    <div className="px-4">
                      {/* Section: Summary */}
                      <section className="mb-5">
                        <h3 className="mb-3 text-2xl font-bold">
                          <i className="fas fa-shopping-cart text-blue-600 mr-2" />{" "}
                          #wuriuiwer
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="rounded-lg shadow bg-teal-100 p-4">
                            <div className="flex items-center">
                              <div>
                                <p className="mb-1 text-sm">Total</p>
                                <h2 className="text-xl font-semibold">
                                  ₹{order.total}
                                </h2>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-lg shadow bg-purple-100 p-4">
                            <div className="flex items-center">
                              <div>
                                <p className="mb-1 text-sm">Payment Status</p>
                                <h2 className="text-xl font-semibold">
                                  {order.payment_status?.toUpperCase()}
                                </h2>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-lg shadow bg-blue-100 p-4">
                            <div className="flex items-center">
                              <div>
                                <p className="mb-1 text-sm">Order Status</p>
                                <h2 className="text-xl font-semibold">
                                  {order.order_status}
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
                          <div className="rounded-lg shadow bg-cyan-100 p-4 mt-4">
                            <div className="flex items-center">
                              <div>
                                <p className="mb-1 text-sm">Tax Fee</p>
                                <h2 className="text-xl font-semibold">
                                  ₹{order.tax_fee}
                                </h2>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-lg shadow bg-pink-100 p-4 mt-4">
                            <div className="flex items-center">
                              <div>
                                <p className="mb-1 text-sm">Service Fee</p>
                                <h2 className="text-xl font-semibold">
                                  ₹{order.service_fee}
                                </h2>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-lg shadow bg-indigo-100 p-4 mt-4">
                            <div className="flex items-center">
                              <div>
                                <p className="mb-1 text-sm">Discount Fee</p>
                                <h2 className="text-xl font-semibold">
                                  -₹{order.saved}
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
                                  <th className="p-3">Total</th>
                                  <th className="p-3 text-red-600">Discount</th>
                                  <th className="p-3">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {orderItems?.map((order, index) => (
                                  <tr key={index} className="border-b">
                                    <td className="p-3">
                                      <div className="flex items-center">
                                        <img
                                          src={order?.product?.image}
                                          className="w-20 h-20 object-cover rounded-lg mr-2"
                                          alt=""
                                        />
                                        <Link
                                          to={`/detail/${order.product.slug}`}
                                          className="font-bold text-gray-800"
                                        >
                                          {order?.product?.title}
                                        </Link>
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      ₹{order.product.price}
                                    </td>
                                    <td className="p-3">{order.qty}</td>
                                    <td className="p-3">₹{order.sub_total}</td>
                                    <td className="p-3 text-red-600">
                                      -₹{order.saved}
                                    </td>
                                    <td className="p-3">
                                      {order.tracking_id == null ||
                                      order.tracking_id === "undefined" ? (
                                        <button
                                          className="btn bg-gray-400 text-white text-sm cursor-not-allowed"
                                          disabled
                                        >
                                          No Tracking Yet{" "}
                                          <i className="fas fa-plus ml-1"></i>
                                        </button>
                                      ) : (
                                        <a
                                          className="btn bg-green-500 text-white text-sm hover:bg-green-600"
                                          target="_blank"
                                          href={`${order.delivery_couriers?.tracking_website}?${order.delivery_couriers?.url_parameter}=${order.tracking_id}`}
                                        >
                                          Track Item{" "}
                                          <i className="fas fa-location-arrow ml-1"></i>
                                        </a>
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
            </section>
          </div>
        </main>
      )}

      {loading === true && (
        <div className="container mx-auto text-center">
          <img
            className="mx-auto"
            src="https://cdn.dribbble.com/users/2046015/screenshots/5973727/06-loader_telega.gif"
            alt="Loading"
          />
        </div>
      )}
    </div>
  );
}

export default OrderDetail;
