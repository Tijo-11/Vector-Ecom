//Problem: Unauthenticated users should not access protected pages (e.g., user dashboard).
//Solution: Use a PrivateRoute component to check authentication status and redirect to the login
//  page if necessary.
//Benefit: Enhances security by ensuring only logged-in users access sensitive routes.
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
export default function PrivateRout({ children }) {
  const loggedIn = useAuthStore((state) => state.isLoggedIn);
  return loggedIn ? <>{children}</> : <Navigate to="/login" />;
}
