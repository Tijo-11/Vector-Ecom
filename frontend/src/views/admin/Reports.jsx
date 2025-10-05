import React from "react";
import AdminSidebar from "./Sidebar"; // adjust path if needed

export default function Reports() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border">
          <h1 className="text-2xl font-semibold mb-6">Reports</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 shadow rounded-xl p-6 h-48 flex items-center justify-center text-gray-400">
              Sales Report
            </div>
            <div className="bg-gray-50 shadow rounded-xl p-6 h-48 flex items-center justify-center text-gray-400">
              Vendor Performance
            </div>
            <div className="bg-gray-50 shadow rounded-xl p-6 h-48 flex items-center justify-center text-gray-400">
              Product Reports
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
