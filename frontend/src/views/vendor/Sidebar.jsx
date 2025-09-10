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
import { Link } from "react-router-dom";

export default function VendorSidebar() {
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
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <Gauge size={18} /> <span>Dashboard</span>
          </Link>
        </li>
        <li>
          <Link
            to="/vendor/products/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Grid size={18} /> <span>Products</span>
          </Link>
        </li>
        <li>
          <Link
            to="/vendor/orders/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ShoppingCart size={18} /> <span>Orders</span>
          </Link>
        </li>
        <li>
          <Link
            to="/vendor/earning/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <IndianRupee size={18} /> <span>Earning</span>
          </Link>
        </li>
        <li>
          <Link
            to="/vendor/reviews/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Star size={18} /> <span>Reviews</span>
          </Link>
        </li>
        <li>
          <Link
            to="/vendor/product/new/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <PlusCircle size={18} /> <span>Add Product</span>
          </Link>
        </li>
        <li>
          <Link
            to="/vendor/coupon/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Tag size={18} /> <span>Coupon & Discount</span>
          </Link>
        </li>
        <li>
          <Link
            to="/vendor/notifications/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Bell size={18} /> <span>Notifications</span>
          </Link>
        </li>
        <li>
          <Link
            to="/vendor/settings/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
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
