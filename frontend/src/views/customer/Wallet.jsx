// src/views/customer/Wallet.jsx

import React, { useState, useEffect } from "react";
import UserData from "../../plugin/UserData";
import apiInstance from "../../utils/axios";
import Sidebar from "./Sidebar"; // Adjust if filename is sidebar.jsx → "./sidebar"
import Swal from "sweetalert2";

const Wallet = () => {
  const userData = UserData();
  const userId = userData?.user_id;

  const [wallet, setWallet] = useState({ balance: "0.00", currency: "INR" });
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

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

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || withdrawAmount <= 0) {
      Toast.fire({ icon: "warning", title: "Enter a valid amount" });
      return;
    }

    try {
      await apiInstance.post(`customer/wallet/withdraw/${userId}/`, {
        amount: withdrawAmount,
      });
      Toast.fire({ icon: "success", title: "Withdrawal successful!" });
      setWithdrawAmount("");
      fetchWallet();
    } catch (err) {
      Toast.fire({
        icon: "error",
        title: err.response?.data?.error || "Insufficient balance",
      });
    }
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
              {/* Sidebar - exactly as in Account page */}
              <Sidebar />

              {/* Main Content */}
              <div className="w-full lg:w-3/4 mt-1">
                <main className="mb-5">
                  <div className="px-4">
                    {/* Current Balance Section */}
                    <section className="mb-6">
                      <div className="rounded shadow p-6 bg-white">
                        <h2 className="text-2xl font-semibold mb-4">
                          My Wallet
                        </h2>
                        <p className="text-3xl font-bold text-green-600">
                          Current Balance: ₹{wallet.balance}
                        </p>
                      </div>
                    </section>

                    {/* Deposit & Withdraw Grid */}
                    <section>
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Deposit Section */}
                        <div className="rounded shadow p-6 bg-white">
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
                              className="border rounded w-full p-3 mb-4 focus:outline-none focus:border-blue-500"
                              required
                            />
                            <button
                              type="submit"
                              className="bg-blue-600 text-white w-full py-3 rounded hover:bg-blue-700 transition"
                            >
                              Deposit with Razorpay
                            </button>
                          </form>
                        </div>

                        {/* Withdraw Section */}
                        <div className="rounded shadow p-6 bg-white">
                          <h2 className="text-xl font-semibold mb-4">
                            Withdraw
                          </h2>
                          <p className="text-sm text-gray-600 mb-4">
                            This deducts from your wallet balance . Actual bank
                            payout requires additional setup.
                          </p>
                          <form onSubmit={handleWithdraw}>
                            <input
                              type="number"
                              step="0.01"
                              min="1"
                              value={withdrawAmount}
                              onChange={(e) =>
                                setWithdrawAmount(e.target.value)
                              }
                              placeholder="Amount (₹)"
                              className="border rounded w-full p-3 mb-4 focus:outline-none focus:border-red-500"
                              required
                            />
                            <button
                              type="submit"
                              className="bg-red-600 text-white w-full py-3 rounded hover:bg-red-700 transition"
                            >
                              Withdraw
                            </button>
                          </form>
                        </div>
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
};

export default Wallet;
