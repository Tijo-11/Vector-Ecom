// Earning.jsx - Improved UI with proper sidebar spacing and better styling
import React, { useState, useEffect } from "react";
import { IndianRupee, TrendingUp, Calendar, FileText, Download, RefreshCw } from "lucide-react";
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
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderColor: "#3b82f6",
        pointBackgroundColor: "#3b82f6",
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
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
        grid: { display: false },
        ticks: { color: "#9ca3af" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#f3f4f6" },
        ticks: { color: "#9ca3af" },
      },
    },
    plugins: {
      legend: { display: false },
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
          label: (context) => `₹${context.parsed.y.toLocaleString('en-IN')}`,
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
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8 lg:p-12 overflow-x-hidden">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <IndianRupee className="w-7 h-7 text-green-600" />
            Earnings & Revenue
          </h1>
          <p className="text-gray-500 mt-1">Track your sales performance and download reports.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-lg text-gray-600">Loading earnings data...</p>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10">
                  <IndianRupee className="w-32 h-32 -mr-8 -mt-8" />
                </div>
                <div className="relative z-10">
                  <p className="text-green-100 font-medium uppercase tracking-wider text-sm flex items-center gap-2">
                    <TrendingUp size={16} /> Total Sales
                  </p>
                  <h2 className="text-4xl font-bold mt-3 tracking-tight">
                    ₹{(parseFloat(earningStats?.total_revenue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </h2>
                  <p className="text-green-100 text-sm mt-2">All time revenue</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10">
                  <Calendar className="w-32 h-32 -mr-8 -mt-8" />
                </div>
                <div className="relative z-10">
                  <p className="text-blue-100 font-medium uppercase tracking-wider text-sm flex items-center gap-2">
                    <Calendar size={16} /> Monthly Earning
                  </p>
                  <h2 className="text-4xl font-bold mt-3 tracking-tight">
                    ₹{(parseFloat(earningStats?.monthly_revenue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </h2>
                  <p className="text-blue-100 text-sm mt-2">Last 30 days</p>
                </div>
              </div>
            </div>

            {/* Revenue Analytics Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-600" />
                Revenue Analytics
                <span className="text-xs text-gray-400 font-normal ml-2">(Scroll to zoom)</span>
              </h3>
              <div className="h-[300px]">
                <Line data={revenue_data} options={revenue_options} />
              </div>
            </div>

            {/* Revenue Tracker Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={20} className="text-gray-400" />
                  Revenue Tracker
                </h3>
              </div>
              {tableItems.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  No revenue data available yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                      <tr>
                        <th className="px-6 py-4 text-left">Month</th>
                        <th className="px-6 py-4 text-left">Sales</th>
                        <th className="px-6 py-4 text-left">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tableItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{item.display}</td>
                          <td className="px-6 py-4 text-gray-600">{item.sales} items</td>
                          <td className="px-6 py-4 font-semibold text-green-600">₹{parseFloat(item.earning).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Sales Report Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <FileText size={20} className="text-gray-400" />
              Sales Report
            </h3>
          </div>
          
          <div className="p-6">
            {/* Report Controls */}
            <div className="flex flex-wrap gap-4 mb-6">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
                    className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </>
              )}
              
              <button
                onClick={fetchReport}
                disabled={reportLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              >
                {reportLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Report"
                )}
              </button>
            </div>

            {reportLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Generating report...</p>
              </div>
            ) : reportData ? (
              <>
                {/* Report Summary */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Report for {reportData.period}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Orders</p>
                      <p className="text-lg font-bold text-gray-900">{reportData.summary.order_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Items Sold</p>
                      <p className="text-lg font-bold text-gray-900">{reportData.summary.sales_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Total Amount</p>
                      <p className="text-lg font-bold text-green-600">
                        ₹{(parseFloat(reportData.summary.order_amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Discounts</p>
                      <p className="text-lg font-bold text-orange-600">
                        ₹{(parseFloat(reportData.summary.total_discount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Report Table */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                      <tr>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-right">Discount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {reportData.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-600">{item.order__date__date}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{item.product__title}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{item.qty}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            ₹{(parseFloat(item.sub_total) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right text-orange-600">
                            ₹{(parseFloat(item.saved) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Download Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadPDF}
                    className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                  >
                    <Download size={16} />
                    Download PDF
                  </button>
                  <button
                    onClick={handleDownloadExcel}
                    className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                  >
                    <Download size={16} />
                    Download Excel
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                <p>Select a period and generate a report to view details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Earning;

