import { Link } from "react-router-dom";

import { useAuthStore } from "../../store/auth";

export default function Dashboard() {
  // Extracting user and isLoggedIn state directly from the store
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);

  return (
    <>
      {isLoggedIn ? (
        // If the user is logged in, show the dashboard with a logout button
        <>
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
          <p className="mb-4 text-gray-600">
            Welcome back, {user?.username || "User"}!
          </p>
          <Link
            to="/logout"
            className="inline-block bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-200"
          >
            Logout
          </Link>
        </>
      ) : (
        // If the user is not logged in, show the home page with login/register buttons
        <>
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Home Page</h1>
          <Link
            to="/login"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200 mr-2"
          >
            Login
          </Link>
          <br />
          <Link
            to="/register"
            className="inline-block mt-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200"
          >
            Register
          </Link>
        </>
      )}
    </>
  );
}
