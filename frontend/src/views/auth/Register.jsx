import { useEffect, useState } from "react";
import { register, verifyOtp, login, googleLogin } from "../../utils/auth";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import Swal from "sweetalert2";

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
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/");
    }
    const Toast = Swal.mixin({
      toast: true,
      position: "top",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
    });

    const loadGoogleScript = () => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => setIsGoogleScriptLoaded(true);
      document.body.appendChild(script);
    };
    loadGoogleScript();
  }, []);

  useEffect(() => {
    if (isGoogleScriptLoaded && window.google && window.google.accounts) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("googleSignUpDiv"),
        { theme: "outline", size: "large" }
      );
    }
  }, [isGoogleScriptLoaded]);

  const handleGoogleResponse = async (response) => {
    setIsLoading(true);
    const { error } = await googleLogin(response.credential);
    if (error) {
      alert(error);
    } else {
      navigate("/");
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setFullname("");
    setEmail("");
    setPhone("");
    setPassword("");
    setPassword2("");
    setShowOtp(false);
    setOtp("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== password2) {
      alert("Passwords do not match");
      return;
    }
    setIsLoading(true);
    const { data, error } = await register(
      fullname,
      email,
      phone,
      password,
      password2
    );
    if (error) {
      alert(error);
    } else if (data.message) {
      // Handle both new and resend
      Toast.fire({ icon: "info", title: data.message });
      setUidb64(data.uidb64);
      setShowOtp(true);
    }
    setIsLoading(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await verifyOtp(otp, uidb64);
    if (error) {
      alert(error);
    } else {
      // Auto-login after verification
      await login(email, password);
      navigate("/");
      resetForm();
    }
    setIsLoading(false);
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
                              onChange={(e) => setPassword2(e.target.value)}
                              placeholder="Confirm Password"
                              required
                              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <p className="font-bold text-red-600">
                            {password2 !== password
                              ? "Passwords do not match"
                              : ""}
                          </p>
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
                            <label
                              htmlFor="otp"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Enter OTP (sent to email)
                            </label>
                            <input
                              type="text"
                              id="otp"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              placeholder="OTP"
                              required
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
