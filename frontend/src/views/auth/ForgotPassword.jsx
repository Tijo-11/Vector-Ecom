import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import axios from "../../utils/axios";
import Swal from "sweetalert2";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [searchParams] = useSearchParams();

  const otp = searchParams.get("otp");
  const uuid = searchParams.get("uuid");

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleEmailSubmit = async () => {
    if (!email) {
      Swal.fire({
        icon: "warning",
        title: "Please enter your email address",
      });
      return;
    }

    try {
      const res = await axios.get(`user/password-reset/${email}/`);
      Swal.fire({
        icon: "success",
        title:
          res.data?.message || "If this email exists, a reset link was sent.",
      });
    } catch (error) {
      // Network or server error handling
      Swal.fire({
        icon: "error",
        title: "Something went wrong!",
        text: error.response?.data?.detail || "Please try again later.",
      });
    }
  };

  return (
    <>
      <section>
        <main className="mb-24 mt-12">
          <div className="max-w-7xl mx-auto px-4">
            <section>
              <div className="flex justify-center">
                <div className="w-full max-w-xl md:max-w-md">
                  <div className="bg-white rounded-2xl shadow-md">
                    <div className="p-6">
                      <h3 className="text-center text-2xl font-semibold">
                        Forgot Password
                      </h3>
                      <div className="mt-6">
                        {/* Email input */}
                        <div className="mb-4">
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Email Address
                          </label>
                          <input
                            type="text"
                            id="email"
                            name="email"
                            value={email}
                            onChange={handleEmailChange}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        {/* Submit button */}
                        <div className="text-center">
                          <button
                            onClick={handleEmailSubmit}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
                          >
                            Reset Password
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </section>
    </>
  );
}
