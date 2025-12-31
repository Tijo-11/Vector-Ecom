// frontend/Account.jsx (Modified to add referral section)
import Sidebar from "./Sidebar";
import UseProfileData from "../../plugin/UserProfileData";
import NotFound from "../../layouts/NotFound";
import { useState } from "react";
import apiInstance from "../../utils/axios";
import Swal from "sweetalert2";
export default function Account() {
  const userProfile = UseProfileData();
  const [referralLink, setReferralLink] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const Toast = Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
  const generateReferral = async () => {
    setIsGenerating(true);
    try {
      const response = await apiInstance.post("referral/generate/");
      setReferralLink(response.data.referral_link);
      Toast.fire({ icon: "success", title: "Referral link generated!" });
    } catch (error) {
      Toast.fire({ icon: "error", title: "Failed to generate link" });
    }
    setIsGenerating(false);
  };
  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    Toast.fire({ icon: "success", title: "Link copied to clipboard!" });
  };
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
                    {/* Referral Section */}
                    <section className="mt-6">
                      <div className="rounded shadow p-4 bg-white">
                        <h2 className="text-xl font-semibold mb-4">
                          Referral Program
                        </h2>
                        <p className="mb-4">
                          Share your referral link with friends and earn coupons
                          when they sign up!
                        </p>
                        <button
                          onClick={generateReferral}
                          disabled={isGenerating}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isGenerating
                            ? "Generating..."
                            : "Generate Referral Link"}
                        </button>
                        {referralLink && (
                          <div className="mt-4 flex items-center">
                            <input
                              type="text"
                              value={referralLink}
                              readOnly
                              className="flex-1 px-4 py-2 border rounded-l"
                            />
                            <button
                              onClick={copyLink}
                              className="bg-green-600 text-white px-4 py-2 rounded-r hover:bg-green-700"
                            >
                              Copy
                            </button>
                          </div>
                        )}
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
