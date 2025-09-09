import Sidebar from "./Sidebar";
import UseProfileData from "../../plugin/UserProfileData";
import NotFound from "../../layouts/NotFound";

export default function Account() {
  const userProfile = UseProfileData();
  return (
    <div>
      {/* {userProfile === undefined ? ( */}
      <main className="mt-5 mb-[170px]">
        <div className="max-w-7xl mx-auto px-4">
          <section>
            <div className="flex flex-col lg:flex-row gap-4">
              <Sidebar />
              <div className="w-full lg:w-3/4 mt-1">
                <main className="mb-5">
                  {/* Container for demo purpose */}
                  <div className="px-4">
                    {/* Section: Summary */}
                    <section></section>

                    {/* Section: MSC */}
                    <section>
                      <div className="rounded shadow p-4 bg-white">
                        <h2 className="text-xl font-semibold mb-2">
                          Hi {userProfile?.full_name},
                        </h2>
                        <div className="mb-4">
                          From your account dashboard, you can easily check &
                          view your{" "}
                          <a href="" className="text-blue-600 underline">
                            orders
                          </a>
                          , manage your{" "}
                          <a href="" className="text-blue-600 underline">
                            shipping address
                          </a>
                          ,{" "}
                          <a href="" className="text-blue-600 underline">
                            change password
                          </a>{" "}
                          and{" "}
                          <a href="" className="text-blue-600 underline">
                            edit account
                          </a>{" "}
                          information.
                        </div>
                      </div>
                    </section>
                  </div>
                  {/* Container for demo purpose */}
                </main>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
