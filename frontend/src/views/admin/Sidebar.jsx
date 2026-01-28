import React from "react";
import {
  Gauge,
  Users,
  Package,
  ShoppingCart,
  IndianRupee,
  BarChart2,
  Settings,
  Bell,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function AdminSidebar() {
  const location = useLocation();

  const nonActiveLink =
    "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors";
  const activeLink =
    "flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors";

  const isActiveLink = (currentPath, linkPath) => {
    return currentPath.includes(linkPath);
  };

  return (
    <div
      id="sidebar"
      role="navigation"
      className="w-64 bg-gray-900 text-white min-h-screen p-4"
    >
      <ul className="space-y-3">
        <li>
          <Link
            to="/admin/dashboard"
            className={
              isActiveLink(location.pathname, "/admin/dashboard")
                ? activeLink
                : nonActiveLink
            }
          >
            <Gauge size={18} /> <span>Dashboard</span>
          </Link>
        </li>
        <li>
          <Link
            to="/admin/vendors"
            className={
              isActiveLink(location.pathname, "/admin/vendors")
                ? activeLink
                : nonActiveLink
            }
          >
            <Users size={18} /> <span>Vendors</span>
          </Link>
        </li>
        <li>
          <Link
            to="/admin/products"
            className={
              isActiveLink(location.pathname, "/admin/products")
                ? activeLink
                : nonActiveLink
            }
          >
            <Package size={18} /> <span>Products</span>
          </Link>
        </li>
        <li>
          <Link
            to="/admin/orders"
            className={
              isActiveLink(location.pathname, "/admin/orders")
                ? activeLink
                : nonActiveLink
            }
          >
            <ShoppingCart size={18} /> <span>Orders</span>
          </Link>
        </li>
        <li>
          <Link
            to="/admin/category-offer"
            className={
              isActiveLink(location.pathname, "/admin/category-offer")
                ? activeLink
                : nonActiveLink
            }
          >
            <IndianRupee size={18} /> <span>Category Offer</span>
          </Link>
        </li>
        <li>
          <Link
            to="/admin/reports"
            className={
              isActiveLink(location.pathname, "/admin/reports")
                ? activeLink
                : nonActiveLink
            }
          >
            <BarChart2 size={18} /> <span>Reports</span>
          </Link>
        </li>
        {/* <li>
          <Link
            to="/admin/notifications"
            className={
              isActiveLink(location.pathname, "/admin/notifications")
                ? activeLink
                : nonActiveLink
            }
          >
            <Bell size={18} /> <span>Notifications</span>
          </Link>
        </li> */}
        {/* <li>
          <Link
            to="/admin/settings"
            className={
              isActiveLink(location.pathname, "/admin/settings")
                ? activeLink
                : nonActiveLink
            }
          >
            <Settings size={18} /> <span>Settings</span>
          </Link>
        </li> */}
        <li>
          <Link
            to="/logout"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOut size={18} /> <span>Logout</span>
          </Link>
        </li>
      </ul>
      <hr className="border-gray-700 mt-4" />
    </div>
  );
}
