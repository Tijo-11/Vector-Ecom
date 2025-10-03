import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import { ShoppingCart, Eye } from "lucide-react";

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false); // 👈 dropdown state

  const axios = apiInstance;
  const userData = UserData();

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `vendor/orders/${userData?.vendor_id}/`
        );
        setOrders(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleFilterOrders = async (param) => {
    try {
      const response = await axios.get(
        `vendor/orders-filter/${userData?.vendor_id}?filter=${param}`
      );
      setOrders(response.data);
      setIsFilterOpen(false); // 👈 close dropdown after choosing
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="container mx-auto px-4" id="main">
      <div className="flex flex-col md:flex-row h-full">
        <Sidebar />
        <div className="md:w-3/4 lg:w-5/6 mt-4">
          <div className="mb-10">
            <h4 className="flex items-center text-xl font-semibold mb-4">
              <ShoppingCart className="text-blue-600 mr-2" /> All Orders
            </h4>
            <div className="flex flex-col md:flex-row md:items-center md:space-x-2 relative py-4">
              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  className="bg-gray-600 text-white px-12 py-2 mx-2 rounded-md hover:bg-gray-700 flex items-center mt-3 mb-3 md:mt-0 md:mb-0"
                  type="button"
                  onClick={() => setIsFilterOpen((prev) => !prev)} // 👈 toggle
                >
                  Filter
                  <i className="fas fa-sliders ml-4 " />
                </button>

                {isFilterOpen && (
                  <ul className="absolute left-0 mt-1 bg-white shadow-lg rounded-md z-10 w-40">
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
                )}
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto rounded-lg shadow">
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
                    <tr
                      key={index}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="py-2 px-4">#{o.oid}</td>
                      <td className="py-2 px-4">{o.full_name}</td>
                      <td className="py-2 px-4">
                        {moment(o.date).format("MM/DD/YYYY")}
                      </td>
                      <td className="py-2 px-4">{o.order_status}</td>
                      <td className="py-2 px-4">
                        <Link
                          to={`/vendor/orders/${o.oid}/`}
                          className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 inline-flex items-center"
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
                        className="text-center py-6 text-lg text-gray-600"
                      >
                        No orders yet
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
  );
}

export default Orders;
