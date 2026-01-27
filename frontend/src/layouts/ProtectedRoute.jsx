// src/layouts/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom"; // Add useLocation
import { useAuthStore } from "../store/auth";

export default function ProtectedRoute({ children }) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const location = useLocation(); // To see which page was attempted

  console.log("ProtectedRoute triggered for:", location.pathname);
  console.log("Auth status:", { isLoggedIn, isAdmin });

  if (!isLoggedIn) {
    console.log("→ Not logged in → redirect to /login");
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    console.log("→ Admin detected → blocked, redirect to /admin/dashboard");
    return <Navigate to="/admin/dashboard" replace />;
  }

  console.log("→ Access granted (customer/vendor)");
  return children;
}
