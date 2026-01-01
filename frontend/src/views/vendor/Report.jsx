import React, { useState, useEffect } from "react";
import { LineChart, Download } from "lucide-react";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";

function Reports() {
  const [report, setReport] = useState({ summary: {}, items: [] });
  const [filters, setFilters] = useState({ period: "monthly" });

  const fetchReport = async () => {
    const params = new URLSearchParams(filters);
    const res = await apiInstance.get(
      `vendor/sales-report/${UserData()?.vendor_id}/?${params}`
    );
    setReport(res.data);
  };

  useEffect(() => {
    fetchReport();
  }, [filters]);

  const handleDownload = (type) => {
    const params = new URLSearchParams(filters);
    window.location.href = `/api/vendor/sales-report-${type}/${
      UserData()?.vendor_id
    }/?${params}`;
  };

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 p-6">
        <h4 className="text-xl font-semibold mb-6 flex items-center">
          <LineChart className="w-6 h-6 mr-2" /> Sales Reports
        </h4>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.period}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  period: e.target.value,
                  start_date: "",
                  end_date: "",
                })
              }
              className="border rounded px-3 py-2"
            >
              <option value="daily">Today</option>
              <option value="weekly">Last 7 Days</option>
              <option value="monthly">Last 30 Days</option>
              <option value="yearly">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
            {filters.period === "custom" && (
              <>
                <input
                  type="date"
                  onChange={(e) =>
                    setFilters({ ...filters, start_date: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                />
                <input
                  type="date"
                  onChange={(e) =>
                    setFilters({ ...filters, end_date: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                />
              </>
            )}
            <button
              onClick={fetchReport}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-600 text-white rounded-2xl shadow p-6">
            <h6>Total Orders</h6>
            <h1 className="text-3xl">{report.summary.order_count}</h1>
          </div>
          <div className="bg-blue-600 text-white rounded-2xl shadow p-6">
            <h6>Items Sold</h6>
            <h1 className="text-3xl">{report.summary.sales_count}</h1>
          </div>
          <div className="bg-purple-600 text-white rounded-2xl shadow p-6">
            <h6>Total Revenue</h6>
            <h1 className="text-3xl">₹{report.summary.order_amount}</h1>
          </div>
          <div className="bg-red-600 text-white rounded-2xl shadow p-6">
            <h6>Total Discount/Coupons</h6>
            <h1 className="text-3xl">₹{report.summary.total_discount}</h1>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => handleDownload("pdf")}
            className="bg-red-600 text-white px-4 py-2 rounded flex items-center"
          >
            <Download className="mr-2" /> Download PDF
          </button>
          <button
            onClick={() => handleDownload("excel")}
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center"
          >
            <Download className="mr-2" /> Download Excel
          </button>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-xl shadow p-6">
          <h5 className="font-semibold mb-4">
            Detailed Sales ({report.period})
          </h5>
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-left">Product</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Discount</th>
              </tr>
            </thead>
            <tbody>
              {report.items.map((item, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2 px-4">{item.order__date__date}</td>
                  <td className="py-2 px-4">{item.product__title}</td>
                  <td>{item.qty}</td>
                  <td>₹{item.sub_total}</td>
                  <td className="text-red-600">-₹{item.saved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default Reports;
