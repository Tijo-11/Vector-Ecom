import React, { useState, useEffect } from "react";
import { IndianRupee } from "lucide-react";
import { Line } from "react-chartjs-2";
import { Chart } from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import "chartjs-adapter-date-fns";

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";

// Register zoom plugin
Chart.register(zoomPlugin);

function Earning() {
  const [earningStats, setEarningStats] = useState(null);
  const [earningStatsTracker, setEarningTracker] = useState([]);
  const [earningChartData, setEarningChartData] = useState(null);

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const axios = apiInstance;
  const userData = UserData();

  useEffect(() => {
    const fetEarningStats = async () => {
      axios.get(`vendor-earning/${userData?.vendor_id}/`).then((res) => {
        setEarningStats(res.data[0]);
      });

      axios
        .get(`vendor-monthly-earning/${userData?.vendor_id}/`)
        .then((res) => {
          setEarningTracker(res.data);
          setEarningChartData(res.data);
        });
    };
    fetEarningStats();
  }, []);

  const months = earningChartData?.map((item) => item.month);
  const revenue = earningChartData?.map((item) => item.total_earning);

  const revenue_data = {
    labels: months?.map(
      (m) =>
        [
          "2023-01-01",
          "2023-02-01",
          "2023-03-01",
          "2023-04-01",
          "2023-05-01",
          "2023-06-01",
          "2023-07-01",
          "2023-08-01",
          "2023-09-01",
          "2023-10-01",
          "2023-11-01",
          "2023-12-01",
        ][m - 1]
    ), // date-like labels for zoom
    datasets: [
      {
        label: "Revenue",
        data: revenue,
        fill: true,
        backgroundColor: "rgba(98, 3, 252, 0.1)",
        borderColor: "#6203fc",
        pointBackgroundColor: "#6203fc",
        tension: 0.3,
      },
    ],
  };

  const revenue_options = {
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
        ticks: {
          color: "#555",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Revenue (₹)",
        },
        ticks: {
          color: "#555",
        },
      },
    },
    plugins: {
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: "x", // zooms x-axis
        },
        pan: {
          enabled: true,
          mode: "x", // pans horizontally
        },
      },
    },
  };

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 p-6">
        <h4 className="flex items-center text-xl font-semibold mb-6">
          <IndianRupee className="w-6 h-6 mr-2" /> Earning and Revenue
        </h4>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-green-600 text-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <h6 className="uppercase text-sm font-medium">Total Sales</h6>
              <IndianRupee className="w-10 h-10 opacity-70" />
            </div>
            <h1 className="text-4xl font-bold mt-3">
              ₹{earningStats?.total_revenue || "0.00"}
            </h1>
          </div>
          <div className="bg-red-600 text-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <h6 className="uppercase text-sm font-medium">Monthly Earning</h6>
              <IndianRupee className="w-10 h-10 opacity-70" />
            </div>
            <h1 className="text-4xl font-bold mt-3">
              ₹{earningStats?.monthly_revenue || "0.00"}
            </h1>
          </div>
        </div>

        {/* Revenue Tracker Table */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <h4 className="text-lg font-semibold mb-4">Revenue Tracker</h4>
          <table className="w-full border border-gray-200 text-left">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="py-2 px-3">Month</th>
                <th className="py-2 px-3">Sales</th>
                <th className="py-2 px-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {earningStatsTracker?.map((earning, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2 px-3">
                    {
                      [
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ][earning.month - 1]
                    }
                  </td>
                  <td className="py-2 px-3">{earning.sales_count}</td>
                  <td className="py-2 px-3">
                    ₹{earning.total_earning.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Revenue Analytics Chart with Zoom */}
        <div className="bg-white rounded-2xl shadow-md p-6 h-[400px]">
          <h4 className="text-lg font-semibold mb-4">
            Revenue Analytics (Zoomable)
          </h4>
          <Line data={revenue_data} options={revenue_options} />
        </div>
      </div>
    </div>
  );
}

export default Earning;
