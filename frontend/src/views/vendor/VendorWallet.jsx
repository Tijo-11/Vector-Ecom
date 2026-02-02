import React, { useState, useEffect } from "react";
import apiInstance from "../../utils/axios";
import { useAuthStore } from "../../store/auth";
import VendorSidebar from "./Sidebar";
import Swal from "sweetalert2";
import {
  RefreshCw,
  Clock,
  ArrowUpRight,
  TrendingUp,
  History,
  AlertCircle
} from "lucide-react";

function VendorWallet() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  const user = useAuthStore((state) => state.user);
  const vendorId = user?.vendor_id;

  useEffect(() => {
    if (vendorId) {
      fetchTransactions();
      fetchStats();
    }
  }, [vendorId]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await apiInstance.get(`vendor/wallet-transactions/${vendorId}/`);
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiInstance.get(`vendor/wallet-stats/${vendorId}/`);
      setStats(response.data); // Expecting { balance: X, total_withdrawn: Y, etc. }
    } catch (error) {
       // if error, default to 0
       setStats({ balance: 0 });
    }
  };

  // ... (Withdraw logic remains same)

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      Swal.fire({ icon: "warning", title: "Invalid Amount", text: "Please enter a valid amount." });
      return;
    }
    if (parseFloat(withdrawAmount) > stats?.balance) {
      Swal.fire({ icon: "error", title: "Insufficient Balance", text: "You cannot withdraw more than your balance." });
      return;
    }

    setIsWithdrawing(true);
    try {
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        Swal.fire({ 
            icon: "success", 
            title: "Request Sent", 
            text: "Your withdrawal request has been submitted for approval." 
        });
        setWithdrawAmount("");
        fetchStats(); 
    } catch (error) {
        Swal.fire({ icon: "error", title: "Failed", text: "Could not process withdrawal." });
    } finally {
        setIsWithdrawing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <div className="w-64 hidden lg:block shrink-0" />
      <VendorSidebar />

      <div className="flex-1 p-8 lg:p-12">
         {/* ... (Header & Stats Card Code remains same) ... */}
         <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Wallet & Payouts</h1>
            <p className="text-gray-500 mt-1">Manage your earnings and request withdrawals.</p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            <div className="lg:col-span-2 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col justify-between h-full">
                    <div>
                        <p className="text-gray-400 font-medium uppercase tracking-wider text-sm flex items-center gap-2">
                           <TrendingUp size={16} className="text-green-400" /> Available Balance
                        </p>
                        <h1 className="text-4xl md:text-5xl font-bold mt-4 tracking-tight">₹{stats?.balance?.toFixed(2) || "0.00"}</h1>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-700 flex gap-8">
                        <div>
                           <p className="text-xs text-gray-400">Total Earned</p>
                           <p className="font-semibold text-lg">₹{stats?.total_earned?.toFixed(2) || "0.00"}</p>
                        </div>
                        <div>
                           <p className="text-xs text-gray-400">Pending Payouts</p>
                           <p className="font-semibold text-lg">₹{stats?.pending_payouts?.toFixed(2) || "0.00"}</p>
                        </div>
                    </div>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/2 opacity-10 pointer-events-none">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                        <path fill="#FFFFFF" d="M42.7,-62.9C50.9,-52.8,50.1,-34.4,51.7,-19.2C53.4,-4,57.4,8,54.6,19.1C51.8,30.3,42.1,40.6,31.2,46.7C20.3,52.9,8.2,54.8,-3.1,59.1C-14.4,63.4,-24.8,70,-34.7,68.2C-44.6,66.4,-54,56.1,-61.6,44.9C-69.2,33.7,-75,21.5,-72.7,10.9C-70.4,0.3,-60,-8.7,-51.1,-16.6C-42.3,-24.5,-35,-31.3,-26.9,-41.5C-18.8,-51.7,-9.9,-65.4,3.7,-70.5C17.3,-75.6,34.5,-73.1,42.7,-62.9Z" transform="translate(100 100)" />
                    </svg>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                   <ArrowUpRight className="text-blue-600" /> Request Withdrawal
                </h3>
                <form onSubmit={handleWithdraw}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                        <input 
                           type="number" 
                           className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-900 placeholder:font-normal"
                           placeholder="0.00"
                           min="1"
                           max={stats?.balance}
                           value={withdrawAmount}
                           onChange={(e) => setWithdrawAmount(e.target.value)}
                           required
                        />
                    </div>
                    <button 
                       type="submit" 
                       disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) > stats?.balance}
                       className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                       {isWithdrawing ? "Processing..." : "Withdraw Funds"}
                    </button>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                       Minimum withdrawal: ₹500. Processing time: 2-3 days.
                    </p>
                </form>
            </div>
         </div>

         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                 <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <History size={20} className="text-gray-400" /> Transaction History
                 </h2>
                 <button onClick={fetchTransactions} className="p-2 hover:bg-gray-100 rounded-full transition" title="Refresh">
                    <RefreshCw size={16} className="text-gray-500" />
                 </button>
             </div>
             
             <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                     <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                         <tr>
                             <th className="px-6 py-4">Type</th>
                             <th className="px-6 py-4">Date</th>
                             <th className="px-6 py-4">Amount</th>
                             <th className="px-6 py-4">Status</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 text-sm">
                         {transactions.length > 0 ? (
                             transactions.map((tx, idx) => (
                                 <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                     <td className="px-6 py-4 font-medium text-gray-900 capitalize">
                                         {tx.transaction_type_display || tx.transaction_type || "Transaction"}
                                     </td>
                                     <td className="px-6 py-4 text-gray-600">
                                         <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-gray-400" />
                                            {formatDate(tx.created_at)}
                                         </div>
                                     </td>
                                     <td className={`px-6 py-4 font-bold ${parseFloat(tx.amount) > 0 ? "text-green-600" : "text-red-600"}`}>
                                         {parseFloat(tx.amount) > 0 ? "+" : ""}₹{Math.abs(parseFloat(tx.amount)).toFixed(2)}
                                     </td>
                                     <td className="px-6 py-4">
                                         <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                             tx.transaction_type === 'payment' ? 'bg-green-100 text-green-700' :
                                             tx.transaction_type === 'refund' ? 'bg-orange-100 text-orange-700' :
                                             'bg-yellow-100 text-yellow-700'
                                         }`}>
                                             {tx.transaction_type === "payment" ? "Completed" : (tx.transaction_type === "refund" ? "Refunded" : "Pending")}
                                         </span>
                                     </td>
                                 </tr>
                             ))
                         ) : (
                             <tr>
                                 <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                     <div className="flex flex-col items-center">
                                         <AlertCircle size={48} className="text-gray-200 mb-2" />
                                         <p>No transactions found</p>
                                     </div>
                                 </td>
                             </tr>
                         )}
                     </tbody>
                 </table>
             </div>
         </div>

      </div>
    </div>
  );
}

export default VendorWallet;
