import { useState, useEffect } from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import Login from "./views/auth/login";
import Register from "./views/auth/Register";
import PrivateRoute from "./layouts/PrivateRoute"; // Importing the 'PrivateRoute' component.
import CartInitializer from "./utils/CartInitializer";
//import Private from "./views/auth/private"; // Importing the 'Private' component.
import Logout from "./views/auth/Logout";
import ForgotPassword from "./views/auth/ForgotPassword";
import CreateNewPassword from "./views/auth/CreateNewPassword";
import StoreHeader from "./views/base/StoreHeader";
import StoreFooter from "./views/base/StoreFooter";
import Products from "./views/shop/Products/Products";
import ProductDetail from "./views/shop/ProductDetail/ProductDetail";
import MainWrapper from "./layouts/MainWrapper";
import CategoryProducts from "./views/shop/Category/CategoryProducts";
import Cart from "./views/shop/cart/Cart";
import Address from "./views/shop/cart/Address";
import Checkout from "./views/shop/checkout/Checkout";
import PaymentSuccess from "./views/shop/checkout/PaymentSuccess";
import PaymentFailed from "./views/shop/checkout/PaymentFailed";
import Search from "./views/shop/Search";
import TrackOrder from "./views/shop/TrackOrder";
import { CartContext } from "./plugin/Context.jsx";
import CartId from "./views/shop/ProductDetail/cartId.jsx";
import UserData from "./plugin/UserData.js";
import apiInstance from "./utils/axios.js";
import Account from "./views/customer/Accounts.jsx";
import NotFund from "./layouts/NotFound.jsx";
import Orders from "./views/customer/Orders.jsx";
import OrderDetail from "./views/customer/OrderDetail.jsx";
import Wishlist from "./views/customer/Wishlist.jsx";
import Notifications from "./views/customer/Notifications.jsx";
import Settings from "./views/customer/Settings.jsx";
import ViewOrder from "./views/customer/ViewOrder.jsx";
import Invoice from "./views/customer/Invoice.jsx";
import Dashboard from "./views/vendor/Dashboard.jsx";
import VendorProducts from "./views/vendor/VendorProducts.jsx";
import VendorOrders from "./views/vendor/VendorOrders.jsx";
import VendorOrderDetail from "./views/vendor/VendorOrderDetail.jsx";
import AddTracking from "./views/vendor/AddTracking.jsx";
import Earning from "./views/vendor/Earning";
import Reviews from "./views/vendor/Reviews";
import ReviewDetail from "./views/vendor/ReviewDetail";
import Coupon from "./views/vendor/Coupon";
import EditCoupon from "./views/vendor/EditCoupon";
import VendorNotifications from "./views/vendor/Notifications";
import VendorSettings from "./views/vendor/Settings";
import Shop from "./views/vendor/Shop";
import VendorRegister from "./views/vendor/VendorRegister";
import AddProduct from "./views/vendor/AddProduct";
import UpdateProduct from "./views/vendor/UpdateProduct.jsx";
import Offers from "./views/vendor/Offers.jsx"; // Added import for Offers
import AdminRoute from "./layouts/AdminRoute.jsx";
///////---------------
import AdminDashboard from "./views/admin/AdminDashboard.jsx";
import ProductManagement from "./views/admin/ProductManagement.jsx";
import OrderManagement from "./views/admin/OrderManagement.jsx";
import ServiceFees from "./views/admin/ServiceFees.jsx";
import Reports from "./views/admin/Reports.jsx";
import AdminNotifications from "./views/admin/AdminNotifications.jsx";
import AdminSettings from "./views/admin/AdminSettings.jsx";
import VendorManagement from "./views/admin/VendorManagement.jsx";
import Addresses from "./views/customer/Addresses.jsx";
import Profile from "./views/customer/Profile.jsx";

export default function App() {
  const [cartCount, setCartCount] = useState(0);
  return (
    <CartContext.Provider value={[cartCount, setCartCount]}>
      <BrowserRouter>
        <CartInitializer />
        <StoreHeader />
        <MainWrapper>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/create-new-password"
              element={<CreateNewPassword />}
            />
            {/* Shop */}
            <Route path="/" element={<Products />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/category/:slug" element={<CategoryProducts />} />{" "}
            <Route path="/cart" element={<Cart />} />
            <Route path="/address" element={<Address />} /> {/* New route */}
            <Route path="/checkout/:order_id" element={<Checkout />} />
            <Route path="/search" element={<Search />} />
            {/* Payment */}
            <Route
              path="/payments-success/:order_id"
              element={<PaymentSuccess />}
            />
            <Route
              path="/payments-failed/:order_id"
              element={<PaymentFailed />}
            />
            <Route path="/view-order/:order_oid/" element={<ViewOrder />} />
            <Route path="/track-order" element={<TrackOrder />} />
            {/*Customer Endpoints*/}
            <Route
              path="customer/account/"
              element={
                <PrivateRoute>
                  <Account />
                </PrivateRoute>
              }
            />
            <Route
              path="/customer/order/detail/:order_oid/"
              element={
                <PrivateRoute>
                  <OrderDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/customer/wishlist/"
              element={
                <PrivateRoute>
                  <Wishlist />
                </PrivateRoute>
              }
            />
            <Route
              path="/customer/notifications/"
              element={
                <PrivateRoute>
                  <Notifications />
                </PrivateRoute>
              }
            />
            <Route
              path="/customer/profile/"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/customer/addresses/"
              element={
                <PrivateRoute>
                  <Addresses />
                </PrivateRoute>
              }
            />
            <Route
              path="/customer/settings/"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
            <Route
              path="customer/orders/"
              element={
                <PrivateRoute>
                  <Orders />
                </PrivateRoute>
              }
            />
            <Route
              path="customer/order/invoice/:order_oid"
              element={
                <PrivateRoute>
                  <Invoice />
                </PrivateRoute>
              }
            />
            {/* Vendor Routes */}
            <Route
              path="/vendor/dashboard/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/vendor/products/"
              element={
                <PrivateRoute>
                  <VendorProducts />
                </PrivateRoute>
              }
            />
            <Route
              path="/vendor/orders/"
              element={
                <PrivateRoute>
                  <VendorOrders />
                </PrivateRoute>
              }
            />
            <Route
              path="/vendor/orders/:oid/"
              element={
                <PrivateRoute>
                  <VendorOrderDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/vendor/orders/:oid/:id/"
              element={
                <PrivateRoute>
                  <AddTracking />
                </PrivateRoute>
              }
            />
            <Route
              path="/vendor/earning/"
              element={
                <PrivateRoute>
                  <Earning />
                </PrivateRoute>
              }
            />
            <Route
              path="/vendor/reviews/"
              element={
                <PrivateRoute>
                  <Reviews />
                </PrivateRoute>
              }
            />
            <Route
              path="/vendor/reviews/:id/"
              element={
                <PrivateRoute>
                  <ReviewDetail />
                </PrivateRoute>
              }
            />
            <Route path="/detail/:slug" element={<ProductDetail />} />
            <Route
              path="/vendor/coupon/"
              element={
                <PrivateRoute>
                  <Coupon />
                </PrivateRoute>
              }
            />
            <Route
              path="/vendor/coupon/:id/"
              element={
                <PrivateRoute>
                  {" "}
                  <EditCoupon />
                </PrivateRoute>
              }
            />
            <Route
              path="/vendor/notifications/"
              element={
                <PrivateRoute>
                  {" "}
                  <VendorNotifications />
                </PrivateRoute>
              }
            />
            <Route
              path="/vendor/settings/"
              element={
                <PrivateRoute>
                  <VendorSettings />
                </PrivateRoute>
              }
            />
            <Route
              path="/vendor/product/new/"
              element={
                <PrivateRoute>
                  <AddProduct />
                </PrivateRoute>
              }
            />
            <Route
              path="/vendor/product/update/:product_pid/"
              element={
                <PrivateRoute>
                  <UpdateProduct />
                </PrivateRoute>
              }
            />
            <Route
              path="/vendor/offers/"
              element={
                <PrivateRoute>
                  <Offers />
                </PrivateRoute>
              }
            />
            <Route path="/vendor/:slug/" element={<Shop />} />
            <Route path="/vendor/register/" element={<VendorRegister />} />
            {/*Admin Routes*/}
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/vendors"
              element={
                <AdminRoute>
                  <VendorManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <AdminRoute>
                  <ProductManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminRoute>
                  <OrderManagement />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/service-fees"
              element={
                <AdminRoute>
                  <ServiceFees />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <AdminRoute>
                  <Reports />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <AdminRoute>
                  <AdminNotifications />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminRoute>
                  <AdminSettings />
                </AdminRoute>
              }
            />
            {/* Not Found*/}
            <Route path="*" element={<NotFund />} />
          </Routes>
        </MainWrapper>
        <StoreFooter />
      </BrowserRouter>
    </CartContext.Provider>
  );
}
