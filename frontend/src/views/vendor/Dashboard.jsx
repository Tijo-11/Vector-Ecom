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
import { Line, Bar } from "react-chartjs-2";
import { Chart } from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import "chartjs-adapter-date-fns";
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
    const order_response = await apiInstance.get(
      `vendor-orders-report-chart/${UserData()?.vendor_id}/`,
    );
    const product_response = await apiInstance.get(
      `vendor-products-report-chart/${UserData()?.vendor_id}/`,
    );
    setOrderChartData(order_response?.data);
    setProductsChartData(product_response?.data);
  };
  useEffect(() => {
    fetchChartData();
  }, []);
  const order_months = orderChartData?.map((item) => item.month);
  const order_count = orderChartData?.map((item) => item.orders);

  const products_months = productsChartData?.map((item) => item.month);
  const products_counts = productsChartData?.map((item) => item.orders);
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "time", // enables time-based zooming
        time: {
          unit: "month", // default view
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
          wheel: {
            enabled: true, // Zoom with mouse wheel
          },
          pinch: {
            enabled: true, // Zoom with pinch on touch devices
          },
          mode: "x", // Zoom only on X axis
          limits: {
            x: { min: "day", max: "year" }, // zoom boundaries
          },
        },
        pan: {
          enabled: true,
          mode: "x", // Pan horizontally
        },
      },
    },
  };

  const order_data = {
    labels: order_months,
    datasets: [
      {
        label: "Total Orders",
        data: order_count,
        fill: true,
        backgroundColor: "green",
        borderColor: "blue",
      },
    ],
  };
  const product_data = {
    labels: products_months,
    datasets: [
      {
        label: "Total Productss",
        data: products_counts,
        fill: true,
        backgroundColor: "green",
        borderColor: "blue",
      },
    ],
  };

  return (
    <div className="w-full px-4" id="main">
      <div className="flex flex-row h-full">
        <div className="w-full" id="main">
          <div className="flex h-full">
            <VendorSidebar />
            <div className="flex-1 mt-4 px-4">
              {/* Stats cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-500 text-white rounded-xl shadow p-4 flex flex-col items-start">
                  <div className="self-end opacity-20">
                    <Grid size={64} />
                  </div>
                  <h6 className="uppercase tracking-wide text-sm">Products</h6>
                  <h1 className="text-4xl font-bold">{stats?.products}</h1>
                </div>

                <div className="bg-red-500 text-white rounded-xl shadow p-4 flex flex-col items-start">
                  <div className="self-end opacity-20">
                    <ShoppingCart size={64} />
                  </div>
                  <h6 className="uppercase tracking-wide text-sm">Orders</h6>
                  <h1 className="text-4xl font-bold">{stats?.orders}</h1>
                </div>

                {/* <div className="bg-sky-500 text-white rounded-xl shadow p-4 flex flex-col items-start">
                  <div className="self-end opacity-20">
                    <Users size={64} />
                  </div>
                  <h6 className="uppercase tracking-wide text-sm">Customers</h6>
                  <h1 className="text-4xl font-bold">125</h1>
                </div> */}

                <div className="bg-yellow-500 text-white rounded-xl shadow p-4 flex flex-col items-start">
                  <div className="self-end opacity-20">
                    <IndianRupee size={24} />
                  </div>
                  <h6 className="uppercase tracking-wide text-sm">Revenue</h6>
                  <h1 className="text-4xl font-bold">₹{stats?.revenue}</h1>
                </div>
              </div>

              <hr className="my-6" />

              {/* Chart Section */}
              <div className="mb-6">
                <div className="flex justify-center items-center mb-3">
                  <h2 className="text-lg font-semibold">Chart Analytics</h2>
                </div>
                <div className="bg-white rounded-xl shadow p-4 h-[350px] w-[75%] mx-auto my-4">
                  <Bar data={order_data} options={commonOptions} />
                </div>

                <div className="bg-white rounded-xl shadow p-4 h-[350px] w-[75%] mx-auto my-4">
                  <Bar data={product_data} options={commonOptions} />
                </div>
              </div>

              <a id="layouts" />
              <hr className="my-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
