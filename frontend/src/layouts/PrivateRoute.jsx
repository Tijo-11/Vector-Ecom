//Problem: Unauthenticated users should not access protected pages (e.g., user dashboard).
//Solution: Use a PrivateRoute component to check authentication status and redirect to the login page if necessary.
//Benefit: Enhances security by ensuring only logged-in users access sensitive routes.
import { Navigate } from "react-router-dom";
//used to programmatically redirect users to a different route in your app.
import { useAuthStore } from "../store/auth";
// Define the 'PrivateRoute' component as a functional component that takes 'children' as a prop.
export default function PrivateRout({ children }) {
  // Use the 'useAuthStore' hook to check the user's authentication status.
  const loggedIn = useAuthStore((state) => state.isLoggedIn);
  // Conditionally render the children if the user is authenticated.
  // If the user is not authenticated, redirect them to the login page.
  return loggedIn ? <>{children}</> : <Navigate to="/login" />;
}
// Export the 'PrivateRoute' component to make it available for use in other parts of the application.
