import { useState, useEffect } from "react";
import axios from "../../utils/axios";
import Swal from "sweetalert2";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [linkSent, setLinkSent] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  // Timer countdown effect
  useEffect(() => {
    let interval;
    if (seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [seconds]);

  const handleSubmit = async () => {
    if (!email) {
      Swal.fire({
        icon: "warning",
        title: "Please enter your email address",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.get(`user/password-reset/${email}/`);
      Swal.fire({
        icon: "success",
        title:
          res.data?.message || "If this email exists, a reset link was sent.",
      });
      setLinkSent(true);
      setSeconds(60); // Start 60-second cooldown for resend
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Something went wrong!",
        text: error.response?.data?.detail || "Please try again later.",
      });
    }
    setIsLoading(false);
  };

  const buttonText = isLoading
    ? "Sending..."
    : seconds > 0
      ? `Resend in ${seconds}s`
      : linkSent
        ? "Resend Link"
        : "Send Reset Link";

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
                        {/* Success/Timer message */}
                        {linkSent && (
                          <div className="mb-4 text-center">
                            <p className="text-green-600 font-medium">
                              Reset link sent! Please check your email
                              (including spam folder).
                            </p>
                            {seconds === 0 && (
                              <p className="text-sm text-gray-600 mt-2">
                                Didn't receive it? You can resend the link now.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Email input */}
                        <div className="mb-4">
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Email Address
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="Enter your email"
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            disabled={isLoading}
                          />
                        </div>

                        {/* Submit/Resend button */}
                        <div className="text-center">
                          <button
                            onClick={handleSubmit}
                            disabled={isLoading || seconds > 0}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {buttonText}
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
