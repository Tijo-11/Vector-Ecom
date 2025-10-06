import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../../utils/axios";
import Swal from "sweetalert2";
import log from "../../utils/logger";

export default function CreateNewPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const otp = searchParams.get("otp");
  const uidb64 = searchParams.get("uidb64");

  useEffect(() => {
    log.debug("Received otp:", otp);
    log.debug("Received uidb64:", uidb64);
  }, [otp, uidb64]);

  const handleNewPasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleNewPasswordConfirmChange = (e) => {
    const confirmVal = e.target.value;
    setConfirmPassword(confirmVal);
    setError(password !== confirmVal);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError(true);
      alert("Passwords do not match");
    } else {
      setError(false);
      log.debug("Submitting password change", { otp, uidb64, password });

      try {
        axios
          .post(`user/password-change/`, {
            otp,
            uidb64,
            password,
          })
          .then((res) => {
            Swal.fire({
              icon: "success",
              title: "Password changed successfully",
            });
            navigate("/login");
          })
          .catch((err) => {
            log.error("Password change failed", err);
            Swal.fire({
              icon: "error",
              title: "An Error Occurred. Try Again",
            });
          });
      } catch (error) {
        log.error("Unexpected error during password change", error);
        Swal.fire({
          icon: "error",
          title: "An Error Occurred. Try Again",
        });
      }
    }
  };

  return (
    <section>
      <main className="mb-24 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <section>
            <div className="flex justify-center">
              <div className="w-full max-w-xl md:max-w-md">
                <div className="bg-white rounded-2xl shadow-md">
                  <div className="p-6">
                    <h3 className="text-center text-2xl font-semibold">
                      Create New Password
                    </h3>
                    <div className="mt-6">
                      <form onSubmit={handlePasswordSubmit}>
                        <div className="mb-4">
                          <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Enter New Password
                          </label>
                          <input
                            type="password"
                            id="password"
                            required
                            name="password"
                            onChange={handleNewPasswordChange}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="mb-4">
                          <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            id="confirmPassword"
                            required
                            name="confirmPassword"
                            onChange={handleNewPasswordConfirmChange}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                          {error !== null && (
                            <>
                              {error === true ? (
                                <p className="text-red-600 font-bold mt-2">
                                  Password Does Not Match
                                </p>
                              ) : (
                                <p className="text-green-600 font-bold mt-2">
                                  Password Matched
                                </p>
                              )}
                            </>
                          )}
                        </div>
                        <div className="text-center">
                          <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
                          >
                            Reset Password
                          </button>
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
