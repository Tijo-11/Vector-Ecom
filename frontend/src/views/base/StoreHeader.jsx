import React, { useMemo, useState, useRef, useEffect, useContext } from "react";
import { useAuthStore } from "../../store/auth";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { CartContext } from "../../plugin/Context";
import UseProfileData from "../../plugin/UserProfileData";

function StoreHeader() {
  const { user, isLoggedIn, isVendor } = useAuthStore();
  const [cartCount] = useContext(CartContext);
  const userProfile = UseProfileData();

  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isVendorOpen, setIsVendorOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const accountRef = useRef(null);
  const vendorRef = useRef(null);

  const handleSearchChange = (event) => setSearch(event.target.value);

  const handleSearchSubmit = () => {
    navigate(`/search?query=${search}`);
    setIsMobileMenuOpen(false);
  };

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

  return (
    <header className="bg-gray-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link
            to="/"
            className="text-xl font-bold text-white hover:text-gray-300"
          >
            RetroRelics{" "}
            <p className="text-xs text-gray-400">
              Shop stories, not just stuff.
            </p>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isVendor && (
              <div className="relative" ref={vendorRef}>
                <button
                  onClick={toggleVendorDropdown}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg"
                >
                  Vendor ▾
                </button>
                <div
                  className={`absolute left-0 mt-2 w-56 bg-white text-gray-900 rounded-md shadow-md z-50 flex-col ${
                    isVendorOpen ? "flex" : "hidden"
                  }`}
                >
                  <Link
                    to="/vendor/dashboard/"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/vendor/products/"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Products
                  </Link>
                  <Link
                    to="/vendor/product/new/"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Add Products
                  </Link>
                  <Link
                    to="/vendor/orders/"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Orders
                  </Link>
                  <Link
                    to="/vendor/earning/"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Earning
                  </Link>
                  <Link
                    to="/vendor/reviews/"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Reviews
                  </Link>
                  <Link
                    to="/vendor/coupon/"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Coupon
                  </Link>
                  <Link
                    to="/vendor/notifications/"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Notifications
                  </Link>
                  <Link
                    to="/vendor/settings/"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Settings
                  </Link>
                </div>
              </div>
            )}

            {/* Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchSubmit();
              }}
              className="flex items-center space-x-2"
            >
              <input
                onChange={handleSearchChange}
                value={search}
                className="rounded-lg bg-white px-3 py-1 text-gray-900 focus:outline-none"
                type="text"
                placeholder="Search"
              />
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
              >
                Search
              </button>
            </form>

            {/* Account + Logout + Cart */}
            {isLoggedIn ? (
              <>
                <div className="relative" ref={accountRef}>
                  <button
                    onClick={toggleAccountDropdown}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg"
                  >
                    Account ▾
                  </button>
                  <div
                    className={`absolute left-0 mt-2 w-48 bg-white text-gray-900 rounded-md shadow-md z-50 flex-col ${
                      isAccountOpen ? "flex" : "hidden"
                    }`}
                  >
                    <Link
                      to="/customer/account/"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Account
                    </Link>
                    <Link
                      to="/customer/orders/"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Orders
                    </Link>
                    <Link
                      to="/customer/wishlist/"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Wishlist
                    </Link>
                    <Link
                      to="/customer/notifications/"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Notifications
                    </Link>
                    <Link
                      to="/customer/settings/"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Settings
                    </Link>
                  </div>
                </div>
                <Link
                  to="/logout"
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg"
                >
                  Logout
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg"
                >
                  Register
                </Link>
              </>
            )}

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative inline-flex items-center justify-center p-2 rounded-full bg-gray-100 hover:bg-blue-400 transition"
            >
              <ShoppingCart className="h-6 w-6 text-gray-700" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                {cartCount || 0}
              </span>
            </Link>
          </div>

          {/* Mobile Burger Button */}
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden flex flex-col space-y-3 pb-4 border-t border-gray-700">
            {isVendor && (
              <>
                <Link
                  to="/vendor/dashboard/"
                  className="px-3 py-2 hover:bg-gray-800 rounded"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Vendor Dashboard
                </Link>
              </>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchSubmit();
              }}
              className="flex items-center space-x-2 px-3"
            >
              <input
                onChange={handleSearchChange}
                value={search}
                className="rounded-lg bg-white px-3 py-1 text-gray-900 w-full focus:outline-none"
                type="text"
                placeholder="Search..."
              />
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
              >
                Go
              </button>
            </form>

            {isLoggedIn ? (
              <>
                <Link
                  to="/customer/account/"
                  className="px-3 py-2 hover:bg-gray-800 rounded"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Account
                </Link>
                <Link
                  to="/customer/orders/"
                  className="px-3 py-2 hover:bg-gray-800 rounded"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Orders
                </Link>
                <Link
                  to="/logout"
                  className="px-3 py-2 hover:bg-gray-800 rounded"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Logout
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 hover:bg-gray-800 rounded"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 hover:bg-gray-800 rounded"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}

            <Link
              to="/cart"
              className="relative inline-flex items-center px-3 py-2 hover:bg-gray-800 rounded"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <ShoppingCart className="h-5 w-5 text-white mr-2" />
              Cart
              <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {cartCount || 0}
              </span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default StoreHeader;
