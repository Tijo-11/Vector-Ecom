import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Bell, CheckCircle, X } from "lucide-react";
import moment from "moment";

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";
import log from "loglevel";

function Notifications() {
  const [unseenNotifications, setUnseenNotifications] = useState([]);
  const [seenNotifications, setSeenNotifications] = useState([]);
  const [notificationStats, setNotificationStats] = useState({});
  const [unseenTotalCount, setUnseenTotalCount] = useState(0);
  const [seenTotalCount, setSeenTotalCount] = useState(0);
  const [unseenCurrentPage, setUnseenCurrentPage] = useState(1);
  const [seenCurrentPage, setSeenCurrentPage] = useState(1);
  const [unseenHasNext, setUnseenHasNext] = useState(false);
  const [unseenHasPrev, setUnseenHasPrev] = useState(false);
  const [seenHasNext, setSeenHasNext] = useState(false);
  const [seenHasPrev, setSeenHasPrev] = useState(false);
  const [showSeenModal, setShowSeenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);

  const axios = apiInstance;
  const userData = UserData();
  const vendorId = userData?.vendor_id;

  if (userData?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  // URL constructors
  const getUnseenUrl = (page) => {
    const base = `vendor-notifications-unseen/${vendorId}/`;
    return page <= 1 ? base : `${base}?page=${page}`;
  };

  const getSeenUrl = (page) => {
    const base = `vendor-notifications-seen/${vendorId}/`;
    return page <= 1 ? base : `${base}?page=${page}`;
  };

  const fetchUnseenAndStats = async (page = unseenCurrentPage) => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const unseenUrl = getUnseenUrl(page);
      const [unseenRes, statsRes] = await Promise.all([
        axios.get(unseenUrl),
        axios.get(`vendor-notifications-summary/${vendorId}/`),
      ]);

      // Unseen notifications (paginated)
      const unseenData = unseenRes.data;
      const unseenList = Array.isArray(unseenData)
        ? unseenData
        : unseenData.results || [];
      setUnseenNotifications(unseenList);
      setUnseenTotalCount(unseenData.count ?? unseenList.length);
      setUnseenHasNext(!!unseenData.next);
      setUnseenHasPrev(!!unseenData.previous);
      setUnseenCurrentPage(page);

      // Stats
      const statsData = statsRes.data;
      const statsObj = Array.isArray(statsData)
        ? statsData[0] || {}
        : statsData.results?.[0] || statsData[0] || {};
      setNotificationStats(statsObj);
    } catch (error) {
      log.error("Error fetching unseen notifications/stats:", error);
      setUnseenNotifications([]);
      setNotificationStats({});
    } finally {
      setLoading(false);
    }
  };

  const fetchSeenNotifications = async (page = seenCurrentPage) => {
    if (!vendorId) return;
    setModalLoading(true);
    try {
      const seenUrl = getSeenUrl(page);
      const seenRes = await axios.get(seenUrl);

      const seenData = seenRes.data;
      const seenList = Array.isArray(seenData)
        ? seenData
        : seenData.results || [];
      setSeenNotifications(seenList);
      setSeenTotalCount(seenData.count ?? seenList.length);
      setSeenHasNext(!!seenData.next);
      setSeenHasPrev(!!seenData.previous);
      setSeenCurrentPage(page);
    } catch (error) {
      log.error("Error fetching seen notifications:", error);
      setSeenNotifications([]);
    } finally {
      setModalLoading(false);
    }
  };

  // Initial load: unseen + stats
  useEffect(() => {
    fetchUnseenAndStats(1);
  }, [vendorId]);

  // Load unseen when page changes
  useEffect(() => {
    fetchUnseenAndStats(unseenCurrentPage);
  }, [unseenCurrentPage]);

  // Load seen when modal opens
  useEffect(() => {
    if (showSeenModal) {
      fetchSeenNotifications(1);
    }
  }, [showSeenModal]);

  // Load seen when page changes in modal
  useEffect(() => {
    if (showSeenModal) {
      fetchSeenNotifications(seenCurrentPage);
    }
  }, [seenCurrentPage]);

  const handleNotificationSeenStatus = async (notiId) => {
    try {
      await axios.get(
        `vendor-notifications-mark-as-seen/${vendorId}/${notiId}/`,
      );
      // Refresh unseen list and stats
      await fetchUnseenAndStats(unseenCurrentPage);
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
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-lg text-gray-600">Loading notifications...</p>
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
              <h5 className="text-lg font-semibold p-4 border-b bg-gray-50">
                Unread Notifications ({unseenTotalCount})
              </h5>
              <div className="overflow-x-auto">
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
                    {unseenNotifications.length > 0 ? (
                      unseenNotifications.map((noti) => (
                        <tr key={noti.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {noti.order && <p>New Order {noti?.order?.oid}</p>}
                          </td>
                          <td className="px-4 py-3">
                            {noti.order_item && (
                              <p>
                                You've got a new order for{" "}
                                <b>{noti?.order_item?.product?.title}</b>
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center text-red-600 font-medium">
                              <EyeOff className="w-4 h-4 mr-1" /> Unread
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {moment(noti.date).format("MMM DD, YYYY")}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                handleNotificationSeenStatus(noti.id)
                              }
                              className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
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

                {/* Pagination for Unseen */}
                {unseenTotalCount > unseenNotifications.length && (
                  <div className="flex justify-center items-center py-4 border-t bg-gray-50 gap-6">
                    <button
                      onClick={() =>
                        setUnseenCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={!unseenHasPrev || loading}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                    >
                      Previous
                    </button>

                    <span className="text-lg font-medium">
                      Page {unseenCurrentPage} ({unseenTotalCount} total unread)
                    </span>

                    <button
                      onClick={() => setUnseenCurrentPage((prev) => prev + 1)}
                      disabled={!unseenHasNext || loading}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Button to View All Read Notifications */}
            <div className="mb-6">
              <button
                onClick={() => setShowSeenModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow transition"
              >
                View All Read Notifications ({notificationStats?.read_noti || 0}
                )
              </button>
            </div>
          </>
        )}

        {/* Modal for Read Notifications */}
        {showSeenModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-4 border-b">
                <h5 className="text-lg font-semibold">
                  All Read Notifications ({seenTotalCount})
                </h5>
                <button onClick={() => setShowSeenModal(false)}>
                  <X className="w-6 h-6 text-gray-600 hover:text-gray-800" />
                </button>
              </div>

              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                  <p className="text-lg text-gray-600">
                    Loading read notifications...
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
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
                                {noti.order && (
                                  <p>New Order {noti?.order?.oid}</p>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {noti.order_item && (
                                  <p>
                                    You've got a new order for{" "}
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

                  {/* Pagination for Seen in Modal */}
                  {seenTotalCount > seenNotifications.length && (
                    <div className="flex justify-center items-center mt-6 py-4 border-t bg-gray-50 gap-6">
                      <button
                        onClick={() =>
                          setSeenCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={!seenHasPrev || modalLoading}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                      >
                        Previous
                      </button>

                      <span className="text-lg font-medium">
                        Page {seenCurrentPage} ({seenTotalCount} total read)
                      </span>

                      <button
                        onClick={() => setSeenCurrentPage((prev) => prev + 1)}
                        disabled={!seenHasNext || modalLoading}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
