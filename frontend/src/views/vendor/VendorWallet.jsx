import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  AlertCircle,
  X,
  User,
  Hash,
  Calendar,
  Tag,
  ShoppingBag,
  ExternalLink,
  ArrowDownLeft,
  ArrowUpRight as ArrowUpRightIcon
} from "lucide-react";

function VendorWallet() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
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
      setStats(response.data);
    } catch (error) {
       setStats({ balance: 0 });
    }
  };



  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getTransactionIcon = (type) => {
    if (type === 'payment') return <ArrowDownLeft className="text-green-600" size={20} />;
    if (type === 'refund') return <ArrowUpRightIcon className="text-orange-600" size={20} />;
    return <Clock className="text-yellow-600" size={20} />;
  };

  const getTransactionSource = (tx) => {
    if (tx.transaction_type === 'payment') {
      return `Order #${tx.related_order?.oid || 'N/A'}`;
    }
    if (tx.transaction_type === 'refund') {
      return `Refund for Order #${tx.related_order?.oid || 'N/A'}`;
    }
    if (tx.transaction_type === 'pending') {
      return `Pending Order #${tx.related_order?.oid || 'N/A'}`;
    }
    return 'Transaction';
  };

  // Transaction Detail Modal Component
  const TransactionDetailModal = ({ transaction, onClose }) => {
    if (!transaction) return null;

    const isRefundOrCancel = transaction.transaction_type === 'refund' || 
                             transaction.related_order?.order_status === 'Cancelled' ||
                             transaction.related_order?.order_status === 'Returned';

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                transaction.transaction_type === 'payment' ? 'bg-green-100' :
                transaction.transaction_type === 'refund' ? 'bg-orange-100' :
                'bg-yellow-100'
              }`}>
                {getTransactionIcon(transaction.transaction_type)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Transaction Details</h3>
                <p className="text-sm text-gray-500">{transaction.transaction_type_display}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          
          {/* Modal Body */}
          <div className="p-6 space-y-5">
            {/* Amount */}
            <div className="text-center py-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Amount</p>
              <p className={`text-3xl font-bold ${
                parseFloat(transaction.amount) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {parseFloat(transaction.amount) > 0 ? '+' : ''}₹{Math.abs(parseFloat(transaction.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* User Details */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3 text-gray-700">
                <User size={18} />
                <span className="font-semibold">User Details</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name</span>
                  <span className="font-medium text-gray-900">{transaction.user?.full_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-900">{transaction.user?.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Transaction Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                <Hash size={18} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase">Transaction ID</p>
                  <p className="font-mono text-sm font-medium text-gray-900">{transaction.transaction_id || transaction.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                <Calendar size={18} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase">Transaction Date</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(transaction.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                <Tag size={18} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase">Transaction Type</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{transaction.transaction_type_display || transaction.transaction_type}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                <ShoppingBag size={18} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase">Source</p>
                  <p className="text-sm font-medium text-gray-900">{getTransactionSource(transaction)}</p>
                </div>
              </div>
            </div>

            {/* Order Details */}
            {transaction.related_order && (
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3 text-blue-700">
                  <ShoppingBag size={18} />
                  <span className="font-semibold">Order Details</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-600">Order ID</span>
                    <span className="font-medium text-blue-900">{transaction.related_order.oid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Order Total</span>
                    <span className="font-medium text-blue-900">₹{parseFloat(transaction.related_order.total).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Payment Status</span>
                    <span className="font-medium text-blue-900 capitalize">{transaction.related_order.payment_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Order Status</span>
                    <span className="font-medium text-blue-900 capitalize">{transaction.related_order.order_status}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {transaction.description && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase mb-1">Description</p>
                <p className="text-sm text-gray-700">{transaction.description}</p>
              </div>
            )}
          </div>
          
          {/* Modal Footer */}
          <div className="p-6 border-t border-gray-100 space-y-3">
            {/* Show View Order button for refunds/cancellations */}
            {isRefundOrCancel && transaction.related_order?.oid && (
              <Link 
                to={`/vendor/orders/${transaction.related_order.oid}/`}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <ExternalLink size={18} />
                View Order Details
              </Link>
            )}
            <button 
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <VendorSidebar />

      <div className="flex-1 p-8 lg:p-12">
         <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Wallet & Payouts</h1>
            <p className="text-gray-500 mt-1">Manage your earnings and request withdrawals.</p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            <div className="lg:col-span-3 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col justify-between h-full">
                    <div>
                        <p className="text-gray-400 font-medium uppercase tracking-wider text-sm flex items-center gap-2">
                           <TrendingUp size={16} className="text-green-400" /> Available Balance
                        </p>
                        <h1 className="text-4xl md:text-5xl font-bold mt-4 tracking-tight">₹{stats?.balance?.toFixed(2) || "0.00"}</h1>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-700 flex flex-wrap gap-6">
                        <div>
                           <p className="text-xs text-gray-400">Total Earned</p>
                           <p className="font-semibold text-lg">₹{stats?.total_earned?.toFixed(2) || "0.00"}</p>
                        </div>
                        <div>
                           <p className="text-xs text-gray-400">Pending Payouts</p>
                           <p className="font-semibold text-lg">₹{stats?.pending_payouts?.toFixed(2) || "0.00"}</p>
                        </div>
                        <div>
                           <p className="text-xs text-gray-400">Total Refunded</p>
                           <p className="font-semibold text-lg text-orange-400">₹{stats?.total_refunded?.toFixed(2) || "0.00"}</p>
                        </div>
                    </div>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/2 opacity-10 pointer-events-none">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                        <path fill="#FFFFFF" d="M42.7,-62.9C50.9,-52.8,50.1,-34.4,51.7,-19.2C53.4,-4,57.4,8,54.6,19.1C51.8,30.3,42.1,40.6,31.2,46.7C20.3,52.9,8.2,54.8,-3.1,59.1C-14.4,63.4,-24.8,70,-34.7,68.2C-44.6,66.4,-54,56.1,-61.6,44.9C-69.2,33.7,-75,21.5,-72.7,10.9C-70.4,0.3,-60,-8.7,-51.1,-16.6C-42.3,-24.5,-35,-31.3,-26.9,-41.5C-18.8,-51.7,-9.9,-65.4,3.7,-70.5C17.3,-75.6,34.5,-73.1,42.7,-62.9Z" transform="translate(100 100)" />
                    </svg>
                </div>
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
             
             {loading ? (
               <div className="p-12 text-center">
                 <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
                 <p className="text-gray-500">Loading transactions...</p>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                     <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                         <tr>
                             <th className="px-6 py-4">Transaction</th>
                             <th className="px-6 py-4">User</th>
                             <th className="px-6 py-4">Date</th>
                             <th className="px-6 py-4">Amount</th>
                             <th className="px-6 py-4">Status</th>
                             <th className="px-6 py-4 text-center">Action</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 text-sm">
                         {transactions.length > 0 ? (
                             transactions.map((tx, idx) => (
                                 <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                     <td className="px-6 py-4">
                                         <div className="flex items-center gap-3">
                                           <div className={`p-2 rounded-lg ${
                                             tx.transaction_type === 'payment' ? 'bg-green-100' :
                                             tx.transaction_type === 'refund' ? 'bg-orange-100' :
                                             'bg-yellow-100'
                                           }`}>
                                             {getTransactionIcon(tx.transaction_type)}
                                           </div>
                                           <div>
                                             <p className="font-medium text-gray-900">
                                               {tx.transaction_type_display || tx.transaction_type || "Transaction"}
                                             </p>
                                             <p className="text-xs text-gray-500 font-mono">{tx.transaction_id || tx.id}</p>
                                           </div>
                                         </div>
                                     </td>
                                     <td className="px-6 py-4">
                                         <div>
                                           <p className="font-medium text-gray-900">{tx.user?.full_name || 'N/A'}</p>
                                           <p className="text-xs text-gray-500">{tx.user?.email || ''}</p>
                                         </div>
                                     </td>
                                     <td className="px-6 py-4 text-gray-600">
                                         <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-gray-400" />
                                            {formatDate(tx.created_at)}
                                         </div>
                                     </td>
                                     <td className={`px-6 py-4 font-bold ${parseFloat(tx.amount) > 0 ? "text-green-600" : "text-red-600"}`}>
                                         {parseFloat(tx.amount) > 0 ? "+" : ""}₹{Math.abs(parseFloat(tx.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                                     <td className="px-6 py-4 text-center">
                                         <button 
                                           onClick={() => setSelectedTransaction(tx)}
                                           className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                                         >
                                           View Details
                                         </button>
                                     </td>
                                 </tr>
                             ))
                         ) : (
                             <tr>
                                 <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
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
             )}
         </div>

      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal 
          transaction={selectedTransaction} 
          onClose={() => setSelectedTransaction(null)} 
        />
      )}
    </div>
  );
}

export default VendorWallet;

