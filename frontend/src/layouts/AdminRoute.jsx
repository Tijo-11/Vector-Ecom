import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import NotFound from "./NotFound";

export default function AdminRoute({ children }) {
  const user = useAuthStore((state) => state.user);

  // If user is not logged in or not an admin → redirect to NotFound
  if (!user || user?.is_admin !== true) {
    return <NotFound />;
  }

  // If admin → render the protected route
  return children;
}
