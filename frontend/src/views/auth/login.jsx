import { useState, useEffect } from "react";
import { login, googleLogin } from "../../utils/auth";
import { useNavigate, useSearchParams } from "react-router-dom"; // ← Added useSearchParams
import { useAuthStore } from "../../store/auth";
import { Link } from "react-router-dom";
import apiInstance from "../../utils/axios";
import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // ← To read ?ref=TOKEN
  const refToken = searchParams.get("ref"); // Get referral token from URL

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  // Load Google Sign-In script
  useEffect(() => {
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

  // Initialize Google button
  useEffect(() => {
    if (isGoogleScriptLoaded && window.google?.accounts) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInDiv"),
        { theme: "outline", size: "large" }
      );
    }
  }, [isGoogleScriptLoaded]);

  // Apply referral if token exists and user just signed in
  const applyReferralIfNeeded = async () => {
    if (!refToken) return;

    try {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      const newUserId = userData?.user_id;

      if (newUserId) {
        await apiInstance.post("referral/apply/", {
          token: refToken,
          new_user_id: newUserId,
        });
        Toast.fire({
          icon: "success",
          title: "Referral applied! Your friend got a coupon 🎉",
        });
      }
    } catch (error) {
      console.error("Failed to apply referral:", error);
      // Silent fail — don't interrupt login flow
    }
  };

  // Google Login Handler
  const handleGoogleResponse = async (response) => {
    setIsLoading(true);
    const { error, data } = await googleLogin(response.credential);

    if (error) {
      Toast.fire({ icon: "error", title: error });
      setIsLoading(false);
      return;
    }

    Toast.fire({ icon: "success", title: "Logged in with Google!" });

    // Apply referral only after successful login
    await applyReferralIfNeeded();

    navigate("/");
    setIsLoading(false);
  };

  // Regular Email/Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await login(email, password);

    if (error) {
      Toast.fire({ icon: "error", title: error });
      setIsLoading(false);
      return;
    }

    Toast.fire({ icon: "success", title: "Login Successful!" });

    // Apply referral if this was a new signup via referral link
    await applyReferralIfNeeded();

    navigate("/");
    setIsLoading(false);
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
  };

  return (
    <section>
      <main className="mb-24 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <section>
            <div className="flex justify-center">
              <div className="w-full max-w-xl md:max-w-md">
                <div className="bg-white rounded-xl shadow-md">
                  <div className="p-6">
                    <h3 className="text-center text-2xl font-semibold">
                      Login
                    </h3>
                    <div className="mt-6">
                      <form onSubmit={handleLogin}>
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
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
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
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
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
                            <>
                              <span className="mr-2">Sign In</span>
                              <i className="fas fa-sign-in-alt" />
                            </>
                          )}
                        </button>

                        <div className="text-center my-4 text-gray-500">Or</div>

                        <div
                          id="googleSignInDiv"
                          className="w-full flex justify-center"
                        ></div>

                        <div className="text-center mt-6 space-y-2">
                          <p>
                            Don't have an account?{" "}
                            <Link
                              to="/register"
                              className="text-blue-600 hover:underline"
                            >
                              Register
                            </Link>
                          </p>
                          <p>
                            <Link
                              to="/forgot-password"
                              className="text-red-600 hover:underline"
                            >
                              Forgot Password?
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
    </section>
  );
}
