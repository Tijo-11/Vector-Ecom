import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import { Eye, FileText } from "lucide-react";
import UserData from "../../plugin/UserData";
import moment from "moment";
import { Link } from "react-router-dom";
import log from "loglevel";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const axios = apiInstance;
  const userData = UserData();

  useEffect(() => {
    axios
      .get(`customer/orders/${userData?.user_id}/`)
      .then((res) => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch((error) => {
        log.error("Error fetching orders:", error);
        setLoading(false);
      });
  }, []);

  log.debug(orders);

  const statusCounts = orders.reduce((count, order) => {
    const status = order.order_status;
    count[status] = (count[status] || 0) + 1;
    return count;
  }, {});

  return (
    <div className="container mx-auto mt-10 px-4">
      {loading ? (
        <div className="text-center">
          <img
            className="mx-auto"
            src="https://cdn.dribbble.com/users/2046015/screenshots/5973727/06-loader_telega.gif"
            alt="Loading"
          />
        </div>
      ) : (
        <section>
          <div className="flex flex-col lg:flex-row gap-6">
            <Sidebar />
            <div className="flex-1">
              <main className="mb-10">
                {/* Section: Summary */}
                <section className="mb-8">
                  <h3 className="mb-6 text-2xl font-semibold flex items-center gap-2">
                    <i className="fas fa-shopping-cart text-blue-600" /> Orders
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Orders */}
                    <div className="rounded-xl shadow p-5 bg-teal-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="mb-1 text-gray-700">Total Orders</p>
                          <h2 className="text-2xl font-bold">
                            {orders.length}
                          </h2>
                        </div>
                        <div className="p-3 rounded-full bg-teal-200">
                          <i className="fas fa-shopping-cart text-emerald-900 text-xl" />
                        </div>
                      </div>
                    </div>
                    {/* Pending Delivery */}
                    <div className="rounded-xl shadow p-5 bg-purple-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="mb-1 text-gray-700">Pending Delivery</p>
                          <h2 className="text-2xl font-bold">
                            {statusCounts.Pending || 0}
                          </h2>
                        </div>
                        <div className="p-3 rounded-full bg-purple-200">
                          <i className="fas fa-clock text-purple-700 text-xl" />
                        </div>
                      </div>
                    </div>
                    {/* Fulfilled Orders */}
                    <div className="rounded-xl shadow p-5 bg-blue-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="mb-1 text-gray-700">Fulfilled Orders</p>
                          <h2 className="text-2xl font-bold">
                            {statusCounts.Fulfilled || 0}
                          </h2>
                        </div>
                        <div className="p-3 rounded-full bg-blue-200">
                          <i className="fas fa-check-circle text-blue-800 text-xl" />
                        </div>
                      </div>
                    </div>
                    {/* Completed Orders */}
                    <div className="rounded-xl shadow p-5 bg-green-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="mb-1 text-gray-700">Completed Orders</p>
                          <h2 className="text-2xl font-bold">
                            {statusCounts.Completed || 0}
                          </h2>
                        </div>
                        <div className="p-3 rounded-full bg-green-200">
                          <i className="fas fa-check-double text-green-800 text-xl" />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section: Orders Table */}
                <section>
                  <div className="rounded-xl shadow p-5 bg-white overflow-x-auto">
                    <table className="table-auto w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-left">
                          <th className="p-3 font-medium">Order ID</th>
                          <th className="p-3 font-medium">Payment Status</th>
                          <th className="p-3 font-medium">Order Status</th>
                          <th className="p-3 font-medium">Total</th>
                          <th className="p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <p className="font-semibold">#{o.oid}</p>
                              <p className="text-gray-500 text-sm">
                                {moment(o.date).format("MM/DD/YYYY")}
                              </p>
                            </td>
                            <td className="p-3">
                              <p className="uppercase font-medium text-gray-700">
                                {o.payment_status?.toUpperCase()}
                              </p>
                            </td>
                            <td className="p-3">
                              <p className="text-gray-700">{o.order_status}</p>
                            </td>
                            <td className="p-3">
                              <span className="font-medium">₹{o.total}</span>
                            </td>
                            <td className="p-3">
                              <Link
                                className="text-blue-600 hover:underline flex items-center gap-1"
                                to={`/customer/order/detail/${o.oid}/`}
                              >
                                View <Eye className="w-5 h-5" />
                              </Link>
                              <Link
                                className="text-blue-600 hover:underline flex items-center gap-1"
                                to={`/customer/order/invoice/${o.oid}/`}
                              >
                                Invoice <FileText className="w-5 h-5" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </main>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Orders;
