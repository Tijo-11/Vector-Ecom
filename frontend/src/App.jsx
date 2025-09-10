import { useState, useEffect } from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import Login from "./views/auth/login";
import Register from "./views/auth/Register";
import Dashboard from "./views/auth/Dashboard";
import PrivateRoute from "./layouts/PrivateRoute"; // Importing the 'PrivateRoute' component.
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
import Cart from "./views/shop/cart/cart";
import Checkout from "./views/shop/checkout/Checkout";
import PaymentSuccess from "./views/shop/checkout/PaymentSuccess";
import PaymentFailed from "./views/shop/checkout/PaymentFailed";
import Search from "./views/shop/Search";
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

//
export default function App() {
  const [count, setCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  const cart_id = CartId();
  const userData = UserData();

  useEffect(() => {
    const url = userData?.user_id
      ? `/cart-list/${cart_id}/${userData?.user_id}/`
      : `/cart-list/${cart_id}/`;
    apiInstance.get(url).then((res) => {
      const totalQty = res.data.reduce((sum, item) => sum + item.qty, 0);
      setCartCount(totalQty);
    });
  }, [cart_id, userData?.user_id]);

  return (
    <CartContext.Provider value={[cartCount, setCartCount]}>
      <BrowserRouter>
        <StoreHeader />
        <MainWrapper>
          <Routes>
            {/* <Route // Define a specific route.
            path="/private" // Set the route path to "/private".
            element={
              // Render the element when this route matches.
              <PrivateRoute>
                <Private />
              </PrivateRoute>
            }
          /> */}
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
            <Route path="/checkout/:order_id" element={<Checkout />} />
            <Route path="/search" element={<Search />} />
            {/* Payment */}
            <Route
              path="/payments-success/:order_id"
              element={<PaymentSuccess />}
            />
            <Route
              path="/payments-failed/:session_id"
              element={<PaymentFailed />}
            />
            <Route path="/view-order/:order_oid/" element={<ViewOrder />} />
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
            {/* Not Found*/}
            <Route path="*" element={<NotFund />} />
          </Routes>
        </MainWrapper>
        <StoreFooter />
      </BrowserRouter>
    </CartContext.Provider>
  );
}
