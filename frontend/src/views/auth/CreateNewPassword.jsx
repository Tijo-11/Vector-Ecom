import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../../utils/axios";
import Swal from "sweetalert2";

export default function CreateNewPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  //useSearchParams() returns a tuple: [searchParams, setSearchParams]
  //You're using array destructuring to extract just the first item (searchParams)
  //This avoids cluttering your code with unused variables if you don’t need to update the URL
  //How destructuring works, const [a, b] = [1, 2]; // a = 1, b = 2
  //const [searchParams] = useSearchParams(); // ignore the second item
  const otp = searchParams.get("otp");
  // Extracts the 'otp' query parameter from the current URL, e.g. ?otp=123456
  const uidb64 = searchParams.get("uidb64");

  // Debug query parameters
  useEffect(() => {
    console.log("Received otp:", otp);
    console.log("Received uidb64:", uidb64);
  }, [otp, uidb64]);

  const handleNewPasswordChange = (e) => {
    // No need for preventDefault—this is just an input change, not a form submission
    //e.preventDefault() is only useful when you're trying to stop the browser’s default behavior—like
    // submitting a form or following a link.
    //For a regular <input> field’s onChange, there’s no default behavior to prevent.
    //Also, note that e.preventDefault without () does nothing—it’s just referencing the function, not calling it.
    setPassword(e.target.value);
  };
  const handleNewPasswordConfirmChange = (e) => {
    const confirmVal = e.target.value;
    setConfirmPassword(e.target.value);
    // Check live if passwords match
    if (password !== confirmVal) {
      setError(true);
    } else {
      setError(false);
    }
  };
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(true);
      alert("Passwords do not match");
    } else {
      setError(false);
      console.log("otp ======", otp);
      console.log("uidb64 ======", uidb64);
      console.log("password ======", password);

      try {
        axios
          .post(`user/password-change/`, {
            otp: otp,
            uidb64: uidb64,
            password: password,
          })
          .then((res) => {
            Swal.fire({
              icon: "success",
              title: "Password changed successfully",
            });
            navigate("/login");
          })
          .catch((err) => {
            Swal.fire({
              icon: "error",
              title: "An Error Occurred. Try Again",
            });
          });
      } catch (error) {
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
          {/* Section: Create New Password */}
          <section>
            <div className="flex justify-center">
              <div className="w-full max-w-xl md:max-w-md">
                {/* full width by default, max width is 'xl' on small screens, 'md' on medium screens
This ensures the layout adapts nicely across devices—wide on mobile, narrower on tablets/desktops.
md -768px, xl-1280px
📱 On small screens, max width is xl (1280px)
💻 On medium screens and up, max width becomes md (768px)
This might seem backward, but it's often used to shrink the container on larger screens for better readability. */}
                <div className="bg-white rounded-2xl shadow-md">
                  <div className="p-6">
                    <h3 className="text-center text-2xl font-semibold">
                      Create New Password
                    </h3>
                    <div className="mt-6">
                      <form onSubmit={handlePasswordSubmit}>
                        {/* New Password */}
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
                        {/* Confirm New Password */}
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
                        {/* Submit button */}
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
