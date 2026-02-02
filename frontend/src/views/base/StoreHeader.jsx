import React, { useState, useRef, useEffect, useContext } from "react";
import { useAuthStore } from "../../store/auth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  Menu,
  X,
  Search,
  User,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Settings,
  Heart,
  Bell,
  ShoppingBag,
  Truck,
  Package,
} from "lucide-react";
import { CartContext } from "../../plugin/Context";
import UseProfileData from "../../plugin/UserProfileData";

function StoreHeader() {
  const { user, isLoggedIn, isVendor, isAdmin } = useAuthStore();
  const [cartCount] = useContext(CartContext);
  const userProfile = UseProfileData();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isVendorOpen, setIsVendorOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const accountRef = useRef(null);
  const vendorRef = useRef(null);

  // Sync search input with current query param when on /search
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("query") || "";
    setSearch(query);
  }, [location]);

  const handleSearchChange = (event) => setSearch(event.target.value);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const trimmed = search.trim();
    if (trimmed) {
      navigate(`/search?query=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/products");
    }
    setIsMobileMenuOpen(false);
  };

  const handleClearSearch = () => {
    setSearch("");
    if (location.pathname === "/search") {
      navigate("/products");
    }
  };

  const currentQuery = new URLSearchParams(location.search).get("query") || "";

  const toggleAccountDropdown = () => setIsAccountOpen(!isAccountOpen);
  const toggleVendorDropdown = () => setIsVendorOpen(!isVendorOpen);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target))
        setIsAccountOpen(false);
      if (vendorRef.current && !vendorRef.current.contains(event.target))
        setIsVendorOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const showPublicFeatures = !isAdmin;
  const showCart = !isAdmin;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-sm transition-all duration-300">
      {/* Main Header Bar */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo Section */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <Link to="/" className="group flex flex-col">
                <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-700 transition-all">
                  RetroRelics
                </span>
                <span className="text-[10px] tracking-wider font-medium text-gray-500 group-hover:text-blue-600 transition-colors uppercase">
                  Shop stories, not just stuff
                </span>
              </Link>
            </div>

            {/* Desktop Search */}
            {showPublicFeatures && (
              <div className="hidden md:flex flex-1 max-w-lg mx-8">
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                  <input
                    type="text"
                    className="block w-full pl-5 pr-16 py-2.5 border border-gray-200 rounded-full leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 sm:text-sm"
                    placeholder="Search for vintage treasures..."
                    value={search}
                    onChange={handleSearchChange}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
                    {search && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      type="submit"
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Search className="h-5 w-5" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Desktop Navigation & Actions */}
            <div className="hidden md:flex items-center space-x-2 sm:space-x-4">
              {/* Vendor Menu */}
              {isVendor && (
                <div className="relative" ref={vendorRef}>
                  <button
                    onClick={toggleVendorDropdown}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isVendorOpen
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Vendor
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${isVendorOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Vendor Dropdown */}
                  <div
                    className={`absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 transform transition-all duration-200 origin-top-right ${
                      isVendorOpen
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-95 pointer-events-none"
                    }`}
                  >
                    <div className="py-1">
                      <Link
                        to="/vendor/dashboard/"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                      >
                        <LayoutDashboard className="mr-3 h-4 w-4" /> Dashboard
                      </Link>
                      <Link
                        to="/vendor/products/"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                      >
                        <ShoppingBag className="mr-3 h-4 w-4" /> Products
                      </Link>
                      <Link
                        to="/vendor/orders/"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                      >
                        <Truck className="mr-3 h-4 w-4" /> Orders
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <Link
                        to="/vendor/settings/"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                      >
                        <Settings className="mr-3 h-4 w-4" /> Settings
                      </Link>
                      <Link
                        to="/logout"
                        className="flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="mr-3 h-4 w-4" /> Logout
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Link */}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-sm transition-all"
                >
                  Admin Panel
                </Link>
              )}

              {/* Track Order */}
              {showPublicFeatures && (
                <Link
                  to="/track-order"
                  className="text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-all relative group"
                  title="Track Order"
                >
                  <Truck className="h-6 w-6" />
                  <span className="absolute hidden group-hover:block top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap">
                    Track Order
                  </span>
                </Link>
              )}

              {/* Cart */}
              {showCart && (
                <Link
                  to="/cart"
                  className="group relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                >
                  <ShoppingCart className="h-6 w-6 group-hover:scale-105 transition-transform" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full shadow-sm border-2 border-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* User Account Dropdown */}
              {isLoggedIn && !isVendor && showPublicFeatures && (
                <div className="relative" ref={accountRef}>
                  <button
                    onClick={toggleAccountDropdown}
                    className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200"
                  >
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md ring-2 ring-transparent peer-hover:ring-blue-100 transition-all">
                      {userProfile?.image ? (
                        <img
                          src={userProfile.image}
                          alt={userProfile.full_name}
                          className="h-full w-full rounded-full object-cover border-2 border-white"
                        />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                  </button>

                  <div
                    className={`absolute right-0 mt-4 w-60 bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 transform transition-all duration-200 origin-top-right z-50 overflow-hidden ${
                      isAccountOpen
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-95 pointer-events-none"
                    }`}
                  >
                    <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {userProfile?.full_name || user?.username}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {user?.email}
                      </p>
                    </div>

                    <div className="py-2">
                      <Link
                        to="/customer/account/"
                        className="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <User className="mr-3 h-4 w-4 text-gray-400 group-hover:text-blue-500" />{" "}
                        My Account
                      </Link>
                      <Link
                        to="/customer/orders/"
                        className="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Package className="mr-3 h-4 w-4 text-gray-400" /> My
                        Orders
                      </Link>
                      <Link
                        to="/customer/wishlist/"
                        className="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Heart className="mr-3 h-4 w-4 text-gray-400" />{" "}
                        Wishlist
                      </Link>
                      <Link
                        to="/customer/notifications/"
                        className="flex items-center px-5 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Bell className="mr-3 h-4 w-4 text-gray-400" />{" "}
                        Notifications
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <Link
                        to="/logout"
                        className="flex items-center px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="mr-3 h-4 w-4" /> Sign out
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Login/Signup */}
              {!isLoggedIn && (
                <div className="flex items-center gap-3 ml-4">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                  >
                    Sign up
                  </Link>
                </div>
              )}

              {/* Vendor Profile Indicator */}
              {isLoggedIn && isVendor && (
                <div className="flex items-center gap-3 ml-2 border-l border-gray-200 pl-4">
                  <div className="h-9 w-9 rounded-full bg-gray-900 flex items-center justify-center text-white shadow-md text-sm font-bold ring-2 ring-gray-100">
                    {(
                      userProfile?.full_name?.[0] ||
                      user?.username?.[0] ||
                      "V"
                    ).toUpperCase()}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden gap-4">
              {showCart && (
                <Link to="/cart" className="relative p-2 text-gray-600">
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full border-2 border-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}
              <button
                onClick={toggleMobileMenu}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results Indicator Bar */}
      {location.pathname === "/search" && currentQuery && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-sm">
            <p className="text-blue-900 font-medium">
              Search results for "
              <span className="font-bold">{currentQuery}</span>"
            </p>
            <button
              onClick={() => navigate("/products")}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              <X className="h-4 w-4" />
              Clear search & view all products
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <span className="text-xl font-bold text-gray-900">Menu</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto py-6 px-6 space-y-6">
            {/* Mobile Search */}
            {showPublicFeatures && (
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  className="w-full pl-5 pr-16 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Search products..."
                  value={search}
                  onChange={handleSearchChange}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
                  {search && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </form>
            )}

            {/* User Info */}
            {isLoggedIn && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {userProfile?.image ? (
                    <img
                      src={userProfile.image}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    (userProfile?.full_name ||
                      user?.username ||
                      "U")[0].toUpperCase()
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="font-semibold text-gray-900 truncate">
                    {userProfile?.full_name || user?.username}
                  </p>
                  <p className="text-xs text-blue-600 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="space-y-2">
              <Link
                to="/"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-xl transition-colors font-medium"
              >
                Home
              </Link>

              {isVendor && (
                <div className="space-y-1">
                  <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">
                    Vendor Area
                  </p>
                  <Link
                    to="/vendor/dashboard/"
                    className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 rounded-lg transition-colors"
                  >
                    <LayoutDashboard className="mr-3 h-5 w-5 text-gray-400" />{" "}
                    Dashboard
                  </Link>
                  <Link
                    to="/vendor/products/"
                    className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 rounded-lg transition-colors"
                  >
                    <ShoppingBag className="mr-3 h-5 w-5 text-gray-400" />{" "}
                    Products
                  </Link>
                </div>
              )}

              {isLoggedIn && !isAdmin && !isVendor && (
                <div className="space-y-1">
                  <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">
                    My Account
                  </p>
                  <Link
                    to="/customer/account/"
                    className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors"
                  >
                    <User className="mr-3 h-5 w-5 text-gray-400" /> Profile
                  </Link>
                  <Link
                    to="/customer/orders/"
                    className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors"
                  >
                    <Package className="mr-3 h-5 w-5 text-gray-400" /> Orders
                  </Link>
                  <Link
                    to="/track-order"
                    className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors"
                  >
                    <Truck className="mr-3 h-5 w-5 text-gray-400" /> Track Order
                  </Link>
                </div>
              )}
            </nav>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            {isLoggedIn ? (
              <Link
                to="/logout"
                className="flex items-center justify-center w-full px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 font-medium rounded-xl transition-colors"
              >
                <LogOut className="mr-2 h-5 w-5" /> Sign Out
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/login"
                  className="flex items-center justify-center px-4 py-3 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 font-medium rounded-xl transition-colors shadow-sm"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-xl transition-colors shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default StoreHeader;
