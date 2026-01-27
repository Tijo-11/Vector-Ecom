// Earning.jsx - Final version with fixed timeline (always last 12 months), correct "Dec 25, Jan 26" format, and robust graph rendering
import React, { useState, useEffect } from "react";
import { IndianRupee } from "lucide-react";
import { Line } from "react-chartjs-2";
import { Chart } from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import "chartjs-adapter-date-fns";
import { format } from "date-fns";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";

// Register zoom plugin
Chart.register(zoomPlugin);

function Earning() {
  const [earningStats, setEarningStats] = useState(null);
  const [earningStatsTracker, setEarningTracker] = useState([]);
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const axios = apiInstance;
  const userData = UserData();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, trackerRes] = await Promise.all([
          axios.get(`vendor-earning/${userData?.vendor_id}/`),
          axios.get(`vendor-monthly-earning/${userData?.vendor_id}/`),
        ]);
        setEarningStats(statsRes.data[0]);
        const trackerData = trackerRes.data || [];
        setEarningTracker(trackerData);
      } catch (err) {
        console.error("Error fetching earning data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Create a map: month number (1-12) → {sales_count, total_earning}
  const dataMap = new Map();
  earningStatsTracker.forEach((item) => {
    dataMap.set(item.month, {
      sales: item.sales_count || 0,
      earning: parseFloat(item.total_earning) || 0,
    });
  });

  // Always generate last 12 months (oldest → newest for chart)
  const today = new Date();
  today.setDate(1); // Start of current month

  const chartLabels = [];
  const revenue = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(today.getMonth() - i);
    chartLabels.push(date);

    const monthNum = date.getMonth() + 1;
    revenue.push(dataMap.get(monthNum)?.earning || 0);
  }

  const revenue_data = {
    labels: chartLabels,
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
          displayFormats: {
            month: "MMM yy",
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

  // Generate table items (newest → oldest, only months with sales > 0, last 12 months)
  const tableItems = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(today);
    date.setMonth(today.getMonth() - i);
    const monthNum = date.getMonth() + 1;
    const info = dataMap.get(monthNum);
    if (info && info.sales > 0) {
      tableItems.push({
        display: format(date, "MMM yy"),
        sales: info.sales,
        earning: info.earning.toFixed(2),
      });
    }
  }

  const fetchReport = async () => {
    const params = { period };
    if (period === "custom" && startDate && endDate) {
      params.start_date = startDate;
      params.end_date = endDate;
    }
    try {
      setReportLoading(true);
      const res = await apiInstance.get(
        `vendor/sales-report/${userData?.vendor_id}/`,
        { params },
      );
      setReportData(res.data);
    } catch (error) {
      console.error("Error fetching sales report:", error);
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const params = { period };
    if (period === "custom" && startDate && endDate) {
      params.start_date = startDate;
      params.end_date = endDate;
    }
    try {
      const res = await apiInstance.get(
        `vendor/sales-report-pdf/${userData?.vendor_id}/`,
        { params, responseType: "blob" },
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "sales_report.pdf";
      link.click();
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const handleDownloadExcel = async () => {
    const params = { period };
    if (period === "custom" && startDate && endDate) {
      params.start_date = startDate;
      params.end_date = endDate;
    }
    try {
      const res = await apiInstance.get(
        `vendor/sales-report-excel/${userData?.vendor_id}/`,
        { params, responseType: "blob" },
      );
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "sales_report.xlsx";
      link.click();
    } catch (error) {
      console.error("Error downloading Excel:", error);
    }
  };

  useEffect(() => {
    if (period !== "custom") {
      fetchReport();
    }
  }, [period]);

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <h4 className="flex items-center text-xl font-semibold mb-6">
          <IndianRupee className="w-6 h-6 mr-2" /> Earning and Revenue
        </h4>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-lg text-gray-600">Loading earnings data...</p>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-green-600 text-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <h6 className="uppercase text-sm font-medium">Total Sales</h6>
                  <IndianRupee className="w-10 h-10 opacity-70" />
                </div>
                <h1 className="text-4xl font-bold mt-3">
                  ₹{(parseFloat(earningStats?.total_revenue) || 0).toFixed(2)}
                </h1>
              </div>
              <div className="bg-red-600 text-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <h6 className="uppercase text-sm font-medium">
                    Monthly Earning
                  </h6>
                  <IndianRupee className="w-10 h-10 opacity-70" />
                </div>
                <h1 className="text-4xl font-bold mt-3">
                  ₹{(parseFloat(earningStats?.monthly_revenue) || 0).toFixed(2)}
                </h1>
              </div>
            </div>

            {/* Revenue Tracker Table - only months with sales, newest first, with MMM yy */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
              <h4 className="text-lg font-semibold mb-4">Revenue Tracker</h4>
              {tableItems.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No revenue data available yet.
                </p>
              ) : (
                <table className="w-full border border-gray-200 text-left">
                  <thead className="bg-gray-900 text-white">
                    <tr>
                      <th className="py-2 px-3">Month</th>
                      <th className="py-2 px-3">Sales</th>
                      <th className="py-2 px-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableItems.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-3">{item.display}</td>
                        <td className="py-2 px-3">{item.sales}</td>
                        <td className="py-2 px-3">₹{item.earning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Revenue Analytics Chart - always shows last 12 months timeline */}
            <div className="bg-white rounded-2xl shadow-md p-6 h-[400px] mb-8">
              <h4 className="text-lg font-semibold mb-4">
                Revenue Analytics (Zoomable)
              </h4>
              <Line data={revenue_data} options={revenue_options} />
            </div>
          </>
        )}

        {/* Sales Report Section */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h4 className="text-lg font-semibold mb-4">Sales Report</h4>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="daily">Daily (1 Day)</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom Date Range</option>
            </select>
            {period === "custom" && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border p-2 rounded"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border p-2 rounded"
                />
              </>
            )}
            <button
              onClick={fetchReport}
              disabled={reportLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded transition"
            >
              {reportLoading ? "Generating..." : "Generate Report"}
            </button>
          </div>

          {reportLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Generating report...</p>
            </div>
          ) : reportData ? (
            <>
              <h5 className="text-md font-medium mb-2">
                Report for {reportData.period}
              </h5>
              <div className="mb-4">
                <p>Orders: {reportData.summary.order_count}</p>
                <p>Items Sold: {reportData.summary.sales_count}</p>
                <p>
                  Total Order Amount: ₹
                  {(parseFloat(reportData.summary.order_amount) || 0).toFixed(
                    2,
                  )}
                </p>
                <p>
                  Total Discount/Coupons: ₹
                  {(parseFloat(reportData.summary.total_discount) || 0).toFixed(
                    2,
                  )}
                </p>
              </div>
              <table className="w-full border border-gray-200 text-left mb-4">
                <thead className="bg-gray-900 text-white">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-3">Qty</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Discount</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-3">{item.order__date__date}</td>
                      <td className="py-2 px-3">{item.product__title}</td>
                      <td className="py-2 px-3">{item.qty}</td>
                      <td className="py-2 px-3">
                        ₹{(parseFloat(item.sub_total) || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3">
                        ₹{(parseFloat(item.saved) || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex gap-4">
                <button
                  onClick={handleDownloadPDF}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition"
                >
                  Download PDF
                </button>
                <button
                  onClick={handleDownloadExcel}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition"
                >
                  Download Excel
                </button>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-10">
              Select a period and generate a report to view details.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Earning;
