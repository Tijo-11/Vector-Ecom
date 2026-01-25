import { useState } from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react"; // ← Add these

import Login from "./views/auth/login";
import Register from "./views/auth/Register";
import PrivateRoute from "./layouts/PrivateRoute";
import CartInitializer from "./utils/CartInitializer";
import Logout from "./views/auth/Logout";
import ForgotPassword from "./views/auth/ForgotPassword";
import CreateNewPassword from "./views/auth/CreateNewPassword";
import StoreHeader from "./views/base/StoreHeader";
import StoreFooter from "./views/base/StoreFooter";
import MainWrapper from "./layouts/MainWrapper";
import CartId from "./views/shop/ProductDetail/cartId.jsx";
import { CartContext } from "./plugin/Context.jsx";
import NotFund from "./layouts/NotFound.jsx";
import ProductsPlaceholder from "./views/shop/Products/ProductsPlaceHolder"; // ← Import your placeholder
import AdminRoute from "./layouts/AdminRoute.jsx";

// Lazy load all heavy page components
const Products = lazy(() => import("./views/shop/Products/Products"));
const ProductDetail = lazy(
  () => import("./views/shop/ProductDetail/ProductDetail"),
);
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
const AdminDashboard = lazy(() => import("./views/admin/AdminDashboard.jsx"));
const ProductManagement = lazy(
  () => import("./views/admin/ProductManagement.jsx"),
);
const OrderManagement = lazy(() => import("./views/admin/OrderManagement.jsx"));
const ServiceFees = lazy(() => import("./views/admin/ServiceFees.jsx"));
const Reports = lazy(() => import("./views/admin/Reports.jsx"));
const AdminNotifications = lazy(
  () => import("./views/admin/AdminNotifications.jsx"),
);
const AdminSettings = lazy(() => import("./views/admin/AdminSettings.jsx"));
const VendorManagement = lazy(
  () => import("./views/admin/VendorManagement.jsx"),
);
const Addresses = lazy(() => import("./views/customer/Addresses.jsx"));
const Profile = lazy(() => import("./views/customer/Profile.jsx"));

export default function App() {
  const [cartCount, setCartCount] = useState(0);

  return (
    <CartContext.Provider value={[cartCount, setCartCount]}>
      <BrowserRouter>
        <CartInitializer />
        <StoreHeader />
        <MainWrapper>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <Suspense fallback={<ProductsPlaceholder />}>
                  <Products />
                </Suspense>
              }
            />
            <Route
              path="/product/:slug"
              element={
                <Suspense fallback={<ProductsPlaceholder />}>
                  <ProductDetail />
                </Suspense>
              }
            />
            <Route
              path="/category/:slug"
              element={
                <Suspense fallback={<ProductsPlaceholder />}>
                  <CategoryProducts />
                </Suspense>
              }
            />
            <Route
              path="/cart"
              element={
                <Suspense fallback={<ProductsPlaceholder />}>
                  <Cart />
                </Suspense>
              }
            />
            <Route
              path="/address"
              element={
                <Suspense fallback={<ProductsPlaceholder />}>
                  <Address />
                </Suspense>
              }
            />
            <Route
              path="/checkout/:order_id"
              element={
                <Suspense fallback={<ProductsPlaceholder />}>
                  <Checkout />
                </Suspense>
              }
            />
            <Route
              path="/search"
              element={
                <Suspense fallback={<ProductsPlaceholder />}>
                  <Search />
                </Suspense>
              }
            />
            <Route
              path="/payments-success/:order_id"
              element={
                <Suspense fallback={<ProductsPlaceholder />}>
                  <PaymentSuccess />
                </Suspense>
              }
            />
            <Route
              path="/payments-failed/:order_id"
              element={
                <Suspense fallback={<ProductsPlaceholder />}>
                  <PaymentFailed />
                </Suspense>
              }
            />
            <Route
              path="/view-order/:order_oid/"
              element={
                <Suspense fallback={<ProductsPlaceholder />}>
                  <ViewOrder />
                </Suspense>
              }
            />
            <Route
              path="/track-order"
              element={
                <Suspense fallback={<ProductsPlaceholder />}>
                  <TrackOrder />
                </Suspense>
              }
            />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/create-new-password"
              element={<CreateNewPassword />}
            />
            <Route path="/vendor/register/" element={<VendorRegister />} />

            {/* Private Customer Routes */}
            <Route
              path="customer/account/"
              element={
                <Suspense fallback={<ProductsPlaceholder />}>
                  <PrivateRoute>
                    <Account />
                  </PrivateRoute>
                </Suspense>
              }
            />
            {/* Repeat the same Suspense + PrivateRoute pattern for all other private routes */}
            {/* Example: */}
            <Route
              path="customer/orders/"
              element={
                <Suspense fallback={<ProductsPlaceholder />}>
                  <PrivateRoute>
                    <Orders />
                  </PrivateRoute>
                </Suspense>
              }
            />
            {/* ... apply to all other customer, vendor, admin routes similarly */}

            {/* Not Found */}
            <Route path="*" element={<NotFund />} />
          </Routes>
        </MainWrapper>
        <StoreFooter />
      </BrowserRouter>
    </CartContext.Provider>
  );
}
