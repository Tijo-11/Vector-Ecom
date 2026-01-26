import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import apiInstance from "../../utils/axios";
import { useAuthStore } from "../../store/auth";

export default function Invoice() {
  const { order_oid } = useParams();
  const user = useAuthStore((state) => state.user);

  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user?.user_id || !order_oid) {
        setError("Invalid access or missing order ID");
        setLoading(false);
        return;
      }

      try {
        const response = await apiInstance.get(
          `/customer/order/detail/${user.user_id}/${order_oid}/`,
        );
        const data = response.data;

        // Compute original subtotal (sum of price * qty before any discounts)
        const initialTotal =
          data.orderitem?.reduce(
            (acc, item) =>
              acc + parseFloat(item.price || 0) * parseInt(item.qty || 0),
            0,
          ) || 0;

        // Total saved = offer_saved + coupon_saved (order level)
        const totalSaved =
          parseFloat(data.offer_saved || 0) +
          parseFloat(data.coupon_saved || 0);

        // Sub total after discounts
        const subTotal = initialTotal - totalSaved;

        setOrder({
          full_name: data.full_name || "N/A",
          email: data.email || "N/A",
          mobile: data.mobile || "N/A",
          oid: data.oid || order_oid,
          initial_total: initialTotal,
          shipping_amount: parseFloat(data.shipping_amount || 0),
          saved: totalSaved,
          sub_total: subTotal,
          total: parseFloat(data.total || 0),
        });

        setOrderItems(
          data.orderitem?.map((item) => ({
            product: { title: item.product?.title || "Unknown Product" },
            price: parseFloat(item.price || 0),
            qty: parseInt(item.qty || 0),
            sub_total:
              parseFloat(item.price || 0) * parseInt(item.qty || 0) -
              (parseFloat(item.offer_saved || 0) +
                parseFloat(item.coupon_saved || 0)),
            saved:
              parseFloat(item.offer_saved || 0) +
              parseFloat(item.coupon_saved || 0),
          })) || [],
        );
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [user?.user_id, order_oid]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-lg">Loading invoice...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto mt-10 px-4 text-center">
        <p className="text-red-600 text-xl">{error || "Order not found"}</p>
      </div>
    );
  }

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
                  <td className="p-3 border border-gray-300">
                    ₹{item.price.toFixed(2)}
                  </td>
                  <td className="p-3 border border-gray-300">{item.qty}</td>
                  <td className="p-3 border border-gray-300">
                    ₹{item.sub_total.toFixed(2)}
                  </td>
                  <td className="p-3 border border-gray-300">
                    ₹{item.saved.toFixed(2)}
                  </td>
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
              <b>Original Subtotal: </b> ₹{order.initial_total.toFixed(2)}
            </p>
            <p className="text-sm">
              <b>Saved: </b> ₹{order.saved.toFixed(2)}
            </p>
            <p className="text-sm">
              <b>Subtotal (after discounts): </b> ₹{order.sub_total.toFixed(2)}
            </p>
            <p className="text-sm">
              <b>Shipping: </b> ₹{order.shipping_amount.toFixed(2)}
            </p>
            <p className="text-base font-bold mt-2">
              <b>Grand Total: </b> ₹{order.total.toFixed(2)}
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
