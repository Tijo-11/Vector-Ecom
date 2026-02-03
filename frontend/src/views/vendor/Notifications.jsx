import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Bell, CheckCircle, X, ChevronLeft, ChevronRight, Package } from "lucide-react";
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

      const unseenData = unseenRes.data;
      const unseenList = Array.isArray(unseenData) ? unseenData : unseenData.results || [];
      setUnseenNotifications(unseenList);
      setUnseenTotalCount(unseenData.count ?? unseenList.length);
      setUnseenHasNext(!!unseenData.next);
      setUnseenHasPrev(!!unseenData.previous);
      setUnseenCurrentPage(page);

      const statsData = statsRes.data;
      const statsObj = Array.isArray(statsData) ? statsData[0] || {} : statsData.results?.[0] || statsData[0] || {};
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
      const seenList = Array.isArray(seenData) ? seenData : seenData.results || [];
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

  useEffect(() => {
    fetchUnseenAndStats(1);
  }, [vendorId]);

  useEffect(() => {
    fetchUnseenAndStats(unseenCurrentPage);
  }, [unseenCurrentPage]);

  useEffect(() => {
    if (showSeenModal) {
      fetchSeenNotifications(1);
    }
  }, [showSeenModal]);

  useEffect(() => {
    if (showSeenModal) {
      fetchSeenNotifications(seenCurrentPage);
    }
  }, [seenCurrentPage]);

  const handleNotificationSeenStatus = async (notiId) => {
    try {
      await axios.get(`vendor-notifications-mark-as-seen/${vendorId}/${notiId}/`);
      await fetchUnseenAndStats(unseenCurrentPage);
    } catch (error) {
      log.error("Error marking notification as seen:", error);
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8 lg:p-12 overflow-x-hidden">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="w-7 h-7 text-blue-600" />
            Notifications
          </h1>
          <p className="text-gray-500 mt-1">Stay updated with your latest orders and activities.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10">
                  <EyeOff className="w-32 h-32 -mr-8 -mt-8" />
                </div>
                <div className="relative z-10">
                  <p className="text-red-100 font-medium uppercase tracking-wider text-sm flex items-center gap-2">
                    <EyeOff size={16} /> Unread
                  </p>
                  <h2 className="text-4xl font-bold mt-2">{notificationStats?.un_read_noti || 0}</h2>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10">
                  <Eye className="w-32 h-32 -mr-8 -mt-8" />
                </div>
                <div className="relative z-10">
                  <p className="text-green-100 font-medium uppercase tracking-wider text-sm flex items-center gap-2">
                    <Eye size={16} /> Read
                  </p>
                  <h2 className="text-4xl font-bold mt-2">{notificationStats?.read_noti || 0}</h2>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10">
                  <Bell className="w-32 h-32 -mr-8 -mt-8" />
                </div>
                <div className="relative z-10">
                  <p className="text-blue-100 font-medium uppercase tracking-wider text-sm flex items-center gap-2">
                    <Bell size={16} /> Total
                  </p>
                  <h2 className="text-4xl font-bold mt-2">{notificationStats?.all_noti || 0}</h2>
                </div>
              </div>
            </div>

            {/* Unread Notifications */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <EyeOff size={20} className="text-red-500" />
                  Unread Notifications
                  <span className="ml-2 px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-sm">{unseenTotalCount}</span>
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {unseenNotifications.length > 0 ? (
                      unseenNotifications.map((noti) => (
                        <tr key={noti.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-50 rounded-lg">
                                <Package size={18} className="text-blue-600" />
                              </div>
                              <span className="font-medium text-gray-900">
                                {noti.order && `Order ${noti?.order?.oid}`}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {noti.order_item && (
                              <span>New order for <b>{noti?.order_item?.product?.title}</b></span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500">{moment(noti.date).format("MMM DD, YYYY")}</td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleNotificationSeenStatus(noti.id)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                              title="Mark as read"
                            >
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-16 text-center">
                          <CheckCircle size={48} className="text-green-200 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">All caught up!</p>
                          <p className="text-gray-400 text-sm">No unread notifications.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {unseenTotalCount > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center py-4 px-6 border-t border-gray-100 bg-gray-50">
                  <p className="text-sm text-gray-600 mb-3 sm:mb-0">
                    Page {unseenCurrentPage} of {Math.ceil(unseenTotalCount / 10) || 1}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUnseenCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={!unseenHasPrev || loading}
                      className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <button
                      onClick={() => setUnseenCurrentPage((prev) => prev + 1)}
                      disabled={!unseenHasNext || loading}
                      className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* View Read Notifications Button */}
            <button
              onClick={() => setShowSeenModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition shadow-sm"
            >
              <Eye size={18} />
              View Read Notifications ({notificationStats?.read_noti || 0})
            </button>
          </>
        )}

        {/* Read Notifications Modal */}
        {showSeenModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Eye size={20} className="text-green-500" />
                  Read Notifications
                  <span className="ml-2 px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-sm">{seenTotalCount}</span>
                </h3>
                <button
                  onClick={() => setShowSeenModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[60vh]">
                {modalLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                    <p className="text-gray-500">Loading...</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {seenNotifications.length > 0 ? (
                        seenNotifications.map((noti) => (
                          <tr key={noti.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 rounded-lg">
                                  <Package size={18} className="text-green-600" />
                                </div>
                                <span className="font-medium text-gray-900">
                                  {noti.order && `Order ${noti?.order?.oid}`}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {noti.order_item && (
                                <span>New order for <b>{noti?.order_item?.product?.title}</b></span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-gray-500">{moment(noti.date).format("MMM DD, YYYY")}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-6 py-16 text-center text-gray-500">
                            No read notifications yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {seenTotalCount > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center py-4 px-6 border-t border-gray-100 bg-gray-50">
                  <p className="text-sm text-gray-600 mb-3 sm:mb-0">
                    Page {seenCurrentPage} of {Math.ceil(seenTotalCount / 10) || 1}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSeenCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={!seenHasPrev || modalLoading}
                      className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <button
                      onClick={() => setSeenCurrentPage((prev) => prev + 1)}
                      disabled={!seenHasNext || modalLoading}
                      className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;

