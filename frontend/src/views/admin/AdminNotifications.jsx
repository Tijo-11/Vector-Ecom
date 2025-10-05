import React from "react";
import AdminSidebar from "./Sidebar";
export default function AdminNotifications() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border">
          <h1 className="text-2xl font-semibold mb-6">Notifications</h1>
          <ul className="space-y-3">
            <li className="bg-gray-50 shadow rounded-xl p-4 text-gray-700">
              VendorX added a new product.
            </li>
            <li className="bg-gray-50 shadow rounded-xl p-4 text-gray-700">
              Order #ORD123 has been delivered.
            </li>
            <li className="bg-gray-50 shadow rounded-xl p-4 text-gray-700">
              Service fee collected: ₹1500.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
