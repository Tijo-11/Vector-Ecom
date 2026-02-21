import React, { useState, useEffect, useMemo } from "react";
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
  ArrowUpRight as ArrowUpRightIcon,
  FileText,
  Download,
  Filter,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import { Chart } from "chart.js/auto";
import "chartjs-adapter-date-fns";
import { format } from "date-fns";

function VendorWallet() {
  // Stats and Balance (Always fetch total)
  const [stats, setStats] = useState(null);

  // Transactions and Filtering
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modal State
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const user = useAuthStore((state) => state.user);
  const vendorId = user?.vendor_id;

  useEffect(() => {
    if (vendorId) {
      fetchStats();
      fetchTransactions();
    }
  }, [vendorId]); // Fetch initially

  // Fetch Stats (Unfiltered total balance)
  const fetchStats = async () => {
    try {
      const response = await apiInstance.get(
        `vendor/wallet-stats/${vendorId}/`,
      );
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats({ balance: 0 });
    }
  };

  // Fetch Transactions (Filtered)
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = { period };
      if (period === "custom" && startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }

      const response = await apiInstance.get(
        `vendor/wallet-transactions/${vendorId}/`,
        { params },
      );
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Downloads
  const handleDownload = async (format) => {
    const params = { period };
    if (period === "custom" && startDate && endDate) {
      params.start_date = startDate;
      params.end_date = endDate;
    }

    const endpoint =
      format === "pdf"
        ? `vendor/wallet-report-pdf/${vendorId}/`
        : `vendor/wallet-report-excel/${vendorId}/`;

    try {
      const res = await apiInstance.get(endpoint, {
        params,
        responseType: "blob",
      });
      const contentType =
        format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const extension = format === "pdf" ? "pdf" : "xlsx";

      const blob = new Blob([res.data], { type: contentType });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `wallet_report.${extension}`;
      link.click();
    } catch (error) {
      console.error(`Error downloading ${format}:`, error);
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: "Could not download the report. Please try again.",
      });
    }
  };

  // Prepare Chart Data
  const chartData = useMemo(() => {
    const grouped = {};

    // Initialize grouping based on transactions
    transactions.forEach((t) => {
      const dateStr = t.created_at ? t.created_at.split("T")[0] : null;
      if (!dateStr) return;

      if (!grouped[dateStr]) {
        grouped[dateStr] = {
          payment: 0,
          refund: 0,
          date: new Date(t.created_at),
        };
      }

      const amount = parseFloat(t.amount);
      if (t.transaction_type === "payment") {
        grouped[dateStr].payment += amount;
      } else if (t.transaction_type === "refund") {
        grouped[dateStr].refund += amount; // Amount is usually positive in DB, represents outflow
      }
    });

    // Sort by date
    const sortedDates = Object.keys(grouped).sort();

    return {
      labels: sortedDates.map((d) => grouped[d].date),
      datasets: [
        {
          label: "Payments Received",
          data: sortedDates.map((d) => grouped[d].payment),
          borderColor: "#10B981", // Green
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Refunds Issued",
          data: sortedDates.map((d) => grouped[d].refund),
          borderColor: "#F59E0B", // Orange
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [transactions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "time",
        time: {
          unit: period === "yearly" ? "month" : "day",
          displayFormats: {
            day: "MMM d",
            month: "MMM yyyy",
          },
        },
        grid: { display: false },
        ticks: { color: "#9ca3af" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#f3f4f6" },
        ticks: { color: "#9ca3af" },
      },
    },
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ₹${context.parsed.y.toLocaleString("en-IN")}`;
          },
        },
      },
    },
  };

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getTransactionIcon = (type) => {
    if (type === "payment")
      return <ArrowDownLeft className="text-green-600" size={20} />;
    if (type === "refund")
      return <ArrowUpRightIcon className="text-orange-600" size={20} />;
    return <Clock className="text-yellow-600" size={20} />;
  };

  const getTransactionSource = (tx) => {
    if (tx.transaction_type === "payment") {
      return `Order #${tx.related_order?.oid || "N/A"}`;
    }
    if (tx.transaction_type === "refund") {
      return `Refund for Order #${tx.related_order?.oid || "N/A"}`;
    }
    if (tx.transaction_type === "pending") {
      return `Pending Order #${tx.related_order?.oid || "N/A"}`;
    }
    return "Transaction";
  };

  // Modal Render
  const TransactionDetailModal = ({ transaction, onClose }) => {
    if (!transaction) return null;

    const isRefundOrCancel =
      transaction.transaction_type === "refund" ||
      transaction.related_order?.order_status === "Cancelled" ||
      transaction.related_order?.order_status === "Returned";

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl ${
                  transaction.transaction_type === "payment"
                    ? "bg-green-100"
                    : transaction.transaction_type === "refund"
                      ? "bg-orange-100"
                      : "bg-yellow-100"
                }`}
              >
                {getTransactionIcon(transaction.transaction_type)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Transaction Details
                </h3>
                <p className="text-sm text-gray-500">
                  {transaction.transaction_type_display}
                </p>
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
              <p
                className={`text-3xl font-bold ${
                  parseFloat(transaction.amount) > 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {parseFloat(transaction.amount) > 0 ? "+" : ""}₹
                {Math.abs(parseFloat(transaction.amount)).toLocaleString(
                  "en-IN",
                  { minimumFractionDigits: 2 },
                )}
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
                  <span className="font-medium text-gray-900">
                    {transaction.user?.full_name || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-900">
                    {transaction.user?.email || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                <Hash size={18} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase">
                    Transaction ID
                  </p>
                  <p className="font-mono text-sm font-medium text-gray-900">
                    {transaction.transaction_id || transaction.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                <Calendar size={18} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase">
                    Transaction Date
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(transaction.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                <Tag size={18} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase">
                    Transaction Type
                  </p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {transaction.transaction_type_display ||
                      transaction.transaction_type}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Details in Modal */}
            {transaction.related_order && (
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3 text-blue-700">
                  <ShoppingBag size={18} />
                  <span className="font-semibold">Order Details</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-600">Order ID</span>
                    <span className="font-medium text-blue-900">
                      {transaction.related_order.oid}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Total</span>
                    <span className="font-medium text-blue-900">
                      ₹
                      {parseFloat(
                        transaction.related_order.total,
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Status</span>
                    <span className="font-medium text-blue-900 capitalize">
                      {transaction.related_order.order_status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Description in Modal */}
            {transaction.description && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase mb-1">
                  Description
                </p>
                <p className="text-sm text-gray-700">
                  {transaction.description}
                </p>
              </div>
            )}
          </div>
          <div className="p-6 border-t border-gray-100 space-y-3">
            {isRefundOrCancel && transaction.related_order?.oid && (
              <Link
                to={`/vendor/orders/${transaction.related_order.oid}/`}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <ExternalLink size={18} /> View Order
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

      <div className="flex-1 p-8 lg:p-12 overflow-x-hidden">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Wallet & Payouts</h1>
          <p className="text-gray-500 mt-1">
            Manage your earnings, view transaction history and download reports.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-3 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <p className="text-gray-400 font-medium uppercase tracking-wider text-sm flex items-center gap-2">
                  <TrendingUp size={16} className="text-green-400" /> Available
                  Balance
                </p>
                <h1 className="text-4xl md:text-5xl font-bold mt-4 tracking-tight">
                  ₹{stats?.balance?.toFixed(2) || "0.00"}
                </h1>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-700 flex flex-wrap gap-6">
                <div>
                  <p className="text-xs text-gray-400">Total Earned</p>
                  <p className="font-semibold text-lg">
                    ₹{stats?.total_earned?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Pending Payouts</p>
                  <p className="font-semibold text-lg">
                    ₹{stats?.pending_payouts?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total Refunded</p>
                  <p className="font-semibold text-lg text-orange-400">
                    ₹{stats?.total_refunded?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
            </div>
            {/* Background Decoration */}
            <div className="absolute right-0 top-0 h-full w-1/2 opacity-10 pointer-events-none">
              <svg
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full"
              >
                <path
                  fill="#FFFFFF"
                  d="M42.7,-62.9C50.9,-52.8,50.1,-34.4,51.7,-19.2C53.4,-4,57.4,8,54.6,19.1C51.8,30.3,42.1,40.6,31.2,46.7C20.3,52.9,8.2,54.8,-3.1,59.1C-14.4,63.4,-24.8,70,-34.7,68.2C-44.6,66.4,-54,56.1,-61.6,44.9C-69.2,33.7,-75,21.5,-72.7,10.9C-70.4,0.3,-60,-8.7,-51.1,-16.6C-42.3,-24.5,-35,-31.3,-26.9,-41.5C-18.8,-51.7,-9.9,-65.4,3.7,-70.5C17.3,-75.6,34.5,-73.1,42.7,-62.9Z"
                  transform="translate(100 100)"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left: Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <Filter size={20} className="text-gray-400" />
                Filter by:
              </div>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Range</option>
              </select>

              {period === "custom" && (
                <>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                  />
                </>
              )}

              <button
                onClick={fetchTransactions}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} /> Apply Filter
              </button>
            </div>

            {/* Right: Downloads */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDownload("pdf")}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileText size={16} className="text-red-500" /> PDF
              </button>
              <button
                onClick={() => handleDownload("excel")}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileText size={16} className="text-green-600" /> Excel
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Chart */}
        {transactions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              Transaction Analytics
            </h3>
            <div className="h-[300px]">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Transaction History Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <History size={20} className="text-gray-400" />
              {period === "custom"
                ? "Filtered Transactions"
                : `Transaction History (${period})`}
            </h2>
            <span className="text-sm text-gray-500">
              {transactions.length} records found
            </span>
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
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                tx.transaction_type === "payment"
                                  ? "bg-green-100"
                                  : tx.transaction_type === "refund"
                                    ? "bg-orange-100"
                                    : "bg-yellow-100"
                              }`}
                            >
                              {getTransactionIcon(tx.transaction_type)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {tx.transaction_type_display ||
                                  tx.transaction_type ||
                                  "Transaction"}
                              </p>
                              <p className="text-xs text-gray-500 font-mono">
                                {tx.transaction_id || tx.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {tx.user?.full_name || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {tx.user?.email || ""}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-400" />
                            {formatDate(tx.created_at)}
                          </div>
                        </td>
                        <td
                          className={`px-6 py-4 font-bold ${parseFloat(tx.amount) > 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {parseFloat(tx.amount) > 0 ? "+" : ""}₹
                          {Math.abs(parseFloat(tx.amount)).toLocaleString(
                            "en-IN",
                            { minimumFractionDigits: 2 },
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                              tx.transaction_type === "payment"
                                ? "bg-green-100 text-green-700"
                                : tx.transaction_type === "refund"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {tx.transaction_type === "payment"
                              ? "Completed"
                              : tx.transaction_type === "refund"
                                ? "Refunded"
                                : "Pending"}
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
                      <td
                        colSpan="6"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center">
                          <AlertCircle
                            size={48}
                            className="text-gray-200 mb-2"
                          />
                          <p>No transactions found for the selected period.</p>
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

      {/* Detail Modal */}
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
