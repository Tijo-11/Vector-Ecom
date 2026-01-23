// frontend/Register.jsx (Full updated version with OTP timer, resend, back-to-edit, and Google referral support)
import { useEffect, useState } from "react";
import { register, verifyOtp, login, googleLogin } from "../../utils/auth";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import Swal from "sweetalert2";
import apiInstance from "../../utils/axios";

export default function Register() {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [uidb64, setUidb64] = useState("");
  const [newUserId, setNewUserId] = useState(null);
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);

  // Timer states for OTP cooldown/resend
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refToken = searchParams.get("ref");

  const Toast = Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
  });

  // Timer countdown effect
  useEffect(() => {
    if (!timerActive || seconds <= 0) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, seconds]);

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/");
    }
    const loadGoogleScript = () => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => setIsGoogleScriptLoaded(true);
      document.body.appendChild(script);
    };
    loadGoogleScript();
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (isGoogleScriptLoaded && window.google && window.google.accounts) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("googleSignUpDiv"),
        { theme: "outline", size: "large" },
      );
    }
  }, [isGoogleScriptLoaded]);

  const applyReferral = async (token, userId) => {
    try {
      const response = await apiInstance.post("referral/apply/", {
        token,
        new_user_id: userId,
      });
      if (response.data.message) {
        Toast.fire({ icon: "success", title: "Referral applied!" });
      }
    } catch (error) {
      console.error("Referral apply failed:", error);
    }
  };

  const handleGoogleResponse = async (response) => {
    setIsLoading(true);
    const result = await googleLogin(response.credential);

    if (result.error || !result.data) {
      Toast.fire({
        icon: "error",
        title: result.error || "Google signup failed",
      });
      setIsLoading(false);
      return;
    }

    const { data } = result;

    // Apply referral for new Google signups
    if (data.new_user && refToken && data.user_id) {
      await applyReferral(refToken, data.user_id);
    }

    navigate("/");
    setIsLoading(false);
  };

  const startTimer = () => {
    setSeconds(60);
    setTimerActive(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== password2) {
      Toast.fire({ icon: "error", title: "Passwords do not match" });
      return;
    }
    setIsLoading(true);
    const { data, error } = await register(
      fullname,
      email,
      phone,
      password,
      password2,
    );
    setIsLoading(false);
    if (error) {
      Toast.fire({ icon: "error", title: error });
    } else if (data && data.uidb64) {
      Toast.fire({ icon: "info", title: data.message || "OTP sent to email" });
      setUidb64(data.uidb64);
      if (data.user_id) setNewUserId(data.user_id);
      setShowOtp(true);
      startTimer();
    } else {
      Toast.fire({ icon: "error", title: "Unexpected response from server" });
      console.error("Unexpected data format:", data);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    const { data, error } = await register(
      fullname,
      email,
      phone,
      password,
      password2,
    );
    setIsLoading(false);
    if (error) {
      Toast.fire({ icon: "error", title: error });
    } else {
      Toast.fire({ icon: "success", title: "OTP resent successfully!" });
      if (data.uidb64) setUidb64(data.uidb64);
      if (data.user_id) setNewUserId(data.user_id);
      startTimer();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await verifyOtp(otp, uidb64);
    if (error) {
      setIsLoading(false);
      Toast.fire({ icon: "error", title: error });
    } else {
      const loginResult = await login(email, password);
      setIsLoading(false);
      if (loginResult.error) {
        Toast.fire({
          icon: "error",
          title:
            "Verification successful but login failed. Please login manually.",
        });
      } else {
        if (refToken && newUserId) {
          await applyReferral(refToken, newUserId);
        }
        navigate("/");
      }
    }
  };

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
                      Register Account
                    </h3>
                    <div className="mt-6">
                      {!showOtp ? (
                        <form onSubmit={handleSubmit}>
                          <div className="mb-4">
                            <label
                              htmlFor="fullname"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Full Name
                            </label>
                            <input
                              type="text"
                              id="fullname"
                              value={fullname}
                              onChange={(e) => setFullname(e.target.value)}
                              placeholder="Full Name"
                              required
                              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
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
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Email Address"
                              required
                              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
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
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="Mobile Number"
                              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
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
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Password"
                              required
                              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
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
                              value={password2}
                              onChange={(e) => setPassword2(e.target.value)}
                              placeholder="Confirm Password"
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
                          <div className="text-center mt-4">Or</div>
                          <div
                            id="googleSignUpDiv"
                            className="w-full flex justify-center mt-4"
                          ></div>
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
                      ) : (
                        <form onSubmit={handleOtpSubmit}>
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                              An OTP has been sent to <strong>{email}</strong>
                            </p>
                            {seconds > 0 && (
                              <p className="text-sm font-medium text-green-600 mb-2">
                                Time remaining: {seconds}s
                              </p>
                            )}
                            {seconds === 0 && (
                              <p className="text-sm font-medium text-red-600 mb-2">
                                OTP expired. You can request a new one.
                              </p>
                            )}
                            <label
                              htmlFor="otp"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Enter OTP
                            </label>
                            <input
                              type="text"
                              id="otp"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              placeholder="Enter 6-digit OTP"
                              required
                              maxLength={6}
                              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <button
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50 flex items-center justify-center"
                            type="submit"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <span className="mr-2">Verifying...</span>
                                <i className="fas fa-spinner fa-spin" />
                              </>
                            ) : (
                              "Verify OTP"
                            )}
                          </button>
                          <div className="mt-4 text-center">
                            <button
                              type="button"
                              onClick={handleResend}
                              disabled={isLoading || seconds > 0}
                              className="text-blue-600 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                              {isLoading
                                ? "Resending..."
                                : seconds > 0
                                  ? `Resend OTP in ${seconds}s`
                                  : "Resend OTP"}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowOtp(false);
                              setOtp("");
                            }}
                            className="w-full mt-3 text-blue-600 hover:underline"
                          >
                            Back to registration (edit details)
                          </button>
                        </form>
                      )}
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
