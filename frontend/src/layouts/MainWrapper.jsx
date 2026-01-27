// Updated MainWrapper.jsx (Centralized Admin Redirect for All Public Pages)
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // ← Added
import { setUser } from "../utils/auth";
import { useAuthStore } from "../store/auth"; // ← Added

const MainWrapper = ({ children }) => {
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate(); // ← For redirect
  const location = useLocation(); // ← To check current path
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  useEffect(() => {
    const handler = async () => {
      console.log("MainWrapper: Starting auth check...");
      setLoading(true);

      try {
        await setUser();
        console.log("MainWrapper: Auth completed successfully");
      } catch (error) {
        console.error("MainWrapper: Auth error:", error);
      } finally {
        setLoading(false);
        console.log("MainWrapper: Loading set to false");
      }
    };

    handler();
  }, []);

  // === CENTRALIZED ADMIN REDIRECT ===
  // After auth is loaded, if user is admin and not already on an admin page → redirect
  useEffect(() => {
    if (!loading && isLoggedIn && isAdmin) {
      const isOnAdminPage = location.pathname.startsWith("/admin/");
      if (!isOnAdminPage) {
        console.log(
          "MainWrapper: Admin detected on public page → redirecting to /admin/dashboard",
        );
        navigate("/admin/dashboard", { replace: true });
      }
    }
  }, [loading, isLoggedIn, isAdmin, location.pathname, navigate]);
  // ==================================

  return <>{loading ? null : children}</>;
};

export default MainWrapper;
