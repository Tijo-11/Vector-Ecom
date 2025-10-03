import {
  Gauge,
  Grid,
  ShoppingCart,
  IndianRupee,
  Star,
  PlusCircle,
  Tag,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function VendorSidebar() {
  const location = useLocation();
  const nonActiveLink =
    "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors";
  const activeLink =
    "flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors";

  const isActiveLink = (currentPath, LinkPath) => {
    return currentPath.includes(LinkPath);
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
            to="/vendor/dashboard/"
            className={
              isActiveLink(location.pathname, "/vendor/dashboard/")
                ? activeLink
                : nonActiveLink
            }
          >
            <Gauge size={18} /> <span>Dashboard</span>
          </Link>
        </li>
        <li>
          <Link
            to="/vendor/products/"
            className={
              isActiveLink(location.pathname, "/vendor/products/")
                ? activeLink
                : nonActiveLink
            }
          >
            <Grid size={18} /> <span>Products</span>
          </Link>
        </li>
        <li>
          <Link
            to="/vendor/orders/"
            className={
              isActiveLink(location.pathname, "/vendor/orders/")
                ? activeLink
                : nonActiveLink
            }
          >
            <ShoppingCart size={18} /> <span>Orders</span>
          </Link>
        </li>
        <li>
          <Link
            to="/vendor/earning/"
            className={
              isActiveLink(location.pathname, "/vendor/earning/")
                ? activeLink
                : nonActiveLink
            }
          >
            <IndianRupee size={18} /> <span>Earning</span>
          </Link>
        </li>
        <li>
          <Link
            to="/vendor/reviews/"
            className={
              isActiveLink(location.pathname, "/vendor/reviews/")
                ? activeLink
                : nonActiveLink
            }
          >
            <Star size={18} /> <span>Reviews</span>
          </Link>
        </li>
        <li>
          <Link
            to="/vendor/product/new/"
            className={
              isActiveLink(location.pathname, "/vendor/product/new/")
                ? activeLink
                : nonActiveLink
            }
          >
            <PlusCircle size={18} /> <span>Add Product</span>
          </Link>
        </li>
        <li>
          <Link
            to="/vendor/coupon/"
            className={
              isActiveLink(location.pathname, "/vendor/coupon/")
                ? activeLink
                : nonActiveLink
            }
          >
            <Tag size={18} /> <span>Coupon & Discount</span>
          </Link>
        </li>
        <li>
          <Link
            to="/vendor/notifications/"
            className={
              isActiveLink(location.pathname, "/vendor/notifications/")
                ? activeLink
                : nonActiveLink
            }
          >
            <Bell size={18} /> <span>Notifications</span>
          </Link>
        </li>
        <li>
          <Link
            to="/vendor/settings/"
            className={
              isActiveLink(location.pathname, "/vendor/settings/")
                ? activeLink
                : nonActiveLink
            }
          >
            <Settings size={18} /> <span>Settings</span>
          </Link>
        </li>
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
