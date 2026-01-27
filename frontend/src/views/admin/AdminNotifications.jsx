import React, { useState, useEffect } from "react";
import AdminSidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import { Loader2, Check } from "lucide-react";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await apiInstance.get("/admin/notifications/");
      setNotifications(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await apiInstance.patch(`/admin/notifications/${id}/mark-read/`);
      setNotifications(
        notifications.map((n) =>
          n.id === id ? { ...n, seen: true } : n
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border">
          <h1 className="text-2xl font-semibold mb-6">Notifications</h1>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-gray-500" />
            </div>
          ) : (
            <ul className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`bg-gray-50 shadow rounded-xl p-4 flex justify-between items-center ${
                      n.seen ? "opacity-60" : "border-l-4 border-indigo-500"
                    }`}
                  >
                    <div className="text-gray-700">
                      <p className="font-medium">
                        {n.message || "Notification Content"}
                      </p>
                       <span className="text-xs text-gray-400">
                        {new Date(n.date).toLocaleDateString()}
                      </span>
                    </div>
                    {!n.seen && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-indigo-600 hover:text-indigo-800"
                        title="Mark as read"
                      >
                        <Check size={20} />
                      </button>
                    )}
                  </li>
                ))
              ) : (
                <p className="text-gray-500">No notifications found.</p>
              )}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
