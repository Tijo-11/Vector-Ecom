import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ShoppingCart,
  Truck,
  Link as LinkIcon,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";

function OrderItemDetail() {
  const [orderItems, setOrderItems] = useState([]);
  const [order, setOrder] = useState([]);
  const [courier, setCourier] = useState([]);
  const [trackingData, setTrackingData] = useState({});
  const [loading, setLoading] = useState(false);

  const axios = apiInstance;
  const userData = UserData();
  const param = useParams();

  const handleTrackingDataChange = (event) => {
    setTrackingData({
      ...trackingData,
      [event.target.name]:
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value,
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `vendor/order-item-detail/${param.id}/`
        );
        setOrder(response.data.order);
        setOrderItems(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const fetchCourier = async () => {
      try {
        const response = await axios.get(`vendor/couriers/`);
        setCourier(response.data);
      } catch (error) {
        console.error("Error fetching courier:", error);
      }
    };

    fetchCourier();
    fetchData();
  }, []);

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formdata = new FormData();
      formdata.append("tracking_id", trackingData.tracking_id);
      formdata.append("delivery_couriers", trackingData.delivery_couriers);
      formdata.append("notify_buyer", trackingData.notify_buyer);

      await axios
        .patch(`vendor/order-item-detail/${param.id}/`, formdata)
        .then((res) => {
          setLoading(false);
          Swal.fire({
            icon: "success",
            title: "Tracking ID Added",
          });
        });
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4" id="main">
      <div className="flex flex-col md:flex-row h-full">
        <Sidebar />
        <div className="md:w-3/4 lg:w-5/6 mt-4">
          <main className="mb-10">
            <section className="mb-6">
              <h3 className="flex items-center text-xl font-semibold mb-3">
                <ShoppingCart className="text-blue-600 mr-2" /> #{order.oid}
              </h3>
            </section>

            <section>
              <div className="rounded-lg shadow p-6 bg-white">
                <form onSubmit={handleOnSubmit} className="space-y-5">
                  {/* Courier Select */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      <Truck className="inline-block w-5 h-5 mr-1 text-gray-600" />
                      Choose Delivery Courier
                    </label>
                    <select
                      required
                      onChange={handleTrackingDataChange}
                      name="delivery_couriers"
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Select Delivery Courier</option>
                      {courier.map((c, index) => (
                        <option key={index} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      <a href="#" className="text-blue-600 hover:underline">
                        Contact us
                      </a>{" "}
                      if you can't find a shipping courier
                    </p>
                  </div>

                  {/* Tracking ID */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">
                      <LinkIcon className="inline-block w-5 h-5 mr-1 text-gray-600" />
                      Tracking ID
                    </label>
                    <input
                      type="text"
                      onChange={handleTrackingDataChange}
                      name="tracking_id"
                      placeholder={orderItems.tracking_id || "Add Tracking ID"}
                      defaultValue={orderItems.tracking_id || ""}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Notify Buyer */}
                  <div className="flex items-center">
                    <input
                      onChange={handleTrackingDataChange}
                      name="notify_buyer"
                      type="checkbox"
                      id="notify_buyer"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="notify_buyer"
                      className="ml-2 text-gray-700"
                    >
                      Notify Buyer
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3">
                    <Link
                      to={`/vendor/orders/${order.oid}/`}
                      className="flex items-center bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" /> Go Back
                    </Link>

                    {loading ? (
                      <button
                        type="submit"
                        disabled
                        className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg opacity-70 cursor-not-allowed"
                      >
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving Tracking Data
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Save Tracking Info
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default OrderItemDetail;
