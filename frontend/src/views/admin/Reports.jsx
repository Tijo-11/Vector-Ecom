import React, { useState, useEffect } from "react";
import AdminSidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import { Loader2 } from "lucide-react";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("sales");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab]);

  const fetchReport = async (type) => {
    setLoading(true);
    try {
      const response = await apiInstance.get(`/admin/reports/?type=${type}`);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderSalesContent = () => {
    if (!data) return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-gray-500 text-sm">Total Sales</h3>
          <p className="text-2xl font-bold">₹{data.total_sales?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-gray-500 text-sm">Total Orders</h3>
          <p className="text-2xl font-bold">{data.total_orders}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-gray-500 text-sm">Pending Orders</h3>
          <p className="text-2xl font-bold">{data.pending_orders}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-gray-500 text-sm">Cancelled Orders</h3>
          <p className="text-2xl font-bold">{data.cancelled_orders}</p>
        </div>
      </div>
    );
  };

  const renderVendorContent = () => {
    if (!data || !Array.isArray(data)) return null;
    return (
        <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
            <thead className="text-gray-500 border-b">
            <tr>
                <th className="pb-2">Vendor</th>
                <th className="pb-2">Total Revenue</th>
                <th className="pb-2">Orders</th>
                <th className="pb-2">Products</th>
            </tr>
            </thead>
            <tbody className="divide-y">
            {data.map((item) => (
                <tr key={item.vendor_id}>
                <td className="py-2 font-medium">{item.vendor_name}</td>
                <td className="py-2">₹{item.total_revenue?.toLocaleString()}</td>
                <td className="py-2">{item.total_orders}</td>
                <td className="py-2">{item.total_products}</td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    );
  };

  const renderProductContent = () => {
    if (!data || !Array.isArray(data)) return null;
    return (
        <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
            <thead className="text-gray-500 border-b">
            <tr>
                <th className="pb-2">Product</th>
                <th className="pb-2">Vendor</th>
                <th className="pb-2">Total Revenue</th>
                <th className="pb-2">Orders</th>
            </tr>
            </thead>
            <tbody className="divide-y">
            {data.map((item) => (
                <tr key={item.product_id}>
                <td className="py-2 font-medium">{item.product_title}</td>
                <td className="py-2">{item.vendor_name}</td>
                <td className="py-2">₹{item.total_revenue?.toLocaleString()}</td>
                <td className="py-2">{item.total_orders}</td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border">
          <h1 className="text-2xl font-semibold mb-6">Reports</h1>
          
          <div className="flex gap-4 mb-6 border-b pb-2">
            <button 
                className={`pb-2 px-1 ${activeTab === 'sales' ? 'border-b-2 border-indigo-600 text-indigo-600 font-medium' : 'text-gray-500'}`}
                onClick={() => setActiveTab('sales')}
            >
                Sales Report
            </button>
            <button 
                className={`pb-2 px-1 ${activeTab === 'vendor_performance' ? 'border-b-2 border-indigo-600 text-indigo-600 font-medium' : 'text-gray-500'}`}
                onClick={() => setActiveTab('vendor_performance')}
            >
                Vendor Performance
            </button>
            <button 
                 className={`pb-2 px-1 ${activeTab === 'products' ? 'border-b-2 border-indigo-600 text-indigo-600 font-medium' : 'text-gray-500'}`}
                onClick={() => setActiveTab('products')}
            >
                Product Reports
            </button>
          </div>

          {loading ? (
             <div className="flex justify-center p-8">
               <Loader2 className="animate-spin text-gray-500" />
             </div>
          ) : (
            <div>
                {activeTab === 'sales' && renderSalesContent()}
                {activeTab === 'vendor_performance' && renderVendorContent()}
                {activeTab === 'products' && renderProductContent()}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
