import AdminSidebar from "./Sidebar"; // make sure the path is correct
import { Ban, ShieldAlert } from "lucide-react";

const vendors = [
  { id: 1, name: "VendorX", products: 120, status: "Active" },
  { id: 2, name: "VendorY", products: 80, status: "Blocked" },
];

const VendorManagement = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Vendor Management</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Name</th>
                <th className="pb-2">Products</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} className="border-b last:border-none">
                  <td className="py-2">{v.name}</td>
                  <td>{v.products}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        v.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="text-right space-x-2">
                    {v.status === "Active" ? (
                      <button className="flex items-center text-red-600 hover:underline">
                        <Ban size={16} className="mr-1" /> Block
                      </button>
                    ) : (
                      <button className="flex items-center text-green-600 hover:underline">
                        <ShieldAlert size={16} className="mr-1" /> Unblock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default VendorManagement;
