import React, { useState, useEffect } from "react";
import { Tag, Trash, Plus } from "lucide-react";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";

function Offers() {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    discount_percentage: "",
    start_date: "",
    end_date: "",
    product_ids: [],
  });

  const fetchData = async () => {
    const resOffers = await apiInstance.get(
      `vendor/offers/${UserData()?.vendor_id}/`
    );
    const resProducts = await apiInstance.get(
      `vendor/products/${UserData()?.vendor_id}/`
    );
    setOffers(resOffers.data);
    setProducts(resProducts.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await apiInstance.post(`vendor/offers/${UserData()?.vendor_id}/`, {
      discount_percentage: formData.discount_percentage,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      is_active: true,
      product_ids: formData.product_ids,
    });
    fetchData();
    setFormData({
      discount_percentage: "",
      start_date: "",
      end_date: "",
      product_ids: [],
    });
  };

  const handleDelete = async (id) => {
    await apiInstance.delete(`vendor/offers/${UserData()?.vendor_id}/${id}/`);
    fetchData();
  };

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 p-6">
        <h4 className="text-xl font-semibold mb-6 flex items-center">
          <Tag className="mr-2" /> Manage Product Offers
        </h4>

        {/* Create Offer Form */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="number"
                placeholder="Discount %"
                value={formData.discount_percentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount_percentage: e.target.value,
                  })
                }
                required
                className="border rounded px-3 py-2"
              />
              <input
                type="datetime-local"
                placeholder="Start Date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                required
                className="border rounded px-3 py-2"
              />
              <input
                type="datetime-local"
                placeholder="End Date (optional)"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                className="border rounded px-3 py-2"
              />
            </div>
            <div className="mb-4">
              <select
                multiple
                className="border rounded px-3 py-2 w-full h-32"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    product_ids: Array.from(
                      e.target.selectedOptions,
                      (o) => o.value
                    ),
                  })
                }
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500">
                Hold Ctrl/Cmd to select multiple products
              </p>
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded flex items-center"
            >
              <Plus className="mr-2" /> Create Offer
            </button>
          </form>
        </div>

        {/* Offers List */}
        <div className="bg-white rounded-xl shadow p-6">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 text-left">Discount</th>
                <th>Products</th>
                <th>Dates</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id}>
                  <td className="py-2 px-4">{offer.discount_percentage}%</td>
                  <td>{offer.products.length} products</td>
                  <td>
                    {offer.start_date} → {offer.end_date || "No end"}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(offer.id)}
                      className="text-red-600"
                    >
                      <Trash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default Offers;
