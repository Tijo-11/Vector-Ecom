import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiInstance from "../../../utils/axios"; // adjust path if needed

export default function Category() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiInstance.get("category/");
        setCategories(res.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          Explore All Categories
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Discover every vintage treasure category we offer.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex flex-col items-center animate-pulse">
              <div className="w-32 h-32 bg-gray-200 rounded-full mb-4" />
              <div className="h-5 bg-gray-200 rounded w-28" />
            </div>
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {categories.map((cat) => (
            <Link
              key={cat.id || cat.slug}
              to={`/category/${cat.slug}`}
              className="group flex flex-col items-center text-center space-y-4"
            >
              <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-300 ring-4 ring-transparent group-hover:ring-blue-100">
                <img
                  src={cat.image || "https://via.placeholder.com/150"}
                  alt={cat.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
              </div>
              <span className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors text-lg">
                {cat.title}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-xl text-gray-500">No categories available yet.</p>
        </div>
      )}
    </div>
  );
}
