// src/App.jsx (Full Corrected File - Fixed LoadingSpinner typo and syntax)
import { useState } from "react";
import { Routes, Route, BrowserRouter, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";

import Login from "./views/auth/login";
import Register from "./views/auth/Register";
import CartInitializer from "./utils/CartInitializer";
import Logout from "./views/auth/Logout";
import ForgotPassword from "./views/auth/ForgotPassword";
import CreateNewPassword from "./views/auth/CreateNewPassword";
import StoreHeader from "./views/base/StoreHeader";
import StoreFooter from "./views/base/StoreFooter";
import MainWrapper from "./layouts/MainWrapper";
import { CartContext } from "./plugin/Context.jsx";
import NotFund from "./layouts/NotFound.jsx";
import AdminRoute from "./layouts/AdminRoute.jsx";
import ProtectedRoute from "./layouts/ProtectedRoute.jsx";
import PublicLayout from "./layouts/PublicLayout.jsx"; // ← NEW IMPORT

// Conditional Footer - hides only on admin pages
function ConditionalFooter() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin/");

  if (isAdminPage) {
    return null;
  }
  return <StoreFooter />;
}

// Lazy load all page-level components
const Home = lazy(() => import("./views/shop/Home"));
const Products = lazy(() => import("./views/shop/Products/Products"));
const ProductDetail = lazy(
  () => import("./views/shop/ProductDetail/ProductDetail"),
);
const Category = lazy(() => import("./views/shop/Category/Category"));
const CategoryProducts = lazy(
  () => import("./views/shop/Category/CategoryProducts"),
);
const Cart = lazy(() => import("./views/shop/cart/Cart"));
const Address = lazy(() => import("./views/shop/cart/Address"));
const Checkout = lazy(() => import("./views/shop/checkout/Checkout"));
const PaymentSuccess = lazy(
  () => import("./views/shop/checkout/PaymentSuccess"),
);
const PaymentFailed = lazy(() => import("./views/shop/checkout/PaymentFailed"));
const Search = lazy(() => import("./views/shop/Search"));
const TrackOrder = lazy(() => import("./views/shop/TrackOrder"));

const Account = lazy(() => import("./views/customer/Accounts.jsx"));
const Orders = lazy(() => import("./views/customer/Orders.jsx"));
const OrderDetail = lazy(() => import("./views/customer/OrderDetail.jsx"));
const Wishlist = lazy(() => import("./views/customer/Wishlist.jsx"));
const Notifications = lazy(() => import("./views/customer/Notifications.jsx"));
const Settings = lazy(() => import("./views/customer/Settings.jsx"));
const Profile = lazy(() => import("./views/customer/Profile.jsx"));
const Addresses = lazy(() => import("./views/customer/Addresses.jsx"));
const ViewOrder = lazy(() => import("./views/customer/ViewOrder.jsx"));
const Invoice = lazy(() => import("./views/customer/Invoice.jsx"));

const Dashboard = lazy(() => import("./views/vendor/Dashboard.jsx"));
const VendorProducts = lazy(() => import("./views/vendor/VendorProducts.jsx"));
const VendorOrders = lazy(() => import("./views/vendor/VendorOrders.jsx"));
const VendorOrderDetail = lazy(
  () => import("./views/vendor/VendorOrderDetail.jsx"),
);
const AddTracking = lazy(() => import("./views/vendor/AddTracking.jsx"));
const Earning = lazy(() => import("./views/vendor/Earning"));
const Reviews = lazy(() => import("./views/vendor/Reviews"));
const ReviewDetail = lazy(() => import("./views/vendor/ReviewDetail"));
const Coupon = lazy(() => import("./views/vendor/Coupon"));
const EditCoupon = lazy(() => import("./views/vendor/EditCoupon"));
const VendorNotifications = lazy(() => import("./views/vendor/Notifications"));
const VendorSettings = lazy(() => import("./views/vendor/Settings"));
const Shop = lazy(() => import("./views/vendor/Shop"));
const VendorRegister = lazy(() => import("./views/vendor/VendorRegister"));
const AddProduct = lazy(() => import("./views/vendor/AddProduct"));
const UpdateProduct = lazy(() => import("./views/vendor/UpdateProduct.jsx"));
const Offers = lazy(() => import("./views/vendor/Offers.jsx"));
const VendorWallet = lazy(() => import("./views/vendor/VendorWallet.jsx"));
const Wallet = lazy(() => import("./views/customer/Wallet.jsx"));

const AdminDashboard = lazy(() => import("./views/admin/AdminDashboard.jsx"));
const VendorManagement = lazy(
  () => import("./views/admin/VendorManagement.jsx"),
);
const ProductManagement = lazy(
  () => import("./views/admin/ProductManagement.jsx"),
);
const OrderManagement = lazy(() => import("./views/admin/OrderManagement.jsx"));
const CategoryOffer = lazy(() => import("./views/admin/CategoryOffer.jsx"));
const Reports = lazy(() => import("./views/admin/Reports.jsx"));
const AdminNotifications = lazy(
  () => import("./views/admin/AdminNotifications.jsx"),
);
const AdminSettings = lazy(() => import("./views/admin/AdminSettings.jsx"));

// Generic full-screen spinner
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-600 mb-8"></div>
    <h1 className="text-2xl font-semibold text-gray-800 mb-4">Loading...</h1>
    <p className="text-lg text-gray-600 text-center max-w-md">
      Please wait while we load the page...
    </p>
  </div>
);

export default function App() {
  const [cartCount, setCartCount] = useState(0);

  return (
    <CartContext.Provider value={[cartCount, setCartCount]}>
      <BrowserRouter>
        <CartInitializer />
        <StoreHeader />
        <MainWrapper>
          <Routes>
            {/* Public Shop Routes + Vendor Register - All under PublicLayout for centralized admin redirect */}
            <Route element={<PublicLayout />}>
              <Route
                path="/"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Home />
                  </Suspense>
                }
              />
              <Route
                path="/category"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Category />
                  </Suspense>
                }
              />
              <Route
                path="/products"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Products />
                  </Suspense>
                }
              />
              <Route
                path="/product/:slug"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <ProductDetail />
                  </Suspense>
                }
              />
              <Route
                path="/detail/:slug"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <ProductDetail />
                  </Suspense>
                }
              />
              <Route
                path="/category/:slug"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <CategoryProducts />
                  </Suspense>
                }
              />
              <Route
                path="/customer/wallet/"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <ProtectedRoute>
                      <Wallet />
                    </ProtectedRoute>
                  </Suspense>
                }
              />
              <Route
                path="/cart"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Cart />
                  </Suspense>
                }
              />
              <Route
                path="/address"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Address />
                  </Suspense>
                }
              />
              <Route
                path="/checkout/:order_id"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Checkout />
                  </Suspense>
                }
              />
              <Route
                path="/search"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Search />
                  </Suspense>
                }
              />
              <Route
                path="/track-order"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <TrackOrder />
                  </Suspense>
                }
              />
              <Route
                path="/payments-success/:order_id"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <PaymentSuccess />
                  </Suspense>
                }
              />
              <Route
                path="/payments-failed/:order_id"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <PaymentFailed />
                  </Suspense>
                }
              />
              <Route
                path="/view-order/:order_oid/"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <ViewOrder />
                  </Suspense>
                }
              />
              {/* Vendor Public Routes */}
              <Route
                path="/vendor/register/"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <VendorRegister />
                  </Suspense>
                }
              />
              <Route
                path="/vendor/:slug/"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Shop />
                  </Suspense>
                }
              />
            </Route>

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/create-new-password"
              element={<CreateNewPassword />}
            />

            {/* Private Customer Routes */}
            <Route
              path="/customer/account/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/customer/orders/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/customer/order/detail/:order_oid/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <OrderDetail />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/customer/wishlist/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <Wishlist />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/customer/notifications/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/customer/profile/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/customer/addresses/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <Addresses />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/customer/settings/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/customer/order/invoice/:order_oid"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <Invoice />
                  </ProtectedRoute>
                </Suspense>
              }
            />

            {/* Private Vendor Routes */}
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/vendor/dashboard/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/vendor/products/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <VendorProducts />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/vendor/orders/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <VendorOrders />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/vendor/orders/:oid/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <VendorOrderDetail />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/vendor/orders/:oid/:id/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <AddTracking />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/vendor/earning/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <Earning />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/vendor/reviews/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <Reviews />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/vendor/reviews/:id/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <ReviewDetail />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/vendor/coupon/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <Coupon />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/vendor/coupon/:id/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <EditCoupon />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/vendor/notifications/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <VendorNotifications />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/vendor/settings/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <VendorSettings />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/vendor/product/new/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <AddProduct />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/vendor/product/update/:product_pid/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <UpdateProduct />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/vendor/offers/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <Offers />
                  </ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/vendor/wallet-transactions/"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ProtectedRoute>
                    <VendorWallet />
                  </ProtectedRoute>
                </Suspense>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                </Suspense>
              }
            />
            <Route
              path="/admin/vendors"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminRoute>
                    <VendorManagement />
                  </AdminRoute>
                </Suspense>
              }
            />
            <Route
              path="/admin/products"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminRoute>
                    <ProductManagement />
                  </AdminRoute>
                </Suspense>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminRoute>
                    <OrderManagement />
                  </AdminRoute>
                </Suspense>
              }
            />
            <Route
              path="/admin/category-offer"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminRoute>
                    <CategoryOffer />
                  </AdminRoute>
                </Suspense>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminRoute>
                    <Reports />
                  </AdminRoute>
                </Suspense>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminRoute>
                    <AdminNotifications />
                  </AdminRoute>
                </Suspense>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminRoute>
                    <AdminSettings />
                  </AdminRoute>
                </Suspense>
              }
            />

            {/* Not Found */}
            <Route path="*" element={<NotFund />} />
          </Routes>
        </MainWrapper>
        <ConditionalFooter />
      </BrowserRouter>
    </CartContext.Provider>
  );
}
