// src/components/customer/Sidebar.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserProfileData from "../../plugin/UserProfileData";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import log from "loglevel";

export default function Sidebar() {
  const {
    profile: userProfile,
    loading: profileLoading,
    error: profileError,
  } = UserProfileData();
  const userData = UserData();
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  // Early return for guest users or profile error
  if (!userData?.user_id || profileError) {
    return (
      <div className="lg:w-1/4">
        <div className="text-center p-4">
          <p>
            Guest user.{" "}
            <Link to="/login" className="text-blue-500">
              Sign in
            </Link>{" "}
            for more features.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!userData?.user_id) {
      setLoading(false);
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
        log.error("Error fetching sidebar data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userData?.user_id]);

  if (profileLoading || loading) {
    return <div className="lg:w-1/4">Loading profile...</div>;
  }

  return (
    <div className="lg:w-1/4">
      <div className="flex flex-col items-center justify-center mb-4 shadow rounded-lg p-4 bg-white">
        <img
          src={userProfile?.image || "/default-avatar.png"}
          alt="User Avatar"
          className="w-30 h-30 rounded-full object-cover"
        />
        <div className="text-center mt-2">
          <h3 className="text-lg font-semibold">
            {userProfile?.full_name || "User"}
          </h3>
          <p className="mt-1 text-sm text-blue-600">
            <Link to="/customer/settings/">
              <i className="fas fa-edit mr-2"></i> Edit Profile
            </Link>
          </p>
        </div>
      </div>
      <ol className="space-y-2">
        <li className="flex justify-between items-center bg-white p-3 rounded shadow">
          <Link to="/customer/account/" className="font-bold text-gray-800">
            <i className="fas fa-home mr-2"></i> Dashboard
          </Link>
        </li>
        <li className="flex justify-between items-center bg-white p-3 rounded shadow">
          <Link to="/customer/profile/" className="font-bold text-gray-800">
            <i className="fas fa-user mr-2"></i> Profile
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
          <Link to="/customer/wishlist/" className="font-bold text-gray-800">
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
            <i className="fas fa-bell mr-2 animate-bounce"></i> Notifications
          </Link>
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            {notificationCount}
          </span>
        </li>
        <li className="flex justify-between items-center bg-white p-3 rounded shadow">
          <Link to="/customer/addresses/" className="font-bold text-gray-800">
            <i className="fas fa-map-marker-alt mr-2"></i> Addresses
          </Link>
        </li>
        <li className="flex justify-between items-center bg-white p-3 rounded shadow">
          <Link to="/customer/settings/" className="font-bold text-gray-800">
            <i className="fas fa-cog mr-2 animate-spin"></i> Settings
          </Link>
        </li>
        <li className="flex justify-between items-center bg-white p-3 rounded shadow">
          <Link to="/logout" className="font-bold text-red-600">
            <i className="fas fa-sign-out-alt mr-2"></i> Logout
          </Link>
        </li>
      </ol>
    </div>
  );
}
