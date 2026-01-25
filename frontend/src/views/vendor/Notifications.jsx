import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Bell, CheckCircle, X, Loader2 } from "lucide-react";
import moment from "moment";
import { Link } from "react-router-dom";

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";
import log from "loglevel";

function Notifications() {
  const [notifications, setNotifications] = useState([]); // Unseen
  const [seenNotifications, setSeenNotifications] = useState([]); // Seen
  const [notificationStats, setNotificationStats] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const axios = apiInstance;
  const userData = UserData();

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [unseenRes, seenRes, statsRes] = await Promise.all([
        axios.get(`vendor-notifications-unseen/${userData?.vendor_id}/`),
        axios.get(`vendor-notifications-seen/${userData?.vendor_id}/`),
        axios.get(`vendor-notifications-summary/${userData?.vendor_id}/`),
      ]);
      setNotifications(unseenRes.data);
      setSeenNotifications(seenRes.data);
      setNotificationStats(statsRes.data[0] || {});
    } catch (error) {
      log.error("Error fetching notifications data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [userData?.vendor_id]);

  const handleNotificationSeenStatus = async (notiId) => {
    try {
      await axios.get(
        `vendor-notifications-mark-as-seen/${userData?.vendor_id}/${notiId}/`,
      );
      await fetchAllData(); // Refresh everything after marking as seen
    } catch (error) {
      log.error("Error marking notification as seen:", error);
    }
  };

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <h4 className="flex items-center text-xl font-semibold mb-6">
          <Bell className="w-6 h-6 mr-2 text-blue-600" /> Notifications
        </h4>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-[60vh]">
            <Loader2 className="animate-spin text-blue-600" size={48} />
            <p className="mt-4 text-lg text-gray-600">
              Loading notifications...
            </p>
          </div>
        ) : (
          <>
            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-red-500 text-white rounded-xl shadow p-6">
                <EyeOff className="w-10 h-10 opacity-30 mb-2" />
                <h6 className="uppercase tracking-wide text-sm">
                  Unread Notifications
                </h6>
                <h1 className="text-3xl font-bold">
                  {notificationStats?.un_read_noti || 0}
                </h1>
              </div>
              <div className="bg-green-500 text-white rounded-xl shadow p-6">
                <Eye className="w-10 h-10 opacity-30 mb-2" />
                <h6 className="uppercase tracking-wide text-sm">
                  Read Notifications
                </h6>
                <h1 className="text-3xl font-bold">
                  {notificationStats?.read_noti || 0}
                </h1>
              </div>
              <div className="bg-blue-500 text-white rounded-xl shadow p-6">
                <Bell className="w-10 h-10 opacity-30 mb-2" />
                <h6 className="uppercase tracking-wide text-sm">
                  All Notifications
                </h6>
                <h1 className="text-3xl font-bold">
                  {notificationStats?.all_noti || 0}
                </h1>
              </div>
            </div>

            {/* Unseen Notifications Table */}
            <div className="bg-white shadow rounded-xl overflow-hidden mb-6">
              <h5 className="text-lg font-semibold p-4 border-b">
                Unread Notifications
              </h5>
              <table className="w-full border-collapse">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Message</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {notifications.length > 0 ? (
                    notifications.map((noti) => (
                      <tr key={noti.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {noti.order && <p>New Order {noti?.order?.oid}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {noti.order_item && (
                            <p>
                              You&apos;ve got a new order for{" "}
                              <b>{noti?.order_item?.product?.title}</b>
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
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
                        <td className="px-4 py-3">
                          {moment(noti.date).format("MMM DD, YYYY")}
                        </td>
                        <td className="px-4 py-3">
                          {noti.seen ? (
                            <button
                              disabled
                              className="bg-green-500 text-white p-2 rounded opacity-70 cursor-not-allowed"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleNotificationSeenStatus(noti.id)
                              }
                              className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-8 text-gray-500"
                      >
                        No unread notifications
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Button to View All Read Notifications */}
            <div className="mb-6">
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow transition"
              >
                View All Read Notifications ({seenNotifications.length})
              </button>
            </div>
          </>
        )}

        {/* Modal for Read Notifications */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-4 border-b">
                <h5 className="text-lg font-semibold">
                  All Read Notifications ({seenNotifications.length})
                </h5>
                <button onClick={() => setShowModal(false)}>
                  <X className="w-6 h-6 text-gray-600 hover:text-gray-800" />
                </button>
              </div>

              <table className="w-full border-collapse">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Message</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {seenNotifications.length > 0 ? (
                    seenNotifications.map((noti) => (
                      <tr key={noti.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {noti.order && <p>New Order {noti?.order?.oid}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {noti.order_item && (
                            <p>
                              You&apos;ve got a new order for{" "}
                              <b>{noti?.order_item?.product?.title}</b>
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center text-green-600 font-medium">
                            <Eye className="w-4 h-4 mr-1" /> Read
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {moment(noti.date).format("MMM DD, YYYY")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-8 text-gray-500"
                      >
                        No read notifications yet
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
