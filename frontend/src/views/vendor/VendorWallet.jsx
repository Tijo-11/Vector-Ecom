// VendorWallet.jsx - Vendor Order Transactions Page
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiInstance from "../../utils/axios";
import { useAuthStore } from "../../store/auth";
import VendorSidebar from "./Sidebar";
import Swal from "sweetalert2";
import {
  RefreshCw,
  CreditCard,
  Clock,
  ExternalLink,
  X,
  CheckCircle,
} from "lucide-react";

function VendorWallet() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  const user = useAuthStore((state) => state.user);
  const vendorId = user?.vendor_id;

  useEffect(() => {
    if (vendorId) {
      fetchTransactions();
      fetchStats();
    }
  }, [vendorId, filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let url = `vendor/wallet-transactions/${vendorId}/`;
      if (filter !== "all") {
        url += `?type=${filter}`;
      }
      const response = await apiInstance.get(url);
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to load transactions",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiInstance.get(`vendor/wallet-stats/${vendorId}/`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const viewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "refund":
        return <RefreshCw className="text-orange-500" size={20} />;
      case "payment":
        return <CheckCircle className="text-green-500" size={20} />;
      case "pending":
        return <Clock className="text-yellow-500" size={20} />;
      default:
        return <CreditCard className="text-gray-500" size={20} />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case "refund":
        return "text-orange-600 bg-orange-50";
      case "payment":
        return "text-green-600 bg-green-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
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
    <div className="flex min-h-screen bg-gray-100">
      <VendorSidebar />
      
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Order Transactions</h1>
          <p className="text-gray-600">View all payments and transactions from your orders</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
              <p className="text-2xl font-bold text-gray-800">{stats.total_transactions}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Paid Orders</h3>
              <p className="text-2xl font-bold text-green-600">
                ₹{parseFloat(stats.total_paid?.total || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">{stats.total_paid?.count || 0} orders</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Pending Payment</h3>
              <p className="text-2xl font-bold text-yellow-600">
                ₹{parseFloat(stats.total_pending?.total || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">{stats.total_pending?.count || 0} orders</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500">Refunds Issued</h3>
              <p className="text-2xl font-bold text-orange-600">
                ₹{parseFloat(stats.total_refunds?.total || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400">{stats.total_refunds?.count || 0} refunds</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by Type:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Transactions</option>
              <option value="payment">Paid Orders</option>
              <option value="pending">Pending Orders</option>
              <option value="refund">Refunds</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900">
                          {transaction.related_order?.oid || transaction.transaction_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {formatDate(transaction.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.user?.full_name || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">{transaction.user?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionColor(
                            transaction.transaction_type
                          )}`}
                        >
                          {getTransactionIcon(transaction.transaction_type)}
                          {transaction.transaction_type_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          transaction.transaction_type === 'refund' ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {transaction.transaction_type === 'refund' ? '-' : ''}₹{parseFloat(transaction.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewTransaction(transaction)}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            View
                          </button>
                          {transaction.related_order?.oid && (
                            <Link
                              to={`/vendor/orders/${transaction.related_order.oid}/`}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <ExternalLink size={16} />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-bold text-gray-800">Transaction Details</h2>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Transaction Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Transaction ID</label>
                    <p className="font-mono font-medium">{selectedTransaction.transaction_id}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Date & Time</label>
                    <p className="font-medium">{formatDate(selectedTransaction.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Payment Method</label>
                    <p className="font-medium text-gray-700">
                      {selectedTransaction.payment_method || (selectedTransaction.transaction_type === "pending" ? "Pay on Delivery (Pending)" : "Online Funding")}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Status</label>
                    <p className="font-medium">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionColor(
                          selectedTransaction.transaction_type
                        )}`}
                      >
                        {getTransactionIcon(selectedTransaction.transaction_type)}
                        {selectedTransaction.transaction_type_display}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase">Amount</label>
                    <p className={`text-xl font-bold ${
                      selectedTransaction.transaction_type === 'refund' ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {selectedTransaction.transaction_type === 'refund' ? '-' : ''}₹{parseFloat(selectedTransaction.amount).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Customer Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium">{selectedTransaction.user?.full_name}</p>
                    <p className="text-sm text-gray-600">{selectedTransaction.user?.email}</p>
                  </div>
                </div>

                {/* Description */}
                {selectedTransaction.description && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                    <p className="text-gray-600">{selectedTransaction.description}</p>
                  </div>
                )}

                {/* Related Order */}
                {selectedTransaction.related_order && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Details</h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono text-sm font-medium">Order: {selectedTransaction.related_order.oid}</p>
                          <p className="text-sm text-gray-600">
                            Order Total: ₹{parseFloat(selectedTransaction.related_order.total).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Order Status: {selectedTransaction.related_order.order_status}
                          </p>
                          <p className="text-sm text-gray-600">
                            Payment Status: {selectedTransaction.related_order.payment_status}
                          </p>
                        </div>
                        <Link
                          to={`/vendor/orders/${selectedTransaction.related_order.oid}/`}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          <ExternalLink size={16} />
                          View Order
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default VendorWallet;
