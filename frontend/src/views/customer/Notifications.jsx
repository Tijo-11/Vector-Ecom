import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import moment from "moment";
import log from "loglevel";
import Swal from "sweetalert2"; // Add SweetAlert2 for feedback

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);

  const axios = apiInstance;
  const userData = UserData();
  const userId = userData?.user_id;

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });

  // Construct URL with page param
  const getNotificationsUrl = (page) => {
    const base = `customer/notifications/${userId}/`;
    return page <= 1 ? base : `${base}?page=${page}`;
  };

  const fetchNotifications = async (page = currentPage) => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const fullUrl = getNotificationsUrl(page);
      const res = await axios.get(fullUrl);

      const data = res.data;
      const notiList = Array.isArray(data) ? data : data.results || [];
      const count = data.count ?? notiList.length;
      const next = data.next ?? null;
      const prev = data.previous ?? null;

      setNotifications(notiList);
      setTotalCount(count);
      setHasNext(!!next);
      setHasPrev(!!prev);
      setCurrentPage(page);
    } catch (error) {
      log.error("Error fetching notifications:", error);
      setNotifications([]);
      setTotalCount(0);
      setHasNext(false);
      setHasPrev(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
  }, [userId]);

  useEffect(() => {
    fetchNotifications(currentPage);
  }, [currentPage]);

  const markAsSeen = async (noti_id) => {
    try {
      // Fixed URL with trailing slash
      await axios.get(`customer/notifications/${userId}/${noti_id}/`);

      // Optimistic UI update + toast feedback
      setNotifications((prev) => prev.filter((noti) => noti.id !== noti_id));
      Toast.fire({
        icon: "success",
        title: "Notification marked as seen",
      });

      // Refetch to ensure sync (handles if page becomes empty)
      await fetchNotifications(currentPage);
    } catch (err) {
      log.error("Error marking notification as seen", err);
      Toast.fire({
        icon: "error",
        title: "Failed to mark as seen",
      });
    }
  };

  return (
    <div>
      <main className="mt-5 mb-52">
        <div className="container mx-auto px-4">
          <section>
            <div className="flex flex-col lg:flex-row gap-6">
              <Sidebar />
              <div className="flex-1 mt-2">
                <section>
                  <main className="mb-5">
                    <div className="px-4">
                      <section>
                        <h3 className="mb-4 flex items-center text-xl font-semibold">
                          <i className="fas fa-bell mr-2" /> Notifications (
                          {totalCount})
                        </h3>

                        {loading ? (
                          <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                            <p className="text-lg text-gray-600">
                              Loading notifications...
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col divide-y divide-gray-200 rounded-lg border border-gray-200">
                            {notifications.length > 0 ? (
                              notifications.map((noti) => (
                                <div
                                  key={noti.id}
                                  className="p-4 hover:bg-gray-50 transition flex justify-between items-start opacity-100 transition-opacity duration-300"
                                >
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center mb-2">
                                      <h5 className="text-lg font-medium text-gray-800">
                                        {noti?.title || "New Order!"}
                                      </h5>
                                      <small className="text-gray-500">
                                        {moment(noti.date).format("MM-DD-YYYY")}
                                      </small>
                                    </div>
                                    <p className="text-gray-700 mb-2">
                                      Your order #{noti?.order?.oid} was
                                      successful
                                    </p>
                                    {noti?.order && (
                                      <div className="text-sm text-gray-600 space-y-1">
                                        <p>Total: ₹{noti.order.total ?? "—"}</p>
                                        <p>
                                          Shipping: ₹
                                          {noti.order.shipping_amount ?? "—"}
                                        </p>
                                        <p>Tax: ₹{noti.order.tax_fee ?? "—"}</p>
                                        <p>
                                          Service Fee: ₹
                                          {noti.order.service_fee ?? "—"}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Mark as Seen button */}
                                  <button
                                    onClick={() => markAsSeen(noti.id)}
                                    className="ml-4 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                  >
                                    Mark as Seen
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="p-8 text-center text-gray-500">
                                No notifications yet
                              </div>
                            )}
                          </div>
                        )}

                        {/* Pagination Controls */}
                        {!loading && totalCount > notifications.length && (
                          <div className="flex justify-center items-center mt-8 gap-8">
                            <button
                              onClick={() =>
                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                              }
                              disabled={!hasPrev}
                              className="px-6 py-3 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                            >
                              Previous
                            </button>

                            <span className="text-lg font-medium">
                              Page {currentPage} ({totalCount} total)
                            </span>

                            <button
                              onClick={() => setCurrentPage((prev) => prev + 1)}
                              disabled={!hasNext}
                              className="px-6 py-3 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </section>
                    </div>
                  </main>
                </section>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Notifications;
