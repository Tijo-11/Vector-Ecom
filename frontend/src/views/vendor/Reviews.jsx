import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, Eye, MessageSquare, ChevronLeft, ChevronRight, User } from "lucide-react";

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";
import log from "loglevel";

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);

  const axios = apiInstance;
  const userData = UserData();

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const vendorId = userData?.vendor_id;

  const getFullUrl = (page) => {
    const baseUrl = `vendor-reviews/${vendorId}/`;
    if (page <= 1) return baseUrl;
    return `${baseUrl}?page=${page}`;
  };

  const loadReviews = async (page = currentPage) => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const fullUrl = getFullUrl(page);
      const response = await axios.get(fullUrl);
      const data = response.data;
      const reviewList = Array.isArray(data) ? data : data.results || [];
      const count = data.count ?? reviewList.length;
      const next = data.next ?? null;
      const prev = data.previous ?? null;

      setReviews(reviewList);
      setTotalCount(count);
      setHasNext(!!next);
      setHasPrev(!!prev);
      setCurrentPage(page);
    } catch (error) {
      log.error("Error fetching reviews:", error);
      setReviews([]);
      setTotalCount(0);
      setHasNext(false);
      setHasPrev(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews(1);
  }, [vendorId]);

  useEffect(() => {
    loadReviews(currentPage);
  }, [currentPage]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, idx) => (
      <Star
        key={idx}
        size={16}
        className={idx < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}
      />
    ));
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <div className="flex-1 p-8 lg:p-12 overflow-x-hidden">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Star className="w-7 h-7 text-yellow-500" />
            Reviews & Ratings
          </h1>
          <p className="text-gray-500 mt-1">View and respond to customer reviews.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-yellow-500 mb-4"></div>
            <p className="text-gray-500">Loading reviews...</p>
          </div>
        ) : (
          <>
            {/* Stats Card */}
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-lg p-6 text-white mb-8 max-w-md relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10">
                <Star className="w-32 h-32 -mr-8 -mt-8" />
              </div>
              <div className="relative z-10">
                <p className="text-yellow-100 font-medium uppercase tracking-wider text-sm">Total Reviews</p>
                <h2 className="text-4xl font-bold mt-2">{totalCount}</h2>
              </div>
            </div>

            {/* Reviews Grid */}
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* User Avatar */}
                      <div className="flex-shrink-0">
                        <img
                          src={review.profile.image || "https://via.placeholder.com/80?text=User"}
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                          alt={`${review.profile.full_name}'s avatar`}
                        />
                      </div>
                      
                      {/* Review Content */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className="font-semibold text-gray-900">{review.profile.full_name}</span>
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                            <span className="ml-2 text-sm text-gray-500">({review.rating}/5)</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{review.review}</p>
                        
                        {review.reply && (
                          <div className="bg-gray-50 rounded-xl p-4 mt-3 border-l-4 border-blue-500">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium text-blue-600">Your reply:</span> {review.reply}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                          <span className="text-sm text-gray-500">
                            Product: <span className="font-medium text-gray-700">{review?.product?.title || "N/A"}</span>
                          </span>
                          <Link
                            to={`/vendor/reviews/${review.id}/`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline ml-auto"
                          >
                            <Eye size={16} />
                            View & Reply
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                  <MessageSquare size={48} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No reviews yet</p>
                  <p className="text-gray-400 text-sm mt-1">Customer reviews will appear here.</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalCount > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center py-6 mt-6">
                <p className="text-sm text-gray-600 mb-3 sm:mb-0">
                  Page {currentPage} of {Math.ceil(totalCount / 10) || 1} ({totalCount} reviews)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={!hasPrev || loading}
                    className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={!hasNext || loading}
                    className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Reviews;

