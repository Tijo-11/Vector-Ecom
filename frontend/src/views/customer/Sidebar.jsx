import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserProfileData from "../../plugin/UserProfileData";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";

export default function Sidebar() {
  const userProfile = UserProfileData(); //useEffect already runs in userProfileData.jsx
  const userData = UserData();
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!userData?.user_id) {
      setLoading(false); // no user → stop loading
      return;
    }

    const fetchData = async () => {
      try {
        const ordersRes = await apiInstance.get(
          `customer/orders/${userData.user_id}/`
        );
        setOrderCount(ordersRes.data.length || 0);

        const wishlistRes = await apiInstance.get(
          `customer/wishlist/${userData.user_id}/`
        );
        setWishlistCount(wishlistRes.data.length || 0);

        const notificationsRes = await apiInstance.get(
          `customer/notifications/${userData.user_id}/`
        );
        setNotificationCount(notificationsRes.data.length || 0);
      } catch (error) {
        console.error("Error fetching sidebar data:", error);
      } finally {
        setLoading(false); // stop loading once API done
      }
    };

    fetchData();
  }, [userData?.user_id]); //No dependency array it means the effect runs after every render, including the initial mount and every
  // update — no matter what changed., Empty array means runs once on mount

  return (
    <div className="lg:w-1/4">
      {loading === false && (
        <>
          <div className="flex flex-col items-center justify-center mb-4 shadow rounded-lg p-4 bg-white">
            <img
              src={userProfile?.image}
              alt=""
              className="w-30 h-30 rounded-full object-cover"
            />
            <div className="text-center mt-2">
              <h3 className="text-lg font-semibold">
                {userProfile?.full_name}
              </h3>
              <p className="mt-1 text-sm text-blue-600">
                <Link to="/customer/settings/">
                  <i className="fas fa-edit mr-2"></i> Edit Account
                </Link>
              </p>
            </div>
          </div>

          <ol className="space-y-2">
            <li className="flex justify-between items-center bg-white p-3 rounded shadow">
              <Link to="/customer/account/" className="font-bold text-gray-800">
                <i className="fas fa-user mr-2"></i> Account
              </Link>
            </li>
            <li className="flex justify-between items-center bg-white p-3 rounded shadow">
              <Link to="/customer/orders/" className="font-bold text-gray-800">
                <i className="fas fa-shopping-cart mr-2"></i> Orders
              </Link>
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {orderCount}
              </span>
            </li>
            <li className="flex justify-between items-center bg-white p-3 rounded shadow">
              <Link
                to="/customer/wishlist/"
                className="font-bold text-gray-800"
              >
                <i className="fas fa-heart mr-2 animate-pulse"></i> Wishlist
              </Link>
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {wishlistCount}
              </span>
            </li>
            <li className="flex justify-between items-center bg-white p-3 rounded shadow">
              <Link
                to="/customer/notifications/"
                className="font-bold text-gray-800"
              >
                <i className="fas fa-bell mr-2 animate-bounce"></i> Notification
              </Link>
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {notificationCount}
              </span>
            </li>
            <li className="flex justify-between items-center bg-white p-3 rounded shadow">
              <Link
                to="/customer/settings/"
                className="font-bold text-gray-800"
              >
                <i className="fas fa-gear mr-2 animate-spin"></i> Setting
              </Link>
            </li>
            <li className="flex justify-between items-center bg-white p-3 rounded shadow">
              <Link to="/logout" className="font-bold text-red-600">
                <i className="fas fa-sign-out mr-2"></i> Logout
              </Link>
            </li>
          </ol>
        </>
      )}
    </div>
  );
}
