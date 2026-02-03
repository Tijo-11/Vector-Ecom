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
  TrendingUp,
  Package,
  Tag,
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
  const [bestProducts, setBestProducts] = useState([]);
  const [bestCategories, setBestCategories] = useState([]);
  const [period, setPeriod] = useState("monthly");

  // Fetch top-level stats
  useEffect(() => {
    apiInstance.get(`/admin/stats/`).then((res) => {
      setStats(res.data[0]);
    });
  }, []);

  // Fetch chart data and best selling data based on period
  const fetchChartData = async (selectedPeriod) => {
    try {
      const [revenueRes, orderRes, productsRes, categoriesRes] = await Promise.all([
        apiInstance.get(`/admin/revenue-chart/?period=${selectedPeriod}`),
        apiInstance.get(`/admin/orders-chart/?period=${selectedPeriod}`),
        apiInstance.get(`/admin/best-selling-products/?period=${selectedPeriod}`),
        apiInstance.get(`/admin/best-selling-categories/?period=${selectedPeriod}`),
      ]);
      setRevenueChartData(revenueRes?.data || []);
      setOrdersChartData(orderRes?.data || []);
      setBestProducts(productsRes?.data || []);
      setBestCategories(categoriesRes?.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchChartData(period);
  }, [period]);

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
        label: "Total Revenue (₹)",
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

  const periodLabels = {
    daily: "Last 30 Days",
    weekly: "Last 12 Weeks",
    monthly: "Last 12 Months",
    yearly: "Last 3 Years",
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
                    {stats?.total_vendors || 0}
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
                    {stats?.total_orders || 0}
                  </h1>
                </div>

                <div className="bg-yellow-500 text-white rounded-xl shadow p-4 flex flex-col items-start">
                  <div className="self-end opacity-20">
                    <IndianRupee size={48} />
                  </div>
                  <h6 className="uppercase tracking-wide text-sm">Revenue</h6>
                  <h1 className="text-4xl font-bold">
                    ₹{stats?.total_revenue?.toLocaleString() || "0"}
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
                    {stats?.top_vendor || "N/A"}
                  </h1>
                </div>
              </div>

              <hr className="my-6" />

              {/* === PERIOD FILTER === */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="text-indigo-600" />
                  Admin Analytics
                </h2>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-600">
                    Time Period:
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="daily">Daily (Last 30 Days)</option>
                    <option value="weekly">Weekly (Last 12 Weeks)</option>
                    <option value="monthly">Monthly (Last 12 Months)</option>
                    <option value="yearly">Yearly (Last 3 Years)</option>
                  </select>
                </div>
              </div>

              {/* === CHARTS === */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow p-4 h-[350px]">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Revenue - {periodLabels[period]}</h3>
                  <div className="h-[300px]">
                    <Bar data={revenueData} options={chartOptions} />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow p-4 h-[350px]">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Orders - {periodLabels[period]}</h3>
                  <div className="h-[300px]">
                    <Bar data={ordersData} options={chartOptions} />
                  </div>
                </div>
              </div>

              <hr className="my-6" />

              {/* === BEST SELLING SECTION === */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Best Selling Products */}
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="text-blue-600" size={24} />
                    <h3 className="text-lg font-semibold">Best Selling Products (Top 10)</h3>
                  </div>
                  {bestProducts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-3 px-2 font-medium text-gray-600">#</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-600">Image</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-600">Product</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-600">Vendor</th>
                            <th className="text-right py-3 px-2 font-medium text-gray-600">Sold</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bestProducts.map((product, index) => (
                            <tr key={product.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-2 text-gray-500">{index + 1}</td>
                              <td className="py-3 px-2">
                                <img
                                  src={product.image || "https://via.placeholder.com/40"}
                                  alt={product.title}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <div className="font-medium text-gray-900 line-clamp-1">{product.title}</div>
                                <div className="text-xs text-gray-500">{product.category_name}</div>
                              </td>
                              <td className="py-3 px-2 text-gray-600">{product.vendor_name}</td>
                              <td className="py-3 px-2 text-right">
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                                  {product.sell_count}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="mx-auto mb-2 opacity-50" size={40} />
                      <p>No sales data available for this period</p>
                    </div>
                  )}
                </div>

                {/* Best Selling Categories */}
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="text-purple-600" size={24} />
                    <h3 className="text-lg font-semibold">Best Selling Categories (Top 10)</h3>
                  </div>
                  {bestCategories.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-3 px-2 font-medium text-gray-600">#</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-600">Image</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-600">Category</th>
                            <th className="text-right py-3 px-2 font-medium text-gray-600">Items Sold</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bestCategories.map((category, index) => (
                            <tr key={category.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-2 text-gray-500">{index + 1}</td>
                              <td className="py-3 px-2">
                                <img
                                  src={category.image || "https://via.placeholder.com/40"}
                                  alt={category.title}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              </td>
                              <td className="py-3 px-2 font-medium text-gray-900">{category.title}</td>
                              <td className="py-3 px-2 text-right">
                                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold">
                                  {category.sell_count}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Tag className="mx-auto mb-2 opacity-50" size={40} />
                      <p>No sales data available for this period</p>
                    </div>
                  )}
                </div>
              </div>

              <hr className="my-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
