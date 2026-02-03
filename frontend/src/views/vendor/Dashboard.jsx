import { useState, useEffect } from "react";
import {
  Package,
  ShoppingCart,
  IndianRupee,
  Calendar,
  Filter
} from "lucide-react";
import VendorSidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import { Bar, Line } from "react-chartjs-2";
import { Chart } from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import "chartjs-adapter-date-fns";
import { format } from "date-fns";

Chart.register(zoomPlugin);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [orderChartData, setOrderChartData] = useState([]);
  const [productsChartData, setProductsChartData] = useState([]);

  useEffect(() => {
    apiInstance.get(`/vendor/stats/${UserData()?.vendor_id}/`).then((res) => {
      setStats(res.data[0]);
    });
  }, []);

  const fetchChartData = async () => {
    try {
      const order_response = await apiInstance.get(
        `vendor-orders-report-chart/${UserData()?.vendor_id}/`,
      );
      const product_response = await apiInstance.get(
        `vendor-products-report-chart/${UserData()?.vendor_id}/`,
      );
      setOrderChartData(order_response?.data || []);
      setProductsChartData(product_response?.data || []);
    } catch (err) {
      console.error("Error fetching chart data:", err);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  // --- Chart Prep (Similar Logic) ---
  const orderMap = new Map();
  orderChartData.forEach((item) => orderMap.set(item.month, item.orders || 0));
  const productMap = new Map();
  productsChartData.forEach((item) => productMap.set(item.month, item.orders || item.count || 0));

  const chartLabels = [];
  const orderValues = [];
  const productValues = [];
  const today = new Date();
  today.setDate(1);

  for (let i = 11; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(today.getMonth() - i);
    chartLabels.push(date);
    const monthNum = date.getMonth() + 1;
    orderValues.push(orderMap.get(monthNum) || 0);
    productValues.push(productMap.get(monthNum) || 0);
  }

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
       mode: 'index',
       intersect: false,
    },
    scales: {
      x: {
        type: "time",
        time: { unit: "month", displayFormats: { month: "MMM" } },
        grid: { display: false },
        ticks: { color: "#9ca3af" }
      },
      y: {
        beginAtZero: true,
        grid: { color: "#f3f4f6" },
        ticks: { stepSize: 1, color: "#9ca3af" }
      },
    },
    plugins: {
       legend: { displayed: false },
    }
  };

  const order_data = {
    labels: chartLabels,
    datasets: [{
        label: "Orders",
        data: orderValues,
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderRadius: 4,
        barThickness: 20,
    }],
  };

  const product_data = {
    labels: chartLabels,
    datasets: [{
        label: "Total Products",
        data: productValues,
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
    }],
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
     <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
           <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
           <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
           <Icon size={24} className="text-white" />
        </div>
     </div>
  );

  return (
    <div className="flex bg-gray-50 min-h-screen">
       <VendorSidebar /> 
       
       <div className="flex-1 p-8 lg:p-12 overflow-x-hidden">
          
          <div className="flex justify-between items-end mb-8">
             <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-500 mt-1">Here is what's happening with your store today.</p>
             </div>
             <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                <Calendar size={16} /> Last 30 Days <Filter size={14} />
             </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
             <StatCard 
                 title="Total Products" 
                 value={stats?.products || 0} 
                 icon={Package} 
                 color="bg-blue-500" 
             />
             <StatCard 
                 title="Total Orders" 
                 value={stats?.orders || 0} 
                 icon={ShoppingCart} 
                 color="bg-orange-500" 
             />
             <StatCard 
                 title="Total Revenue" 
                 value={`₹${stats?.revenue || 0}`} 
                 icon={IndianRupee} 
                 color="bg-green-500" 
             />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             
             {/* Order Bar Chart */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-6">Order Volume</h3>
                <div className="h-[300px]">
                   <Bar data={order_data} options={commonOptions} />
                </div>
             </div>

             {/* Product Line Chart */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-6">Product Growth</h3>
                <div className="h-[300px]">
                   <Line data={product_data} options={commonOptions} />
                </div>
             </div>

          </div>
       </div>
    </div>
  );
}
