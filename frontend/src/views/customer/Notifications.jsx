import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import moment from "moment";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const axios = apiInstance;
  const userData = UserData();

  useEffect(() => {
    if (!userData?.user_id) return;

    axios
      .get(`customer/notifications/${userData.user_id}/`)
      .then((res) => {
        setNotifications(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userData?.user_id]);

  const markAsSeen = async (noti_id) => {
    try {
      await axios.get(`customer/notifications/${userData.user_id}/${noti_id}`);
      // ✅ remove from state after marking as seen
      setNotifications((prev) => prev.filter((noti) => noti.id !== noti_id));
    } catch (err) {
      console.error("Error marking notification as seen", err);
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
                          <i className="fas fa-bell mr-2" /> Notifications
                        </h3>

                        <div className="flex flex-col divide-y divide-gray-200 rounded-lg border border-gray-200">
                          {notifications.map((noti) => (
                            <div
                              key={noti.id}
                              className="p-4 hover:bg-gray-50 transition flex justify-between items-start"
                            >
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <h5 className="text-lg font-medium text-gray-800">
                                    {noti?.title || "New Order!"}
                                  </h5>
                                  <small className="text-gray-500">
                                    {moment(noti.date).format("MM-DD-YYYY")}
                                  </small>
                                </div>
                                <p className="text-gray-700 mb-2">
                                  Your order #{noti?.order?.oid} was successful
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

                              {/* ✅ Mark as Seen button */}
                              <button
                                onClick={() => markAsSeen(noti.id)}
                                className="ml-4 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >
                                Mark as Seen
                              </button>
                            </div>
                          ))}

                          {!loading && notifications.length < 1 && (
                            <h6 className="p-4 text-gray-500">
                              No notifications yet
                            </h6>
                          )}
                        </div>
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
