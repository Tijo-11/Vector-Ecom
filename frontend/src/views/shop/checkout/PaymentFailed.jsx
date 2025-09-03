import React from "react";
import { useParams } from "react-router-dom";

function PaymentFailed() {
  const { session_id } = useParams();
  return (
    <div className="container mx-auto mt-10 px-4">
      <div className="bg-white shadow-md rounded-md p-8 text-center">
        <h1 className="font-semibold text-2xl mb-4 text-red-600">
          Payment Failed
        </h1>
        <p className="text-gray-700 mb-4">
          Order ID: {session_id || "N/A"}. Please try again.
        </p>
        <a
          href="/checkout"
          className="inline-block bg-blue-500 text-white py-2 px-4 rounded-md text-sm uppercase font-semibold hover:bg-blue-600 transition"
        >
          Try Again
        </a>
      </div>
    </div>
  );
}
export default PaymentFailed;
