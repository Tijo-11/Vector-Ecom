// Invoice.jsx (Consistent display: Original Subtotal, Saved, Subtotal, Shipping, Grand Total)
import { useState, useEffect, useRef } from "react";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import moment from "moment";
import { Link, useParams } from "react-router-dom";
import html2pdf from "html2pdf.js";

export default function Invoice() {
  const [order, setOrder] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const axios = apiInstance;
  const userData = UserData();
  const param = useParams();
  const invoiceRef = useRef();
  useEffect(() => {
    axios
      .get(`customer/order/detail/${userData?.user_id}/${param?.order_oid}`)
      .then((res) => {
        setOrder(res.data);
        setOrderItems(res.data.orderitem);
        if (order) {
          setLoading(false);
        }
      });
  }, []);
  const handlePrint = () => {
    if (!invoiceRef.current) return;
    const element = invoiceRef.current;
    const options = {
      margin: 0.5,
      filename: `invoice-${order?.oid || "order"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(options).from(element).save();
  };
  return (
    <div className="flex justify-center p-4">
      {/* Invoice Container */}
      <div
        ref={invoiceRef}
        // ✅ Force safe HEX/RGB colors here so html2pdf works
        style={{
          backgroundColor: "#ffffff",
          color: "#000000",
        }}
        className="w-full md:w-2/3 lg:w-1/2 shadow-lg rounded-xl p-6"
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          {/* Company Info */}
          <div className="flex flex-col">
            <img
              src="https://img.freepik.com/free-vector/bird-colorful-logo-gradient-vector_343694-1365.jpg"
              alt="Logo"
              className="w-20 h-20 object-cover rounded-full"
            />
            <div className="mt-2">
              <h5 className="text-xl font-semibold">
                RetroRelics<span style={{ color: "#fbbf24" }}>.</span>
              </h5>
              <p className="text-sm mt-1">📞 +91 1234567890</p>
              <p className="text-sm">✉ retrorelics@example.com</p>
              <p className="text-sm">📍 123 Main Street</p>
            </div>
          </div>
          {/* Customer Info */}
          <div className="text-right">
            <h5 className="text-lg font-semibold">Customer Details</h5>
            <p className="text-sm">👤 {order.full_name}</p>
            <p className="text-sm">✉ {order.email}</p>
            <p className="text-sm">📞 {order.mobile}</p>
            <div className="mt-3">
              <h6 className="font-medium">INVOICE ID: {order.oid}</h6>
            </div>
          </div>
        </div>
        {/* Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm text-left">
            <thead style={{ backgroundColor: "#f3f4f6", color: "#374151" }}>
              <tr>
                <th className="p-3 border">Product</th>
                <th className="p-3 border">Price</th>
                <th className="p-3 border">Qty</th>
                <th className="p-3 border">Sub Total</th>
                <th className="p-3 border">Saved</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item, id) => (
                <tr key={id} className="border">
                  <td className="p-3 border">{item.product?.title}</td>
                  <td className="p-3 border">₹{item.price}</td>
                  <td className="p-3 border">{item.qty}</td>
                  <td className="p-3 border">₹{item.sub_total}</td>
                  <td className="p-3 border">-₹{item.saved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Summary */}
        <div className="mt-6 flex flex-col md:flex-row justify-between">
          <div></div>
          <div className="text-right">
            <h5 className="text-lg font-semibold">Summary</h5>
            <p className="text-sm">
              <b>Original Subtotal: </b> ₹
              {order.initial_total - order.shipping_amount}
            </p>
            <p className="text-sm">
              <b>Saved: </b> -₹{order.saved}
            </p>
            <p className="text-sm">
              <b>Subtotal (after discounts): </b> ₹{order.sub_total}
            </p>
            <p className="text-sm">
              <b>Shipping: </b> ₹{order.shipping_amount}
            </p>
            <p className="text-base font-bold mt-2">
              <b>Grand Total: </b> ₹{order.total}
            </p>
          </div>
        </div>
        <hr className="my-6" />
        {/* Print Button */}
        <div className="flex justify-center">
          <button
            onClick={handlePrint}
            id="printButton"
            style={{ backgroundColor: "#1f2937" }}
            className="text-white px-6 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
          >
            <i className="fas fa-print" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
