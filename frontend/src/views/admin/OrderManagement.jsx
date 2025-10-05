import React from "react";
import AdminSidebar from "./Sidebar"; // adjust the path if needed

export default function OrderManagement() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border">
          <h1 className="text-2xl font-semibold mb-4">Order Management</h1>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 py-2">#Order ID</th>
                  <th className="px-4 py-2">Vendor</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-4 py-2">#ORD001</td>
                  <td className="px-4 py-2">VendorX</td>
                  <td className="px-4 py-2">₹2999</td>
                  <td className="px-4 py-2 text-green-600 font-semibold">
                    Delivered
                  </td>
                  <td className="px-4 py-2">5th Oct, 2025</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
