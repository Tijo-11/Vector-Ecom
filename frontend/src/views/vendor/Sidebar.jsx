import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  IndianRupee, 
  Wallet, 
  Star, 
  Settings, 
  LogOut,
  Bell,
  Tag
} from "lucide-react";

export default function VendorSidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname.includes(path);

  const NavItem = ({ to, icon: Icon, label }) => {
     const active = isActive(to);
     return (
        <li>
           <Link
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                 active 
                 ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" 
                 : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
           >
              <Icon size={20} className={active ? "text-white" : "text-gray-500 group-hover:text-white"} />
              <span className="font-medium tracking-wide text-sm">{label}</span>
           </Link>
        </li>
     );
  };

  return (
    <div className="w-64 bg-gray-900 p-4 flex flex-col text-white sticky top-0 h-screen border-r border-gray-800 shrink-0">
       
       {/* Brand Area */}
       <div className="mb-8 px-4 py-2 shrink-0">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
             <span className="text-blue-500">V</span>endor
          </h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest ">Panel</p>
       </div>

       {/* Navigation */}
       <ul className="space-y-1.5 flex-1 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <NavItem to="/vendor/dashboard/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/vendor/products/" icon={Package} label="Products" />
          <NavItem to="/vendor/orders/" icon={ShoppingCart} label="Orders" />
          <NavItem to="/vendor/earning/" icon={IndianRupee} label="Earnings" />
          <NavItem to="/vendor/wallet-transactions/" icon={Wallet} label="Wallet" />
          <NavItem to="/vendor/coupon/" icon={Tag} label="Coupons" />
          <NavItem to="/vendor/reviews/" icon={Star} label="Reviews" />
          <NavItem to="/vendor/notifications/" icon={Bell} label="Notifications" />
          <NavItem to="/vendor/settings/" icon={Settings} label="Settings" />
       </ul>

       {/* Logout - part of sidebar */}
       <div className="pt-4 border-t border-gray-800 shrink-0">
          <Link 
             to="/logout" 
             className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
             <LogOut size={20} />
             <span className="font-medium text-sm">Logout</span>
          </Link>
       </div>
    </div>
  );
}


