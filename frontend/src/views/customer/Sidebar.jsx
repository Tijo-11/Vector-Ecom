import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import UserProfileData from "../../plugin/UserProfileData";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import log from "loglevel";
import { 
  LayoutDashboard, 
  User, 
  ShoppingBag, 
  Heart, 
  Bell, 
  Wallet, 
  MapPin, 
  Settings, 
  LogOut,
  Camera
} from "lucide-react";

const Sidebar = () => {
    const { profile: userProfile, loading: profileLoading, error: profileError } = UserProfileData();
    const userData = UserData();
    const location = useLocation();
    
    const [orderCount, setOrderCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [notificationCount, setNotificationCount] = useState(0);
    const [walletBalance, setWalletBalance] = useState("0.00");

    if (!userData?.user_id || profileError) {
        return (
            <div className="lg:w-1/4">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
                    <p>Please <Link to="/login" className="font-bold underline">Login</Link> to access dashboard.</p>
                </div>
            </div>
        );
    }

    useEffect(() => {
        if (!userData?.user_id) return;

        const fetchCounts = async () => {
            try {
                const [ordersRes, wishlistRes, notificationsRes] = await Promise.all([
                    apiInstance.get(`customer/orders/${userData.user_id}/`),
                    apiInstance.get(`customer/wishlist/${userData.user_id}/`),
                    apiInstance.get(`customer/notifications/${userData.user_id}/`),
                ]);
                const walletRes = await apiInstance.get(`customer/wallet/${userData.user_id}/`);
                setWalletBalance(walletRes.data.balance || "0.00");

                const getCount = (data) => data.count ?? (Array.isArray(data) ? data.length : 0);

                setOrderCount(getCount(ordersRes.data));
                setWishlistCount(getCount(wishlistRes.data));
                setNotificationCount(getCount(notificationsRes.data));
            } catch (error) {
                log.error("Error fetching sidebar counts:", error);
            }
        };

        fetchCounts();
    }, [userData?.user_id]);

    const NavItem = ({ to, icon: Icon, label, count, colorClass = "bg-blue-600" }) => {
        const isActive = location.pathname.includes(to);
        return (
            <li>
                <Link
                    to={to}
                    className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <Icon size={20} className={isActive ? "text-white" : "text-gray-400 group-hover:text-blue-600"} />
                        <span className="font-medium">{label}</span>
                    </div>
                    {count !== undefined && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isActive ? "bg-white/20 text-white" : `${colorClass.replace('bg-', 'bg-opacity-10 text-')} bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600`
                        }`}>
                            {count}
                        </span>
                    )}
                </Link>
            </li>
        );
    };

    return (
        <div className="lg:w-1/4 flex-shrink-0">
            {/* User Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 text-center">
                <div className="relative inline-block mx-auto mb-4">
                     <img
                        src={userProfile?.image || `https://ui-avatars.com/api/?name=${userProfile?.full_name || 'User'}&background=random`}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-sm"
                     />
                     <Link to="/customer/settings/" className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition">
                        <Camera size={14} />
                     </Link>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{userProfile?.full_name || "Welcome Back"}</h3>
                <p className="text-sm text-gray-500 mt-1">{userProfile?.email || userData?.email}</p>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <ul className="space-y-1">
                    <NavItem to="/customer/account/" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem to="/customer/profile/" icon={User} label="Profile" />
                    <NavItem to="/customer/orders/" icon={ShoppingBag} label="Orders" count={orderCount} />
                    <NavItem to="/customer/wishlist/" icon={Heart} label="Wishlist" count={wishlistCount} />
                    <NavItem to="/customer/notifications/" icon={Bell} label="Notifications" count={notificationCount} />
                    <NavItem to="/customer/wallet/" icon={Wallet} label="Wallet" count={`₹${walletBalance}`} colorClass="bg-green-500" />
                    <NavItem to="/customer/addresses/" icon={MapPin} label="Addresses" />
                    <NavItem to="/customer/settings/" icon={Settings} label="Settings" />
                    
                    <div className="my-2 border-t border-gray-100"></div>
                    
                    <li>
                        <Link 
                            to="/logout" 
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-medium"
                        >
                            <LogOut size={20} />
                            Logout
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default React.memo(Sidebar);
