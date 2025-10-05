import AdminSidebar from "./Sidebar";

export default function AdminSettings() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border">
          <h1 className="text-2xl font-semibold mb-4">Admin Settings</h1>
          <div className="bg-gray-50 shadow rounded-xl p-6 h-64 flex items-center justify-center text-gray-400">
            Settings Form / Options Placeholder
          </div>
        </section>
      </div>
    </div>
  );
}
