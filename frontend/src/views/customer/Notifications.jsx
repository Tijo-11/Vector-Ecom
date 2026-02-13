import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import moment from "moment";
import Swal from "sweetalert2";
import {
  Bell,
  Eye,
  EyeOff,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("unread"); // "all" | "unread" | "read"

  const axios = apiInstance;
  const userData = UserData();
  const userId = userData?.user_id;

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });

  const buildUrl = useCallback(
    (page, tab) => {
      let base = `customer/notifications/${userId}/`;
      const params = [];
      if (tab === "unread") params.push("seen=false");
      if (tab === "read") params.push("seen=true");
      if (page > 1) params.push(`page=${page}`);
      return params.length ? `${base}?${params.join("&")}` : base;
    },
    [userId],
  );

  const fetchNotifications = useCallback(
    async (page = 1, tab = activeTab) => {
      if (!userId) {
        setNotifications([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await axios.get(buildUrl(page, tab));
        const data = res.data;
        const list = Array.isArray(data) ? data : data.results || [];
        setNotifications(list);
        setTotalCount(data.count ?? list.length);
        setHasNext(!!data.next);
        setHasPrev(!!data.previous);
        setCurrentPage(page);
      } catch {
        setNotifications([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [userId, activeTab, buildUrl],
  );

  useEffect(() => {
    fetchNotifications(1, activeTab);
  }, [userId, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const toggleSeen = async (notiId, currentSeen) => {
    // Optimistic update — flip the seen flag in local state instantly
    setNotifications((prev) =>
      prev.map((n) => (n.id === notiId ? { ...n, seen: !currentSeen } : n)),
    );

    try {
      await axios.get(`customer/notifications/${userId}/${notiId}/`);
      Toast.fire({
        icon: "success",
        title: currentSeen ? "Marked as unread" : "Marked as read",
      });

      // Notify sidebar to update unread count: +1 if marking unread, -1 if marking read
      window.dispatchEvent(
        new CustomEvent("notification-count-update", {
          detail: { delta: currentSeen ? 1 : -1 },
        }),
      );

      // If we're on a filtered tab, the toggled item no longer belongs — remove it
      if (activeTab !== "all") {
        setNotifications((prev) => prev.filter((n) => n.id !== notiId));
        setTotalCount((prev) => Math.max(prev - 1, 0));
      }
    } catch {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === notiId ? { ...n, seen: currentSeen } : n)),
      );
      Toast.fire({ icon: "error", title: "Failed to update notification" });
    }
  };

  const tabs = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "read", label: "Read" },
  ];

  return (
    <div>
      <main className="mt-5 mb-52">
        <div className="container mx-auto px-4">
          <section>
            <div className="flex flex-col lg:flex-row gap-6">
              <Sidebar />
              <div className="flex-1 mt-2">
                <div className="px-4">
                  {/* Header */}
                  <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Bell size={22} className="text-blue-600" />
                      Notifications
                      <span className="text-base font-normal text-gray-500">
                        ({totalCount})
                      </span>
                    </h3>

                    {/* Tabs */}
                    <div className="flex gap-2">
                      {tabs.map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => handleTabChange(tab.key)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            activeTab === tab.key
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4" />
                      <p className="text-gray-500">
                        Loading notifications...
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                              Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                              Notification
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
                                  noti.seen
                                    ? "bg-white hover:bg-gray-50"
                                    : "bg-blue-50/40 hover:bg-blue-50"
                                }`}
                              >
                                <td className="px-6 py-4">
                                  {noti.seen ? (
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
                                      className={`p-2 rounded-lg ${noti.seen ? "bg-gray-100" : "bg-blue-100"}`}
                                    >
                                      <Package
                                        size={18}
                                        className={
                                          noti.seen
                                            ? "text-gray-500"
                                            : "text-blue-600"
                                        }
                                      />
                                    </div>
                                    <div>
                                      <p
                                        className={`font-medium ${noti.seen ? "text-gray-600" : "text-gray-900"}`}
                                      >
                                        {noti.order
                                          ? `Order #${noti.order.oid}`
                                          : "Notification"}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {noti.order
                                          ? `Your order was successful — ₹${noti.order.total ?? "—"}`
                                          : ""}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-sm">
                                  {moment(noti.date).format("MMM DD, YYYY")}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() =>
                                      toggleSeen(noti.id, noti.seen)
                                    }
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                      noti.seen
                                        ? "text-blue-600 hover:bg-blue-50 border border-blue-200"
                                        : "text-green-700 hover:bg-green-50 border border-green-200"
                                    }`}
                                    title={
                                      noti.seen
                                        ? "Mark as unread"
                                        : "Mark as read"
                                    }
                                  >
                                    {noti.seen ? (
                                      <>
                                        <EyeOff size={16} /> Unread
                                      </>
                                    ) : (
                                      <>
                                        <Eye size={16} /> Read
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="4"
                                className="px-6 py-16 text-center"
                              >
                                <CheckCircle
                                  size={48}
                                  className="text-gray-200 mx-auto mb-3"
                                />
                                <p className="text-gray-500 font-medium">
                                  {activeTab === "unread"
                                    ? "All caught up!"
                                    : "No notifications found"}
                                </p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      {/* Pagination */}
                      {totalCount > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center py-4 px-6 border-t border-gray-100 bg-gray-50">
                          <p className="text-sm text-gray-600 mb-3 sm:mb-0">
                            Page {currentPage} ({totalCount} total)
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                setCurrentPage((p) => {
                                  const newPage = Math.max(p - 1, 1);
                                  fetchNotifications(newPage, activeTab);
                                  return newPage;
                                })
                              }
                              disabled={!hasPrev || loading}
                              className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                              <ChevronLeft size={16} /> Previous
                            </button>
                            <button
                              onClick={() =>
                                setCurrentPage((p) => {
                                  const newPage = p + 1;
                                  fetchNotifications(newPage, activeTab);
                                  return newPage;
                                })
                              }
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
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Notifications;
