import { useState, useEffect } from "react";
import { login, googleLogin } from "../../utils/auth";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import { Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(""); // Changed from username to email
  const [password, setPassword] = useState("");
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);

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
  }, []);

  useEffect(() => {
    if (isGoogleScriptLoaded && window.google && window.google.accounts) {
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
    setEmail("");
    setPassword("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await login(email, password);
    if (error) {
      alert(error);
    } else {
      navigate("/");
      resetForm();
    }
    setIsLoading(false);
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
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                        <div className="text-center mt-4">Or</div>
                        <div
                          id="googleSignInDiv"
                          className="w-full flex justify-center mt-4"
                        ></div>
                        <div className="text-center mt-6">
                          <p>
                            Don't have an account?{" "}
                            <Link
                              to="/register"
                              className="text-blue-600 hover:underline"
                            >
                              Register
                            </Link>
                          </p>
                          <p className="mt-2">
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
