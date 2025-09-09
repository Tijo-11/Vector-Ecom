import React, { useMemo, useState, useRef, useEffect, useContext } from "react";
import { useAuthStore } from "../../store/auth";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react"; // or Heroicons if you prefer
import { CartContext } from "../../plugin/Context";
import UseProfileData from "../../plugin/UserProfileData";

function StoreHeader() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const userProfile = UseProfileData();

  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isVendorOpen, setIsVendorOpen] = useState(false);

  const accountRef = useRef(null);
  const vendorRef = useRef(null);
  const [cartCount, setCartCount] = useContext(CartContext);
  console.log(cartCount);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };

  const handleSearchSubmit = () => {
    navigate(`/search?query=${search}`);
  };

  // Toggle functions
  const toggleAccountDropdown = () => setIsAccountOpen(!isAccountOpen);
  const toggleVendorDropdown = () => setIsVendorOpen(!isVendorOpen);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setIsAccountOpen(false);
      }
      if (vendorRef.current && !vendorRef.current.contains(event.target)) {
        setIsVendorOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="bg-gray-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link
              to="/"
              className="text-xl font-bold text-white hover:text-gray-300"
            >
              RetroRelics{" "}
              <p className="text-xs">Shop stories, not just stuff.</p>
            </Link>

            <nav className="hidden md:flex space-x-6">
              {/* Account Dropdown */}

              {/* Vendor Dropdown */}
              {null && (
                <div className="relative" ref={vendorRef}>
                  <button
                    onClick={toggleVendorDropdown}
                    className="hover:text-gray-300 focus:outline-none"
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
                      onClick={() => setIsVendorOpen(false)}
                    >
                      <i className="fas fa-user"></i> Dashboard
                    </Link>
                    <Link
                      to="/vendor/products/"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setIsVendorOpen(false)}
                    >
                      <i className="bi bi-grid-fill"></i> Products
                    </Link>
                    <Link
                      to="/vendor/product/new/"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setIsVendorOpen(false)}
                    >
                      <i className="fas fa-plus-circle"></i> Add Products
                    </Link>
                    <Link
                      to="/vendor/orders/"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setIsVendorOpen(false)}
                    >
                      <i className="fas fa-shopping-cart"></i> Orders
                    </Link>
                    <Link
                      to="/vendor/earning/"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setIsVendorOpen(false)}
                    >
                      <i className="fas fa-dollar-sign"></i> Earning
                    </Link>
                    <Link
                      to="/vendor/reviews/"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setIsVendorOpen(false)}
                    >
                      <i className="fas fa-star"></i> Reviews
                    </Link>
                    <Link
                      to="/vendor/coupon/"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setIsVendorOpen(false)}
                    >
                      <i className="fas fa-tag"></i> Coupon
                    </Link>
                    <Link
                      to="/vendor/notifications/"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setIsVendorOpen(false)}
                    >
                      <i className="fas fa-bell"></i> Notifications
                    </Link>
                    <Link
                      to="/vendor/settings/"
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => setIsVendorOpen(false)}
                    >
                      <i className="fas fa-gear"></i> Settings
                    </Link>
                  </div>
                </div>
              )}
            </nav>

            <div className="flex items-center space-x-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault(); // prevent page reload
                  handleSearchSubmit();
                }}
                className="flex items-center space-x-2"
              >
                <input
                  onChange={handleSearchChange}
                  name="search"
                  className="rounded-lg bg-white px-3 py-1 text-gray-900 focus:outline-none"
                  type="text"
                  placeholder="Search"
                />
                <button
                  onClick={handleSearchSubmit}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
                >
                  Search
                </button>
              </form>
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
                        onClick={() => setIsAccountOpen(false)}
                      >
                        <i className="fas fa-user"></i> Account
                      </Link>
                      <Link
                        to="/customer/orders/"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        <i className="fas fa-shopping-cart"></i> Orders
                      </Link>
                      <Link
                        to="/customer/wishlist/"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        <i className="fas fa-heart"></i> Wishlist
                      </Link>
                      <Link
                        to="/customer/notifications/"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        <i className="fas fa-bell"></i> Notifications
                      </Link>
                      <Link
                        to="/customer/settings/"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        <i className="fas fa-gear"></i> Settings
                      </Link>
                    </div>
                  </div>

                  <Link
                    to="/logout"
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg"
                  >
                    Logout
                  </Link>
                  <Link
                    to="/cart"
                    className="relative inline-flex items-center justify-center p-2 rounded-full bg-gray-100 hover:bg-blue-400 transition"
                  >
                    <ShoppingCart className="h-6 w-6 text-gray-700" />

                    {/* Badge */}
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                      {cartCount || 0}
                    </span>
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
                  <Link
                    to="/cart"
                    className="relative inline-flex items-center justify-center p-2 rounded-full bg-gray-100 hover:bg-blue-400 transition"
                  >
                    <ShoppingCart className="h-6 w-6 text-gray-700" />

                    {/* Badge */}
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                      {cartCount || 0}
                    </span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default StoreHeader;
