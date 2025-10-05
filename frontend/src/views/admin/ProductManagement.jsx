import AdminSidebar from "./Sidebar";
import { Trash, Edit } from "lucide-react";

const products = [
  { id: 1, name: "Wireless Earbuds", vendor: "VendorX", status: "Active" },
  { id: 2, name: "Bluetooth Speaker", vendor: "VendorY", status: "Inactive" },
];

const ProductManagement = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border">
          <h2 className="text-2xl font-semibold mb-4">Product Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Vendor</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b last:border-none">
                    <td className="py-2">{p.name}</td>
                    <td>{p.vendor}</td>
                    <td>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          p.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="text-right space-x-2">
                      {p.status === "Active" ? (
                        <button className="flex items-center text-red-600 hover:underline">
                          <Trash size={16} className="mr-1" /> Deactivate
                        </button>
                      ) : (
                        <button className="flex items-center text-green-600 hover:underline">
                          <Edit size={16} className="mr-1" /> Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductManagement;
