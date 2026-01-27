import { useState, useEffect } from "react";
import {
  Grid,
  ShoppingCart,
  Users,
  IndianRupee,
  Eye,
  Edit,
  Trash,
  LineChart,
} from "lucide-react";
import VendorSidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import { Bar } from "react-chartjs-2";
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

  // Create maps: month (1-12) → value
  const orderMap = new Map();
  orderChartData.forEach((item) => {
    orderMap.set(item.month, item.orders || 0);
  });

  const productMap = new Map();
  productsChartData.forEach((item) => {
    // Assuming the field is "orders" or "count" – adjust if backend uses different key
    productMap.set(item.month, item.orders || item.count || 0);
  });

  // Generate last 12 months (oldest → newest)
  const today = new Date();
  today.setDate(1); // Start of current month (Jan 2026)

  const chartLabels = [];
  const orderValues = [];
  const productValues = [];

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
    scales: {
      x: {
        type: "time",
        time: {
          unit: "month",
          displayFormats: {
            month: "MMM yy", // Jan 26, Dec 25, etc.
          },
        },
        title: {
          display: true,
          text: "Timeline",
        },
        ticks: {
          color: "#555",
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: "#555",
        },
      },
    },
    plugins: {
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: "x",
        },
        pan: {
          enabled: true,
          mode: "x",
        },
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            return format(tooltipItems[0].parsed.x, "MMM yy");
          },
        },
      },
    },
  };

  const order_data = {
    labels: chartLabels,
    datasets: [
      {
        label: "Total Orders",
        data: orderValues,
        backgroundColor: "rgba(59, 130, 246, 0.6)", // blue-ish
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  };

  const product_data = {
    labels: chartLabels,
    datasets: [
      {
        label: "Total Products",
        data: productValues,
        backgroundColor: "rgba(34, 197, 94, 0.6)", // green-ish
        borderColor: "rgb(34, 197, 94)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="flex h-full">
      <VendorSidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div className="bg-green-500 text-white rounded-2xl shadow-lg p-6 flex flex-col">
            <div className="self-end opacity-30">
              <Grid size={64} />
            </div>
            <h6 className="uppercase tracking-wider text-sm font-medium">
              Products
            </h6>
            <h1 className="text-4xl font-bold mt-2">{stats?.products || 0}</h1>
          </div>

          <div className="bg-red-500 text-white rounded-2xl shadow-lg p-6 flex flex-col">
            <div className="self-end opacity-30">
              <ShoppingCart size={64} />
            </div>
            <h6 className="uppercase tracking-wider text-sm font-medium">
              Orders
            </h6>
            <h1 className="text-4xl font-bold mt-2">{stats?.orders || 0}</h1>
          </div>

          <div className="bg-yellow-500 text-white rounded-2xl shadow-lg p-6 flex flex-col">
            <div className="self-end opacity-30">
              <IndianRupee size={64} />
            </div>
            <h6 className="uppercase tracking-wider text-sm font-medium">
              Revenue
            </h6>
            <h1 className="text-4xl font-bold mt-2">₹{stats?.revenue || 0}</h1>
          </div>
        </div>

        <hr className="my-8 border-gray-300" />

        {/* Chart Section */}
        <div className="space-y-12">
          <div>
            <h2 className="text-xl font-semibold text-center mb-6">
              Order Analytics
            </h2>
            <div className="bg-white rounded-2xl shadow-lg p-6 h-[400px]">
              <Bar data={order_data} options={commonOptions} />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-center mb-6">
              Product Analytics
            </h2>
            <div className="bg-white rounded-2xl shadow-lg p-6 h-[400px]">
              <Bar data={product_data} options={commonOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
