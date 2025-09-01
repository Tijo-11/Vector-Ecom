import { useState } from "react";
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

export default function App() {
  const [count, setCount] = useState(0);

  return (
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
          <Route path="/create-new-password" element={<CreateNewPassword />} />
          {/* Shop */}
          <Route path="/" element={<Products />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/category/:slug" element={<CategoryProducts />} />{" "}
          <Route path="/cart" element={<Cart />} />
          {/* 👈 new route */}
        </Routes>
      </MainWrapper>
      <StoreFooter />
    </BrowserRouter>
  );
}
