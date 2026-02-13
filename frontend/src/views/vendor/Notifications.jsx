import React, { useState, useEffect, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Bell,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import moment from "moment";
import Swal from "sweetalert2";

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("unread"); // "unread" | "read"
  const [stats, setStats] = useState({});

  const axios = apiInstance;
  const userData = UserData();
  const vendorId = userData?.vendor_id;

  if (userData?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });

  const buildUrl = useCallback(
    (page, tab) => {
      const endpoint =
        tab === "read"
          ? `vendor-notifications-seen/${vendorId}/`
          : `vendor-notifications-unseen/${vendorId}/`;
      return page > 1 ? `${endpoint}?page=${page}` : endpoint;
    },
    [vendorId],
  );

  const fetchNotifications = useCallback(
    async (page = 1, tab = activeTab) => {
      if (!vendorId) return;
      setLoading(true);
      try {
        const [notiRes, statsRes] = await Promise.all([
          axios.get(buildUrl(page, tab)),
          axios.get(`vendor-notifications-summary/${vendorId}/`),
        ]);

        const data = notiRes.data;
        const list = Array.isArray(data) ? data : data.results || [];
        setNotifications(list);
        setTotalCount(data.count ?? list.length);
        setHasNext(!!data.next);
        setHasPrev(!!data.previous);
        setCurrentPage(page);

        const statsData = statsRes.data;
        const statsObj = Array.isArray(statsData)
          ? statsData[0] || {}
          : statsData.results?.[0] || statsData[0] || statsData;
        setStats(statsObj);
      } catch {
        setNotifications([]);
        setStats({});
      } finally {
        setLoading(false);
      }
    },
    [vendorId, activeTab, buildUrl],
  );

  useEffect(() => {
    fetchNotifications(1, activeTab);
  }, [vendorId, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const toggleSeen = async (notiId, currentSeen) => {
    // Optimistic update — flip seen flag locally
    setNotifications((prev) =>
      prev.map((n) => (n.id === notiId ? { ...n, seen: !currentSeen } : n)),
    );

    try {
      await axios.get(
        `vendor-notifications-mark-as-seen/${vendorId}/${notiId}/`,
      );
      Toast.fire({
        icon: "success",
        title: currentSeen ? "Marked as unread" : "Marked as read",
      });

      // Remove item from current filtered list since it no longer belongs
      setNotifications((prev) => prev.filter((n) => n.id !== notiId));
      setTotalCount((prev) => Math.max(prev - 1, 0));

      // Update stats locally
      setStats((prev) => ({
        ...prev,
        un_read_noti: currentSeen
          ? (prev.un_read_noti || 0) + 1
          : Math.max((prev.un_read_noti || 0) - 1, 0),
        read_noti: currentSeen
          ? Math.max((prev.read_noti || 0) - 1, 0)
          : (prev.read_noti || 0) + 1,
      }));
    } catch {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === notiId ? { ...n, seen: currentSeen } : n)),
      );
      Toast.fire({ icon: "error", title: "Failed to update notification" });
    }
  };

  const tabs = [
    { key: "unread", label: "Unread", count: stats?.un_read_noti || 0 },
    { key: "read", label: "Read", count: stats?.read_noti || 0 },
  ];

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
          <p className="text-gray-500 mt-1">
            Stay updated with your latest orders and activities.
          </p>
        </div>

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
              <h2 className="text-4xl font-bold mt-2">
                {stats?.un_read_noti || 0}
              </h2>
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
              <h2 className="text-4xl font-bold mt-2">
                {stats?.read_noti || 0}
              </h2>
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
              <h2 className="text-4xl font-bold mt-2">
                {stats?.all_noti || 0}
              </h2>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {tab.key === "unread" ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
              {tab.label}
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Notifications Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4" />
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Message
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {notifications.length > 0 ? (
                    notifications.map((noti) => (
                      <tr
                        key={noti.id}
                        className={`transition-colors ${
                          activeTab === "read"
                            ? "bg-white hover:bg-gray-50"
                            : "bg-blue-50/40 hover:bg-blue-50"
                        }`}
                      >
                        <td className="px-6 py-4">
                          {activeTab === "read" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                              <Eye size={14} /> Read
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                              <EyeOff size={14} /> Unread
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${activeTab === "read" ? "bg-gray-100" : "bg-blue-100"}`}
                            >
                              <Package
                                size={18}
                                className={
                                  activeTab === "read"
                                    ? "text-gray-500"
                                    : "text-blue-600"
                                }
                              />
                            </div>
                            <span
                              className={`font-medium ${activeTab === "read" ? "text-gray-600" : "text-gray-900"}`}
                            >
                              {noti.order && `Order ${noti?.order?.oid}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {noti.order_item && (
                            <span>
                              New order for{" "}
                              <b>{noti?.order_item?.product?.title}</b>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {moment(noti.date).format("MMM DD, YYYY")}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {activeTab === "read" ? (
                            <button
                              onClick={() => toggleSeen(noti.id, true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition text-blue-600 hover:bg-blue-50 border border-blue-200"
                              title="Mark as unread"
                            >
                              <EyeOff size={16} /> Mark Unread
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleSeen(noti.id, false)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition text-green-700 hover:bg-green-50 border border-green-200"
                              title="Mark as read"
                            >
                              <Eye size={16} /> Mark Read
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center">
                        <CheckCircle
                          size={48}
                          className="text-green-200 mx-auto mb-3"
                        />
                        <p className="text-gray-500 font-medium">
                          {activeTab === "unread"
                            ? "All caught up! No unread notifications."
                            : "No read notifications yet."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalCount > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center py-4 px-6 border-t border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-600 mb-3 sm:mb-0">
                  Page {currentPage} of{" "}
                  {Math.ceil(totalCount / 10) || 1}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newPage = Math.max(currentPage - 1, 1);
                      setCurrentPage(newPage);
                      fetchNotifications(newPage, activeTab);
                    }}
                    disabled={!hasPrev || loading}
                    className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <button
                    onClick={() => {
                      const newPage = currentPage + 1;
                      setCurrentPage(newPage);
                      fetchNotifications(newPage, activeTab);
                    }}
                    disabled={!hasNext || loading}
                    className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
