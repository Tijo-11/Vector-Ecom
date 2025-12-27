import React from "react";
import { useParams, Link } from "react-router-dom";

function PaymentFailed() {
  const { order_id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-sm w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <div className="mx-auto w-32 h-32 mb-6">
          <svg
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full text-red-500"
          >
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="currentColor"
              strokeWidth="8"
            />
            <line
              x1="60"
              y1="60"
              x2="140"
              y2="140"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <line
              x1="140"
              y1="60"
              x2="60"
              y2="140"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Failed
        </h1>

        <p className="text-sm text-gray-600 mb-2">
          We're sorry, your payment could not be processed.
        </p>

        <p className="text-sm text-gray-600 mb-4">
          Please retry the payment or return to your cart.
        </p>

        <p className="text-xs text-gray-500 mb-6">
          Order Reference:{" "}
          <span className="font-mono font-semibold">{order_id || "N/A"}</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={`/checkout/${order_id}`}
            className="w-full sm:w-auto inline-block bg-red-600 text-white font-semibold py-2.5 px-6 rounded-md hover:bg-red-700 transition uppercase tracking-wide text-sm"
          >
            Retry Payment
          </Link>

          <Link
            to="/cart"
            className="w-full sm:w-auto inline-block bg-gray-700 text-white font-semibold py-2.5 px-6 rounded-md hover:bg-gray-800 transition uppercase tracking-wide text-sm"
          >
            Return to Cart
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Need help?{" "}
          <Link to="/contact" className="text-blue-600 hover:underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}

export default PaymentFailed;
