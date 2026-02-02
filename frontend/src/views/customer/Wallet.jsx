import React, { useState, useEffect } from "react";
import UserData from "../../plugin/UserData";
import apiInstance from "../../utils/axios";

const Wallet = () => {
  const userData = UserData();
  const userId = userData?.user_id;

  const [wallet, setWallet] = useState({ balance: "0.00", currency: "INR" });
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

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
    }
  };

  const loadRazorpayScript = () => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || depositAmount <= 0)
      return alert("Enter a valid amount");

    try {
      const res = await apiInstance.post(`customer/wallet/deposit/${userId}/`, {
        amount: depositAmount,
      });

      const options = {
        key: res.data.key,
        amount: res.data.amount,
        currency: "INR",
        order_id: res.data.order_id,
        name: "Your Store",
        description: "Wallet Top-Up",
        handler: async (response) => {
          try {
            await apiInstance.post(`customer/wallet/verify/${userId}/`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            alert("Deposit successful!");
            setDepositAmount("");
            fetchWallet();
          } catch (err) {
            alert("Payment verification failed");
          }
        },
        prefill: {
          name: userData?.full_name || "",
          email: userData?.email || "",
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => alert("Payment failed"));
      rzp.open();
    } catch (err) {
      console.error(err);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || withdrawAmount <= 0)
      return alert("Enter a valid amount");

    try {
      await apiInstance.post(`customer/wallet/withdraw/${userId}/`, {
        amount: withdrawAmount,
      });
      alert("Withdrawal successful (balance deducted)");
      setWithdrawAmount("");
      fetchWallet();
    } catch (err) {
      alert(err.response?.data?.error || "Insufficient balance");
    }
  };

  if (!userId) return <div>Please log in to view your wallet.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Wallet</h1>

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <p className="text-2xl">Current Balance: ₹{wallet.balance}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Deposit Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Deposit Money</h2>
          <form onSubmit={handleDeposit}>
            <input
              type="number"
              step="0.01"
              min="1"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Amount (₹)"
              className="border rounded w-full p-3 mb-4"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white w-full py-3 rounded hover:bg-blue-700"
            >
              Deposit with Razorpay
            </button>
          </form>
        </div>

        {/* Withdraw Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Withdraw (Deduct Balance)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            This deducts from your wallet (e.g., for spending in orders). Actual
            bank transfer requires extra Razorpay Payouts setup.
          </p>
          <form onSubmit={handleWithdraw}>
            <input
              type="number"
              step="0.01"
              min="1"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Amount (₹)"
              className="border rounded w-full p-3 mb-4"
              required
            />
            <button
              type="submit"
              className="bg-red-600 text-white w-full py-3 rounded hover:bg-red-700"
            >
              Withdraw
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
