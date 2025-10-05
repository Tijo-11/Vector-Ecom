import AdminSidebar from "./Sidebar";

export default function ServiceFees() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border">
          <h1 className="text-2xl font-semibold mb-4">
            Service Fees Collected
          </h1>
          <div className="bg-gray-50 shadow rounded-xl p-6 h-64 flex items-center justify-center text-gray-400">
            Graph / Stats Placeholder
          </div>
        </section>
      </div>
    </div>
  );
}
