// frontend/CreateNewPassword.jsx
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "../../utils/axios"; // your axios instance
import Swal from "sweetalert2";

export default function CreateNewPassword() {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const uidb64 = searchParams.get("uidb64");
  const token = searchParams.get("token");

  const navigate = useNavigate();

  const Toast = Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !password2) {
      Toast.fire({
        icon: "warning",
        title: "Please fill in both password fields",
      });
      return;
    }

    if (password !== password2) {
      Toast.fire({ icon: "error", title: "Passwords do not match" });
      return;
    }

    if (!uidb64 || !token) {
      Toast.fire({ icon: "error", title: "Invalid or expired reset link" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post("user/password-change/", {
        uidb64,
        token,
        password,
      });

      Toast.fire({
        icon: "success",
        title: response.data.message || "Password changed successfully!",
      });
      navigate("/login"); // Redirect to login after success
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Something went wrong. Please try again.";
      Toast.fire({ icon: "error", title: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  // If no uidb64/token in URL, show invalid link message
  if (!uidb64 || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h3 className="text-2xl font-semibold text-red-600 mb-4">
            Invalid or Expired Link
          </h3>
          <p className="text-gray-600">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <a
            href="/forgot-password"
            className="text-blue-600 hover:underline mt-4 inline-block"
          >
            Request New Reset Link
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="mb-24 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <section>
            <div className="flex justify-center">
              <div className="w-full max-w-xl md:max-w-md">
                <div className="bg-white rounded-2xl shadow-md">
                  <div className="p-6">
                    <h3 className="text-center text-2xl font-semibold">
                      Set New Password
                    </h3>
                    <div className="mt-6">
                      <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                          <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700"
                          >
                            New Password
                          </label>
                          <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="mb-6">
                          <label
                            htmlFor="confirm-password"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            id="confirm-password"
                            value={password2}
                            onChange={(e) => setPassword2(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        {password2 && password !== password2 && (
                          <p className="font-bold text-red-600 mb-4">
                            Passwords do not match
                          </p>
                        )}
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50 flex items-center justify-center"
                        >
                          {isLoading ? (
                            <>
                              <span className="mr-2">Processing...</span>
                              <i className="fas fa-spinner fa-spin" />
                            </>
                          ) : (
                            "Change Password"
                          )}
                        </button>
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
