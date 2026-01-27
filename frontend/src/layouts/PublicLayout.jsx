// src/layouts/PublicLayout.jsx
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";

export default function PublicLayout() {
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      console.log(
        "PublicLayout: Admin on public page → redirecting to /admin/dashboard",
      );
      navigate("/admin/dashboard", { replace: true });
    }
  }, [isLoggedIn, isAdmin, navigate]);

  return <Outlet />;
}
