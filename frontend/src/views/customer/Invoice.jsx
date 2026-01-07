import { useState, useEffect } from "react";

export default function Invoice() {
  const [order, setOrder] = useState({
    full_name: "John Doe",
    email: "john@example.com",
    mobile: "+91 9876543210",
    oid: "ORD-2024-001",
    initial_total: 5000,
    shipping_amount: 100,
    saved: 500,
    sub_total: 4500,
    total: 4600,
  });

  const [orderItems, setOrderItems] = useState([
    {
      product: { title: "Vintage Camera" },
      price: 2500,
      qty: 1,
      sub_total: 2500,
      saved: 250,
    },
    {
      product: { title: "Retro Radio" },
      price: 2500,
      qty: 1,
      sub_total: 2500,
      saved: 250,
    },
  ]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Invoice Container */}
      <div
        id="invoice-section"
        style={{
          backgroundColor: "#ffffff",
          color: "#000000",
        }}
        className="w-full md:w-2/3 lg:w-1/2 mx-auto shadow-lg rounded-xl p-6"
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
                <th className="p-3 border border-gray-300">Product</th>
                <th className="p-3 border border-gray-300">Price</th>
                <th className="p-3 border border-gray-300">Qty</th>
                <th className="p-3 border border-gray-300">Sub Total</th>
                <th className="p-3 border border-gray-300">Saved</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item, id) => (
                <tr key={id} className="border border-gray-300">
                  <td className="p-3 border border-gray-300">
                    {item.product?.title}
                  </td>
                  <td className="p-3 border border-gray-300">₹{item.price}</td>
                  <td className="p-3 border border-gray-300">{item.qty}</td>
                  <td className="p-3 border border-gray-300">
                    ₹{item.sub_total}
                  </td>
                  <td className="p-3 border border-gray-300">-₹{item.saved}</td>
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
      </div>
      {/* Print Button outside the printable area */}
      <div className="flex justify-center mt-4 print:hidden">
        <button
          onClick={handlePrint}
          id="printButton"
          style={{ backgroundColor: "#1f2937" }}
          className="text-white px-6 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
        >
          <i className="fas fa-print" />
          Download Invoice
        </button>
      </div>
      {/* Print CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-section,
          #invoice-section * {
            visibility: visible;
          }
          #invoice-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            margin: 0;
            box-shadow: none;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
