// src/views/customer/Wallet.jsx

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserData from "../../plugin/UserData";
import apiInstance from "../../utils/axios";
import Sidebar from "./Sidebar";
import Swal from "sweetalert2";
import {
  RefreshCw,
  Clock,
  History,
  AlertCircle,
  X,
  Hash,
  Calendar,
  Tag,
  ShoppingBag,
  ExternalLink,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

const Wallet = () => {
  const userData = UserData();
  const userId = userData?.user_id;

  const [wallet, setWallet] = useState({ balance: "0.00", currency: "INR" });
  const [depositAmount, setDepositAmount] = useState("");

  // Transaction states
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const Toast = Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });

  useEffect(() => {
    if (!userId) return;
    fetchWallet();
    fetchTransactions();
    loadRazorpayScript();
  }, [userId]);

  const fetchWallet = async () => {
    try {
      const res = await apiInstance.get(`customer/wallet/${userId}/`);
      setWallet(res.data);
    } catch (err) {
      console.error(err);
      Toast.fire({ icon: "error", title: "Failed to load wallet balance" });
    }
  };

  const fetchTransactions = async (type = null) => {
    if (!userId) return;
    try {
      setTxLoading(true);
      const url = type && type !== "all"
        ? `customer/wallet/transactions/${userId}/?type=${type}`
        : `customer/wallet/transactions/${userId}/`;
      const res = await apiInstance.get(url);
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    fetchTransactions(filter);
  };

  const loadRazorpayScript = () => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => console.log("Razorpay script loaded");
    script.onerror = () =>
      Toast.fire({ icon: "error", title: "Failed to load Razorpay" });
    document.body.appendChild(script);
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || depositAmount <= 0) {
      Toast.fire({ icon: "warning", title: "Enter a valid amount" });
      return;
    }

    try {
      const res = await apiInstance.post(`customer/wallet/deposit/${userId}/`, {
        amount: depositAmount,
      });

      const options = {
        key: res.data.key,
        amount: res.data.amount,
        currency: "INR",
        order_id: res.data.order_id,
        name: "RetroRelics",
        description: "Wallet Top-Up",
        handler: async (response) => {
          try {
            await apiInstance.post(`customer/wallet/verify/${userId}/`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            Toast.fire({ icon: "success", title: "Deposit successful!" });
            setDepositAmount("");
            fetchWallet();
            fetchTransactions(activeFilter);
          } catch (err) {
            Toast.fire({ icon: "error", title: "Payment verification failed" });
          }
        },
        prefill: {
          name: userData?.full_name || "",
          email: userData?.email || "",
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () =>
        Toast.fire({ icon: "error", title: "Payment failed" }),
      );
      rzp.open();
    } catch (err) {
      console.error(err);
      Toast.fire({ icon: "error", title: "Failed to create order" });
    }
  };



  // --- Helpers ---
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getTransactionIcon = (type) => {
    if (type === "deposit" || type === "refund")
      return <ArrowDownLeft className="text-green-600" size={18} />;
    if (type === "withdrawal" || type === "payment")
      return <ArrowUpRight className="text-red-600" size={18} />;
    return <Clock className="text-yellow-600" size={18} />;
  };

  const getTransactionColor = (type) => {
    if (type === "deposit" || type === "refund") return "text-green-600";
    if (type === "withdrawal" || type === "payment") return "text-red-600";
    return "text-yellow-600";
  };

  const getAmountSign = (type) => {
    if (type === "deposit" || type === "refund") return "+";
    if (type === "withdrawal" || type === "payment") return "-";
    return "";
  };

  const getBadgeClass = (type) => {
    if (type === "deposit") return "bg-green-100 text-green-700";
    if (type === "refund") return "bg-blue-100 text-blue-700";
    if (type === "payment") return "bg-purple-100 text-purple-700";
    if (type === "withdrawal") return "bg-orange-100 text-orange-700";
    return "bg-gray-100 text-gray-700";
  };

  const getIconBgClass = (type) => {
    if (type === "deposit" || type === "refund") return "bg-green-100";
    if (type === "withdrawal" || type === "payment") return "bg-red-100";
    return "bg-yellow-100";
  };

  const filterTabs = [
    { key: "all", label: "All" },
    { key: "deposit", label: "Deposits" },
    { key: "withdrawal", label: "Withdrawals" },
    { key: "payment", label: "Payments" },
    { key: "refund", label: "Refunds" },
  ];

  // --- Transaction Detail Modal ---
  const TransactionDetailModal = ({ transaction, onClose }) => {
    if (!transaction) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${getIconBgClass(transaction.transaction_type)}`}>
                {getTransactionIcon(transaction.transaction_type)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Transaction Details</h3>
                <p className="text-sm text-gray-500">{transaction.transaction_type_display}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5">
            {/* Amount */}
            <div className="text-center py-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Amount</p>
              <p className={`text-3xl font-bold ${getTransactionColor(transaction.transaction_type)}`}>
                {getAmountSign(transaction.transaction_type)}₹
                {Math.abs(parseFloat(transaction.amount)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Balance after: ₹{parseFloat(transaction.balance_after).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
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
                  <p className="text-xs text-gray-500 uppercase">Date</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(transaction.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                <Tag size={18} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase">Type</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{transaction.transaction_type_display}</p>
                </div>
              </div>
            </div>

            {/* Order Details */}
            {transaction.related_order && (
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3 text-blue-700">
                  <ShoppingBag size={18} />
                  <span className="font-semibold">Related Order</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-600">Order ID</span>
                    <span className="font-medium text-blue-900">{transaction.related_order.oid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Order Total</span>
                    <span className="font-medium text-blue-900">₹{parseFloat(transaction.related_order.total).toLocaleString("en-IN")}</span>
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
            {transaction.related_order?.oid && (
              <Link
                to={`/customer/order/detail/${transaction.related_order.oid}/`}
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

  if (!userId) {
    return (
      <div className="text-center py-10">
        Please log in to view your wallet.
      </div>
    );
  }

  return (
    <div>
      <main className="mt-5 mb-[170px]">
        <div className="max-w-7xl mx-auto px-4">
          <section>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Sidebar */}
              <Sidebar />

              {/* Main Content */}
              <div className="w-full lg:w-3/4 mt-1">
                <main className="mb-5">
                  <div className="px-4">
                    {/* Current Balance Section */}
                    <section className="mb-6">
                      <div className="rounded-2xl shadow-sm border border-gray-100 p-6 bg-white">
                        <h2 className="text-2xl font-semibold mb-4">
                          My Wallet
                        </h2>
                        <p className="text-3xl font-bold text-green-600">
                          Current Balance: ₹{wallet.balance}
                        </p>
                      </div>
                    </section>

                    {/* Deposit Section */}
                    <section className="mb-8">
                      <div className="rounded-2xl shadow-sm border border-gray-100 p-6 bg-white max-w-md">
                          <h2 className="text-xl font-semibold mb-4">
                            Deposit Money
                          </h2>
                          <form onSubmit={handleDeposit}>
                            <input
                              type="number"
                              step="0.01"
                              min="1"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              placeholder="Amount (₹)"
                              className="border rounded-lg w-full p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                            <button
                              type="submit"
                              className="bg-blue-600 text-white w-full py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                            >
                              Deposit with Razorpay
                            </button>
                          </form>
                      </div>
                    </section>

                    {/* Transaction History Section */}
                    <section>
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <History size={20} className="text-gray-400" /> Transaction History
                          </h2>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => fetchTransactions(activeFilter)}
                              className="p-2 hover:bg-gray-100 rounded-full transition"
                              title="Refresh"
                            >
                              <RefreshCw size={16} className="text-gray-500" />
                            </button>
                          </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="px-6 pt-4 flex flex-wrap gap-2">
                          {filterTabs.map((tab) => (
                            <button
                              key={tab.key}
                              onClick={() => handleFilterChange(tab.key)}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                activeFilter === tab.key
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* Table */}
                        {txLoading ? (
                          <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading transactions...</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto mt-4">
                            <table className="w-full text-left border-collapse">
                              <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                <tr>
                                  <th className="px-6 py-4">Transaction</th>
                                  <th className="px-6 py-4">Date</th>
                                  <th className="px-6 py-4">Amount</th>
                                  <th className="px-6 py-4">Balance</th>
                                  <th className="px-6 py-4">Type</th>
                                  <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 text-sm">
                                {transactions.length > 0 ? (
                                  transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                          <div className={`p-2 rounded-lg ${getIconBgClass(tx.transaction_type)}`}>
                                            {getTransactionIcon(tx.transaction_type)}
                                          </div>
                                          <div>
                                            <p className="font-medium text-gray-900">
                                              {tx.transaction_type_display}
                                            </p>
                                            <p className="text-xs text-gray-500 font-mono">{tx.transaction_id}</p>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-gray-600">
                                        <div className="flex items-center gap-2">
                                          <Clock size={14} className="text-gray-400" />
                                          {formatDate(tx.created_at)}
                                        </div>
                                      </td>
                                      <td className={`px-6 py-4 font-bold ${getTransactionColor(tx.transaction_type)}`}>
                                        {getAmountSign(tx.transaction_type)}₹
                                        {Math.abs(parseFloat(tx.amount)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-6 py-4 text-gray-700 font-medium">
                                        ₹{parseFloat(tx.balance_after).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getBadgeClass(tx.transaction_type)}`}>
                                          {tx.transaction_type_display}
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
                    </section>
                  </div>
                </main>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
};

export default Wallet;
