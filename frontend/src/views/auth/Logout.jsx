import { useEffect } from "react";
import { logout } from "../../utils/auth";
import { Link } from "react-router-dom";

export default function Logout() {
  useEffect(() => {
    logout();
  }, []);
  return (
    <>
      <section>
        <main className="mb-[400px] mt-[150px]">
          {/* mb-[400px] and mt-[150px] use arbitrary values in Tailwind, enabled by square brackets.
        it's less preferred unless you need a very specific spacing not covered by Tailwind’s scale. */}
          <div className="max-w-7xl mx-auto px-4">
            {/* max-w-7xl: Limits container width to 1280px for better readability on large screens.
            mx-auto: Horizontally centers the container using auto margins.
            px-4: Adds 16px padding on left and right to prevent content from touching screen edges. */}
            <section>
              <div className="flex justify-center">
                <div className="w-full max-w-xl md:max-w-md">
                  {/* w-full: Makes the div span the full width of its parent
                 max-w-xl: Sets a max width of 36rem (576px) on small screens.
             md:max-w-md: Overrides with a smaller max width (28rem or 448px) on medium screens and up. */}
                  <div className="bg-white rounded-2xl shadow-md">
                    <div className="p-6">
                      <h3 className="text-center text-xl font-semibold">
                        You have been logged out
                      </h3>
                      <div className="flex justify-center mt-6 space-x-4">
                        <Link
                          to="/login"
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200 flex items-center"
                        >
                          Login <i className="fas fa-sign-in-alt ml-2" />
                        </Link>
                        <Link
                          to="/register"
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200 flex items-center"
                        >
                          Register <i className="fas fa-user-plus ml-2" />
                        </Link>
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
