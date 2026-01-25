// Earning.jsx (fixed formatting errors)
import React, { useState, useEffect } from "react";
import { IndianRupee, Loader2 } from "lucide-react";
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
        setEarningTracker(trackerRes.data);
        setEarningChartData(trackerRes.data);
      } catch (err) {
        console.error("Error fetching earning data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const months = earningChartData?.map((item) => item.month);
  const revenue = earningChartData?.map(
    (item) => parseFloat(item.total_earning) || 0,
  );

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
        ][m - 1],
    ),
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
          mode: "x",
        },
        pan: {
          enabled: true,
          mode: "x",
        },
      },
    },
  };

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
          <div className="flex flex-col justify-center items-center h-full min-h-[400px]">
            <Loader2 className="animate-spin text-purple-600" size={48} />
            <p className="mt-4 text-lg text-gray-600">
              Loading earnings data...
            </p>
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

            {/* Revenue Tracker Table */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
              <h4 className="text-lg font-semibold mb-4">Revenue Tracker</h4>
              {earningStatsTracker.length === 0 ? (
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
                    {earningStatsTracker.map((earning, index) => (
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
                          ₹{(parseFloat(earning.total_earning) || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Revenue Analytics Chart with Zoom */}
            <div className="bg-white rounded-2xl shadow-md p-6 h-[400px] mb-8">
              <h4 className="text-lg font-semibold mb-4">
                Revenue Analytics (Zoomable)
              </h4>
              {earningChartData && earningChartData.length > 0 ? (
                <Line data={revenue_data} options={revenue_options} />
              ) : (
                <p className="text-center text-gray-500 py-20">
                  No chart data available.
                </p>
              )}
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
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin text-blue-600" size={36} />
              <p className="ml-4 text-gray-600">Generating report...</p>
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
