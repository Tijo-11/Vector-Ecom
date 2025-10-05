import { useState, useEffect } from "react";
import {
  Grid,
  ShoppingCart,
  Users,
  IndianRupee,
  Eye,
  Edit,
  Trash,
  BarChart2,
  ShieldAlert,
  Ban,
} from "lucide-react";
import AdminSidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import { Line, Bar } from "react-chartjs-2";
import { Chart } from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import "chartjs-adapter-date-fns";
Chart.register(zoomPlugin);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [revenueChartData, setRevenueChartData] = useState([]);
  const [ordersChartData, setOrdersChartData] = useState([]);
  const [activeTab, setActiveTab] = useState("vendors");

  // Fetch top-level stats (placeholder)
  useEffect(() => {
    apiInstance.get(`/admin/stats/`).then((res) => {
      setStats(res.data[0]);
    });
  }, []);

  // Fetch chart data (placeholder)
  const fetchChartData = async () => {
    const revenueRes = await apiInstance.get(`/admin/revenue-chart/`);
    const orderRes = await apiInstance.get(`/admin/orders-chart/`);
    setRevenueChartData(revenueRes?.data || []);
    setOrdersChartData(orderRes?.data || []);
  };
  useEffect(() => {
    fetchChartData();
  }, []);

  // Prepare Chart.js data
  const revenueMonths = revenueChartData.map((item) => item.month);
  const revenueValues = revenueChartData.map((item) => item.revenue);

  const orderMonths = ordersChartData.map((item) => item.month);
  const orderCounts = ordersChartData.map((item) => item.orders);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "time",
        time: {
          unit: "month",
        },
        title: {
          display: true,
          text: "Timeline",
        },
      },
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: "x",
        },
        pan: { enabled: true, mode: "x" },
      },
    },
  };

  const revenueData = {
    labels: revenueMonths,
    datasets: [
      {
        label: "Total Service Fees (₹)",
        data: revenueValues,
        fill: true,
        backgroundColor: "rgba(99, 102, 241, 0.3)",
        borderColor: "rgba(99, 102, 241, 1)",
      },
    ],
  };

  const ordersData = {
    labels: orderMonths,
    datasets: [
      {
        label: "Total Orders",
        data: orderCounts,
        fill: true,
        backgroundColor: "rgba(16, 185, 129, 0.3)",
        borderColor: "rgba(16, 185, 129, 1)",
      },
    ],
  };

  return (
    <div className="w-full px-4" id="main">
      <div className="flex flex-row h-full">
        <div className="w-full" id="main">
          <div className="flex h-full">
            <AdminSidebar />
            <div className="flex-1 mt-4 px-4">
              {/* === STATS CARDS === */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <div className="bg-indigo-500 text-white rounded-xl shadow p-4 flex flex-col items-start">
                  <div className="self-end opacity-20">
                    <Users size={64} />
                  </div>
                  <h6 className="uppercase tracking-wide text-sm">
                    Total Vendors
                  </h6>
                  <h1 className="text-4xl font-bold">
                    {stats?.total_vendors || 42}
                  </h1>
                </div>

                <div className="bg-green-500 text-white rounded-xl shadow p-4 flex flex-col items-start">
                  <div className="self-end opacity-20">
                    <ShoppingCart size={64} />
                  </div>
                  <h6 className="uppercase tracking-wide text-sm">
                    Total Orders
                  </h6>
                  <h1 className="text-4xl font-bold">
                    {stats?.total_orders || 2480}
                  </h1>
                </div>

                <div className="bg-yellow-500 text-white rounded-xl shadow p-4 flex flex-col items-start">
                  <div className="self-end opacity-20">
                    <IndianRupee size={48} />
                  </div>
                  <h6 className="uppercase tracking-wide text-sm">
                    Service Fees
                  </h6>
                  <h1 className="text-4xl font-bold">
                    ₹{stats?.service_fees || "85,240"}
                  </h1>
                </div>

                <div className="bg-red-500 text-white rounded-xl shadow p-4 flex flex-col items-start">
                  <div className="self-end opacity-20">
                    <BarChart2 size={64} />
                  </div>
                  <h6 className="uppercase tracking-wide text-sm">
                    Top Vendor
                  </h6>
                  <h1 className="text-2xl font-semibold">
                    {stats?.top_vendor || "VendorX"}
                  </h1>
                </div>
              </div>

              <hr className="my-6" />

              {/* === CHARTS === */}
              <div className="mb-6">
                <div className="flex justify-center items-center mb-3">
                  <h2 className="text-lg font-semibold">Admin Analytics</h2>
                </div>

                <div className="bg-white rounded-xl shadow p-4 h-[350px] w-[75%] mx-auto my-4">
                  <Bar data={revenueData} options={chartOptions} />
                </div>

                <div className="bg-white rounded-xl shadow p-4 h-[350px] w-[75%] mx-auto my-4">
                  <Bar data={ordersData} options={chartOptions} />
                </div>
              </div>

              <hr className="my-6" />

              {/* === TABS: Vendors & Products === */}
              <div className="mb-24">
                <ul className="flex border-b mb-4">
                  <li className="mr-1">
                    <button
                      className={`inline-block px-4 py-2 font-medium ${
                        activeTab === "vendors"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-blue-600"
                      }`}
                      onClick={() => setActiveTab("vendors")}
                    >
                      Vendors
                    </button>
                  </li>
                  <li className="mr-1">
                    <button
                      className={`inline-block px-4 py-2 font-medium ${
                        activeTab === "products"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-blue-600"
                      }`}
                      onClick={() => setActiveTab("products")}
                    >
                      Products
                    </button>
                  </li>
                </ul>

                {/* === VENDOR TAB === */}
                {activeTab === "vendors" && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4">
                      Vendor Management
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-auto border-collapse">
                        <thead className="bg-gray-800 text-white">
                          <tr>
                            <th className="px-4 py-2 text-left">#ID</th>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">Products</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr>
                            <td className="px-4 py-2">#VN001</td>
                            <td className="px-4 py-2">VendorX</td>
                            <td className="px-4 py-2">vendorx@mail.com</td>
                            <td className="px-4 py-2">120</td>
                            <td className="px-4 py-2 text-green-600 font-semibold">
                              Active
                            </td>
                            <td className="px-4 py-2 space-x-2">
                              <button className="bg-red-500 text-white px-2 py-1 rounded inline-flex items-center">
                                <Ban size={16} className="mr-1" /> Block
                              </button>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2">#VN002</td>
                            <td className="px-4 py-2">VendorY</td>
                            <td className="px-4 py-2">vendory@mail.com</td>
                            <td className="px-4 py-2">60</td>
                            <td className="px-4 py-2 text-red-600 font-semibold">
                              Blocked
                            </td>
                            <td className="px-4 py-2 space-x-2">
                              <button className="bg-green-500 text-white px-2 py-1 rounded inline-flex items-center">
                                <ShieldAlert size={16} className="mr-1" />{" "}
                                Unblock
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* === PRODUCT TAB === */}
                {activeTab === "products" && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4">
                      Product Management
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-auto border-collapse">
                        <thead className="bg-gray-800 text-white">
                          <tr>
                            <th className="px-4 py-2 text-left">#ID</th>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Vendor</th>
                            <th className="px-4 py-2 text-left">Price</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr>
                            <td className="px-4 py-2">#PR001</td>
                            <td className="px-4 py-2">Wireless Earbuds</td>
                            <td className="px-4 py-2">VendorX</td>
                            <td className="px-4 py-2">₹1999</td>
                            <td className="px-4 py-2 text-green-600 font-semibold">
                              Active
                            </td>
                            <td className="px-4 py-2 space-x-2">
                              <button className="bg-gray-500 text-white px-2 py-1 rounded inline-flex items-center">
                                <Trash size={16} className="mr-1" /> Deactivate
                              </button>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2">#PR002</td>
                            <td className="px-4 py-2">Bluetooth Speaker</td>
                            <td className="px-4 py-2">VendorY</td>
                            <td className="px-4 py-2">₹1499</td>
                            <td className="px-4 py-2 text-gray-600 font-semibold">
                              Inactive
                            </td>
                            <td className="px-4 py-2 space-x-2">
                              <button className="bg-green-500 text-white px-2 py-1 rounded inline-flex items-center">
                                <Edit size={16} className="mr-1" /> Activate
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
