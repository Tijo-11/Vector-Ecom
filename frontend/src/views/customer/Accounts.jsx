import Sidebar from "./Sidebar";
import UseProfileData from "../../plugin/UserProfileData";
import { useState, useEffect } from "react";
import apiInstance from "../../utils/axios";
import Swal from "sweetalert2";
import { Copy, Gift, Ticket, ArrowRight, Loader2, Sparkles, ShoppingBag, MapPin, Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function Account() {
  const userProfile = UseProfileData();
  const [referralLink, setReferralLink] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [coupons, setCoupons] = useState([]);

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
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
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    Toast.fire({ icon: "success", title: "Copied to clipboard!" });
  };

  const copyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    Toast.fire({ icon: "success", title: "Code copied!" });
  };

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await apiInstance.get("referral/my-coupons/");
        setCoupons(response.data);
      } catch (error) {
        console.error("Error fetching coupons:", error);
      }
    };
    fetchCoupons();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen py-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <Sidebar />
          
          <div className="flex-1">
             {/* Welcome Hero */}
             <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-lg mb-8 relative overflow-hidden">
                <div className="relative z-10">
                   <h1 className="text-3xl font-bold mb-2">Welcome back, {userProfile?.full_name?.split(' ')[0]}!</h1>
                   <p className="text-blue-100 max-w-xl">
                      Manage your profile, check orders, and earn rewards all in one place.
                   </p>
                </div>
                <div className="absolute right-0 top-0 opacity-10">
                   <Sparkles size={200} />
                </div>
             </div>

             {/* Quick Actions Grid */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Link to="/customer/orders/" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <ShoppingBag size={24} />
                   </div>
                   <h3 className="font-bold text-gray-900">Your Orders</h3>
                   <p className="text-sm text-gray-500 mt-1">Track, return, or buy again</p>
                </Link>

                <Link to="/customer/addresses/" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                   <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                      <MapPin size={24} />
                   </div>
                   <h3 className="font-bold text-gray-900">Addresses</h3>
                   <p className="text-sm text-gray-500 mt-1">Manage shipping locations</p>
                </Link>

                <Link to="/customer/settings/" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                   <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gray-800 group-hover:text-white transition-colors">
                      <SettingsIcon size={24} />
                   </div>
                   <h3 className="font-bold text-gray-900">Account Settings</h3>
                   <p className="text-sm text-gray-500 mt-1">Password, email, login</p>
                </Link>
             </div>

             {/* Referral Section */}
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* Generate Link */}
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                         <Gift size={24} />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Refer & Earn</h2>
                   </div>
                   
                   <p className="text-gray-600 mb-6 font-medium">
                      Invite friends and earn exclusive discount coupons when they sign up!
                   </p>

                   <div className="space-y-4">
                      {referralLink ? (
                         <div className="flex bg-gray-50 border border-gray-200 rounded-xl p-2 pl-4 items-center">
                            <span className="flex-1 truncate text-gray-600 font-mono text-sm">{referralLink}</span>
                            <button 
                               onClick={copyLink}
                               className="bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-lg transition-colors"
                            >
                               <Copy size={18} />
                            </button>
                         </div>
                      ) : (
                         <button 
                            onClick={generateReferral} 
                            disabled={isGenerating}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-bold shadow-md shadow-purple-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                         >
                            {isGenerating ? <Loader2 className="animate-spin" /> : "Generate Unique Link"}
                         </button>
                      )}
                      
                      <div className="bg-purple-50 rounded-lg p-4 text-xs text-purple-800">
                         * Coupons are valid for 30 days from issuance. Terms apply.
                      </div>
                   </div>
                </div>

                {/* Coupons List */}
                <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                         <div className="bg-green-100 p-2 rounded-lg text-green-600">
                            <Ticket size={24} />
                         </div>
                         <h2 className="text-xl font-bold text-gray-900">My Coupons</h2>
                      </div>
                      <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-full text-gray-600">{coupons.length} Available</span>
                   </div>

                   {coupons.length > 0 ? (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                         {coupons.map((coupon) => (
                            <div key={coupon.id} className={`p-4 rounded-xl border-2 transition-all group ${
                               coupon.is_used_by_me 
                               ? "bg-gray-50 border-gray-200 opacity-60" 
                               : "bg-white border-green-100 hover:border-green-300 shadow-sm"
                            }`}>
                               <div className="flex justify-between items-start">
                                  <div>
                                     <div className="flex items-center gap-2">
                                        <span className="font-mono text-lg font-bold text-gray-800 tracking-wider">
                                           {coupon.code}
                                        </span>
                                     </div>
                                     <div className="text-green-600 font-bold text-sm mt-1">
                                        {coupon.discount}% Discount
                                     </div>
                                  </div>
                                  
                                  {coupon.is_used_by_me ? (
                                     <span className="px-3 py-1 bg-gray-200 text-gray-500 rounded-lg text-xs font-bold uppercase">Used</span>
                                  ) : (
                                     <button 
                                        onClick={() => copyCoupon(coupon.code)}
                                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition"
                                        title="Copy Code"
                                     >
                                        <Copy size={18} />
                                     </button>
                                  )}
                               </div>
                               {!coupon.is_used_by_me && (
                                   <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                                      <Sparkles size={12} className="text-green-500" /> Ready to use
                                   </div>
                               )}
                            </div>
                         ))}
                      </div>
                   ) : (
                      <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl">
                         <Ticket size={48} className="mx-auto text-gray-200 mb-2" />
                         <p className="text-gray-500 font-medium">No coupons yet</p>
                         <p className="text-xs text-gray-400 mt-1">Start referring to earn rewards!</p>
                      </div>
                   )}
                </div>

             </div>

          </div>
        </div>
      </div>
      
      <style>{`
         .custom-scrollbar::-webkit-scrollbar { width: 4px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>
    </div>
  );
}
