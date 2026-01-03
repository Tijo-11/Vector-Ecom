import Sidebar from "./Sidebar";
import UseProfileData from "../../plugin/UserProfileData";
import { useState, useEffect } from "react";
import apiInstance from "../../utils/axios";
import Swal from "sweetalert2";

export default function Account() {
  const userProfile = UseProfileData();
  const [referralLink, setReferralLink] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [coupons, setCoupons] = useState([]);

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

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await apiInstance.get("referral/my-coupons/");
        setCoupons(response.data);
      } catch (error) {
        console.error("Error fetching coupons:", error);
        Toast.fire({ icon: "error", title: "Failed to load coupons" });
      }
    };
    fetchCoupons();
  }, []);

  return (
    <div>
      <main className="mt-5 mb-[170px]">
        <div className="max-w-7xl mx-auto px-4">
          <section>
            <div className="flex flex-col lg:flex-row gap-4">
              <Sidebar />
              <div className="w-full lg:w-3/4 mt-1">
                <main className="mb-5">
                  <div className="px-4">
                    {/* Main Account Info Section */}
                    <section>
                      <div className="rounded shadow p-4 bg-white">
                        <h2 className="text-xl font-semibold mb-2">
                          Hi {userProfile?.full_name},
                        </h2>
                        <div className="mb-4">
                          From your account dashboard, you can easily check &
                          view your{" "}
                          <a href="/orders" className="text-blue-600 underline">
                            orders
                          </a>
                          , manage your{" "}
                          <a
                            href="/address"
                            className="text-blue-600 underline"
                          >
                            shipping address
                          </a>
                          ,{" "}
                          <a
                            href="/settings"
                            className="text-blue-600 underline"
                          >
                            change password
                          </a>{" "}
                          and{" "}
                          <a
                            href="/profile"
                            className="text-blue-600 underline"
                          >
                            edit account
                          </a>{" "}
                          information.
                        </div>
                      </div>
                    </section>

                    {/* Referral Program Section */}
                    <section className="mt-6">
                      <div className="rounded shadow p-4 bg-white">
                        <h2 className="text-xl font-semibold mb-4">
                          Referral Program
                        </h2>
                        <p className="mb-4 text-gray-700">
                          Share your referral link with friends and earn coupons
                          when they sign up!
                        </p>
                        <button
                          onClick={generateReferral}
                          disabled={isGenerating}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition"
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
                              className="flex-1 px-4 py-2 border rounded-l bg-gray-50"
                            />
                            <button
                              onClick={copyLink}
                              className="bg-green-600 text-white px-4 py-2 rounded-r hover:bg-green-700 transition"
                            >
                              Copy
                            </button>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* My Referral Coupons Section */}
                    <section className="mt-6">
                      <div className="rounded shadow p-4 bg-white">
                        <h2 className="text-xl font-semibold mb-4">
                          My Referral Coupons
                        </h2>
                        {coupons.length > 0 ? (
                          <ul className="space-y-3">
                            {coupons.map((coupon) => (
                              <li
                                key={coupon.id}
                                className={`p-4 border rounded-lg transition ${
                                  coupon.is_used_by_me
                                    ? "bg-gray-100 border-gray-300"
                                    : "bg-green-50 border-green-300"
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <strong className="text-gray-700">
                                        Code:
                                      </strong>
                                      <span className="font-mono text-lg font-bold text-gray-900">
                                        {coupon.code}
                                      </span>
                                      {coupon.is_used_by_me ? (
                                        <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded-full font-semibold">
                                          USED
                                        </span>
                                      ) : (
                                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-semibold">
                                          AVAILABLE
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-700 mb-1">
                                      <strong>Discount:</strong>{" "}
                                      {coupon.discount}% off
                                    </div>
                                    {coupon.is_used_by_me ? (
                                      <div className="text-sm text-gray-600 flex items-center gap-1">
                                        <svg
                                          className="w-4 h-4 text-gray-500"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        You have already used this coupon
                                      </div>
                                    ) : (
                                      <div className="text-sm text-green-700 flex items-center gap-1">
                                        <svg
                                          className="w-4 h-4 text-green-600"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3 3a1 1 0 01-1.414 0l-1.5-1.5a1 1 0 011.414-1.414L9 10.586l2.293-2.293a1 1 0 011.414 1.414z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        Ready to use on your next order
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        coupon.code
                                      );
                                      Toast.fire({
                                        icon: "success",
                                        title: "Coupon code copied!",
                                      });
                                    }}
                                    disabled={coupon.is_used_by_me}
                                    className={`px-4 py-2 rounded font-semibold transition ${
                                      coupon.is_used_by_me
                                        ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                                        : "bg-blue-500 text-white hover:bg-blue-600"
                                    }`}
                                  >
                                    {coupon.is_used_by_me
                                      ? "Used"
                                      : "Copy Code"}
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-center py-8">
                            <svg
                              className="w-16 h-16 mx-auto text-gray-400 mb-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                              />
                            </svg>
                            <p className="text-gray-600 text-lg font-medium mb-2">
                              No referral coupons yet
                            </p>
                            <p className="text-gray-500 text-sm">
                              Start referring friends to earn exclusive discount
                              coupons!
                            </p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </main>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
