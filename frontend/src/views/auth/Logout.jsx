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
          <div className="max-w-7xl mx-auto px-4">
            <section>
              <div className="flex justify-center">
                <div className="w-full max-w-xl md:max-w-md">
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
