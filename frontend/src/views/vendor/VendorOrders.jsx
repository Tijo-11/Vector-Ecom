import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import { ShoppingCart, Eye } from "lucide-react";

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";
import log from "loglevel";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true); // ← New loading state

  const axios = apiInstance;
  const userData = UserData();

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `vendor/orders/${userData?.vendor_id}/`,
        );
        setOrders(response.data);
      } catch (error) {
        log.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterOrders = async (param) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `vendor/orders-filter/${userData?.vendor_id}?filter=${param}`,
      );
      setOrders(response.data);
    } catch (error) {
      log.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-4" id="main">
      <div className="flex flex-row h-full">
        <div className="w-full" id="main">
          <div className="flex h-full">
            <Sidebar />
            <div className="flex-1 mt-4 px-4">
              <h4 className="text-xl font-semibold flex items-center">
                <i className="bi bi-grid mr-2" /> All Orders
              </h4>

              <div className="flex flex-wrap gap-3 relative py-4">
                {/* Filter Dropdown */}
                <div className="relative group">
                  <button
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center mt-3 mb-3 md:mt-0 md:mb-0"
                    type="button"
                    id="dropdownMenuButton1"
                  >
                    Filter <i className="fas fa-sliders ml-2" />
                  </button>
                  <ul
                    className="absolute left-0 mt-1 hidden group-hover:block bg-white shadow-lg rounded-md z-10 w-48"
                    aria-labelledby="dropdownMenuButton1"
                  >
                    <li>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFilterOrders("no-filter")}
                      >
                        No Filter
                      </button>
                    </li>
                    <li>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFilterOrders("pending")}
                      >
                        Payment Status: Pending
                      </button>
                    </li>
                    <li>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFilterOrders("paid")}
                      >
                        Payment Status: Paid
                      </button>
                    </li>
                    <li>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFilterOrders("processing")}
                      >
                        Payment Status: Processing
                      </button>
                    </li>
                    <li>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFilterOrders("cancelled")}
                      >
                        Payment Status: Cancelled
                      </button>
                    </li>
                    <li>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFilterOrders("Fulfilled")}
                      >
                        Order Status: Fulfilled
                      </button>
                    </li>
                    <li>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFilterOrders("Cancelled")}
                      >
                        Order Status: Cancelled
                      </button>
                    </li>
                    <li>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFilterOrders("Pending")}
                      >
                        Order Status: Pending
                      </button>
                    </li>
                    <hr />
                    <li>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFilterOrders("latest")}
                      >
                        Date: Latest
                      </button>
                    </li>
                    <li>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                        onClick={() => handleFilterOrders("oldest")}
                      >
                        Date: Oldest
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Table Container */}
              <div className="mt-2 mb-3">
                {loading ? (
                  // ← Centered spinner while loading
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                    <p className="text-lg text-gray-600">Loading orders...</p>
                  </div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-800 text-white">
                      <tr>
                        <th className="py-2 px-4 text-left">#ID</th>
                        <th className="py-2 px-4 text-left">Name</th>
                        <th className="py-2 px-4 text-left">Date</th>
                        <th className="py-2 px-4 text-left">Status</th>
                        <th className="py-2 px-4 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders?.map((o, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 px-4">#{o.oid}</td>
                          <td className="py-2 px-4">{o.full_name}</td>
                          <td className="py-2 px-4">
                            {moment(o.date).format("MM/DD/YYYY")}
                          </td>
                          <td className="py-2 px-4">
                            {o.order_status?.toUpperCase()}
                          </td>
                          <td className="py-2 px-4 flex space-x-2">
                            <Link
                              to={`/vendor/orders/${o.oid}/`}
                              className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 flex items-center justify-center"
                            >
                              <Eye size={16} />
                            </Link>
                          </td>
                        </tr>
                      ))}

                      {orders?.length < 1 && (
                        <tr>
                          <td
                            colSpan="5"
                            className="text-center py-8 text-lg text-gray-500"
                          >
                            No Orders Yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Orders;
