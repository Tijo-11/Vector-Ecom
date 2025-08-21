import { useEffect, useState } from "react";
import { register } from "../../utils/auth";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";

export default function Register() {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  // Subscribes to `isLoggedIn` value from the auth store using Zustand's selector pattern.
  // Ensures component re-renders only when `isLoggedIn` changes, improving performance.
  //useAuthStore is a custom hook  that gives access to a global state.
  //You pass it a selector function: (state) => state.isLoggedIn.
  //This tells the hook: “Give me just the isLoggedIn value from the store.”
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) {
      navigate("/");
    }
  }, []);

  const resetForm = () => {
    // Declares a function named `resetForm`—likely used to clear or reset form fields.
    setFullname("");
    setEmail("");
    setPhone("");
    setPassword("");
    setPassword2("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Set isLoading to true when the form is submitted
    setIsLoading(true);
    const { error } = await register(
      fullname,
      email,
      phone,
      password,
      password2
    );
    if (error) {
      alert(JSON.stringify(error));
    } else {
      navigate("/");
      resetForm;
    }
    // Reset isLoading to false when the operation is complete
    setIsLoading(false);
  };

  return (
    <>
      <main className="mb-24 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Section: Register form */}
          <section>
            <div className="flex justify-center">
              <div className="w-full max-w-xl md:max-w-md">
                <div className="bg-white rounded-2xl shadow-md">
                  <div className="p-6">
                    <h3 className="text-center text-2xl font-semibold">
                      Register Account
                    </h3>
                    <div className="mt-6">
                      <form onSubmit={handleSubmit}>
                        {/* Full Name */}
                        <div className="mb-4">
                          <label
                            htmlFor="username"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Full Name
                          </label>
                          <input
                            type="text"
                            id="username"
                            onChange={(e) => setFullname(e.target.value)}
                            placeholder="Full Name"
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        {/* Email */}
                        <div className="mb-4">
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        {/* Mobile Number */}
                        <div className="mb-4">
                          <label
                            htmlFor="phone"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Mobile Number
                          </label>
                          <input
                            type="text"
                            id="phone"
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Mobile Number"
                            // required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        {/* Password */}
                        <div className="mb-4">
                          <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Password
                          </label>
                          <input
                            type="password"
                            id="password"
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        {/* Confirm Password */}
                        <div className="mb-4">
                          <label
                            htmlFor="confirm-password"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Confirm Password
                          </label>
                          <input
                            type="password"
                            id="confirm-password"
                            onChange={(e) => setPassword2(e.target.value)}
                            placeholder="Confirm Password"
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        {/* Error message */}
                        <p className="font-bold text-red-600">
                          {password2 !== password
                            ? "Passwords do not match"
                            : ""}
                        </p>
                        {/* Submit button */}
                        <button
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50 flex items-center justify-center"
                          type="submit"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <span className="mr-2">Processing...</span>
                              <i className="fas fa-spinner fa-spin" />
                            </>
                          ) : (
                            <>
                              <span className="mr-2">Sign Up</span>
                              <i className="fas fa-user-plus" />
                            </>
                          )}
                        </button>
                        <div className="text-center mt-6">
                          <p>
                            Already have an account?{" "}
                            <Link
                              to="/login"
                              className="text-blue-600 hover:underline"
                            >
                              Login
                            </Link>
                          </p>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
