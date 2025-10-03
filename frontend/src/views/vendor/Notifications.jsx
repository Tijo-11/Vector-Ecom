import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Bell, CheckCircle, X } from "lucide-react";
import moment from "moment";
import { Link } from "react-router-dom";

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [notificationStats, setNotificationStats] = useState({});
  const [seenNotification, setSeenNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const axios = apiInstance;
  const userData = UserData();

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const fetchUnseenData = async () => {
    try {
      const response = await axios.get(
        `vendor-notifications-unseen/${userData?.vendor_id}/`
      );
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchSeenData = async () => {
    try {
      const response = await axios.get(
        `vendor-notifications-seen/${userData?.vendor_id}/`
      );
      setSeenNotifications(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchStatsData = async () => {
    try {
      const response = await axios.get(
        `vendor-notifications-summary/${userData?.vendor_id}/`
      );
      setNotificationStats(response.data[0]);
    } catch (error) {
      console.error("Error fetching stats data:", error);
    }
  };

  useEffect(() => {
    fetchUnseenData();
    fetchSeenData();
    fetchStatsData();
  }, [userData?.vendor_id]);

  const handleNotificationSeenStatus = async (notiId) => {
    try {
      await axios.get(
        `vendor-notifications-mark-as-seen/${userData?.vendor_id}/${notiId}/`
      );
      await fetchStatsData();
      await fetchUnseenData();
      await fetchSeenData();
    } catch (error) {
      console.error("Error marking notification as seen:", error);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <h4 className="flex items-center text-xl font-semibold mb-4">
          <Bell className="w-6 h-6 mr-2 text-blue-600" /> Notifications
        </h4>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-500 text-white rounded-xl shadow p-6">
            <EyeOff className="w-10 h-10 opacity-30 mb-2" />
            <h6 className="uppercase tracking-wide text-sm">
              Unread Notifications
            </h6>
            <h1 className="text-3xl font-bold">
              {notificationStats?.un_read_noti}
            </h1>
          </div>
          <div className="bg-green-500 text-white rounded-xl shadow p-6">
            <Eye className="w-10 h-10 opacity-30 mb-2" />
            <h6 className="uppercase tracking-wide text-sm">
              Read Notifications
            </h6>
            <h1 className="text-3xl font-bold">
              {notificationStats?.read_noti}
            </h1>
          </div>
          <div className="bg-blue-500 text-white rounded-xl shadow p-6">
            <Bell className="w-10 h-10 opacity-30 mb-2" />
            <h6 className="uppercase tracking-wide text-sm">
              All Notifications
            </h6>
            <h1 className="text-3xl font-bold">
              {notificationStats?.all_noti}
            </h1>
          </div>
        </div>

        {/* Notifications Table */}
        <div className="bg-white shadow rounded-xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Message</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {notifications?.map((noti) => (
                <tr key={noti.id}>
                  <td className="px-4 py-2">
                    {noti.order && <p>New Order {noti?.order?.oid}</p>}
                  </td>
                  <td className="px-4 py-2">
                    {noti.order_item && (
                      <p>
                        You&apos;ve got a new order for{" "}
                        <b>{noti?.order_item?.product?.title}</b>
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {noti.seen ? (
                      <span className="flex items-center text-green-600 font-medium">
                        <Eye className="w-4 h-4 mr-1" /> Read
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600 font-medium">
                        <EyeOff className="w-4 h-4 mr-1" /> Unread
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {moment(noti.date).format("MMM/DD/YYYY")}
                  </td>
                  <td className="px-4 py-2">
                    {noti.seen ? (
                      <button
                        disabled
                        className="bg-green-500 text-white p-2 rounded"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleNotificationSeenStatus(noti.id)}
                        className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {notifications.length < 1 && (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-4 text-gray-500 font-medium"
                  >
                    No Notifications Yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Button to View All Read Notifications */}
        <div className="mt-4">
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
          >
            View All Read Notifications
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-lg font-semibold">
                  All Read Notifications
                </h5>
                <button onClick={() => setShowModal(false)}>
                  <X className="w-6 h-6 text-gray-600 hover:text-gray-800" />
                </button>
              </div>

              <table className="w-full border-collapse">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Message</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {seenNotification?.map((noti) => (
                    <tr key={noti.id}>
                      <td className="px-4 py-2">
                        {noti.order && <p>New Order {noti?.order?.oid}</p>}
                      </td>
                      <td className="px-4 py-2">
                        {noti.order_item && (
                          <p>
                            You&apos;ve got a new order for{" "}
                            <b>{noti?.order_item?.product?.title}</b>
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {noti.seen ? (
                          <span className="flex items-center text-green-600 font-medium">
                            <Eye className="w-4 h-4 mr-1" /> Read
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600 font-medium">
                            <EyeOff className="w-4 h-4 mr-1" /> Unread
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {moment(noti.date).format("MMM/DD/YYYY")}
                      </td>
                    </tr>
                  ))}

                  {seenNotification.length < 1 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-4 text-gray-500 font-medium"
                      >
                        No Read Notifications Yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
