import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, Eye } from "lucide-react";

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

  // Construct full URL with optional page param
  const getFullUrl = (page) => {
    const baseUrl = `vendor-reviews/${vendorId}/`;
    if (page <= 1) return baseUrl;
    return `${baseUrl}?page=${page}`;
  };

  // Load reviews with pagination support
  const loadReviews = async (page = currentPage) => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const fullUrl = getFullUrl(page);
      const response = await axios.get(fullUrl);

      // Handle paginated response safely
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

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <h4 className="flex items-center text-xl font-semibold mb-6">
          <Star className="w-6 h-6 mr-2 text-yellow-500" /> Reviews and Rating
        </h4>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-lg text-gray-600">Loading reviews...</p>
          </div>
        ) : (
          <section className="p-6 rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 shadow-md">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-5xl">
                {reviews.length > 0 ? (
                  <>
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-white shadow-md rounded-xl p-6 mb-4"
                      >
                        <div className="flex flex-col md:flex-row items-center md:items-start">
                          <img
                            src={
                              review.profile.image ||
                              "https://via.placeholder.com/160?text=No+Image"
                            }
                            className="rounded-full shadow-md w-40 h-40 object-cover mb-4 md:mb-0"
                            alt={`${review.profile.full_name}'s avatar`}
                          />
                          <div className="md:ml-6 flex-1">
                            <p className="text-gray-800 mb-2">
                              <b>Review:</b> {review.review}
                            </p>
                            <p className="text-gray-800 mb-2">
                              <b>Reply:</b>{" "}
                              {review.reply === null || review.reply === "" ? (
                                <span className="ml-2 text-gray-500">
                                  No Response
                                </span>
                              ) : (
                                <span className="ml-2">{review.reply}</span>
                              )}
                            </p>
                            <p className="text-gray-800 mb-2">
                              <strong>Name:</strong> {review.profile.full_name}
                            </p>
                            <p className="text-gray-800 mb-2">
                              <b>Product:</b> {review?.product?.title || "N/A"}
                            </p>
                            <p className="text-gray-800 mb-2 flex items-center">
                              Rating:
                              <span className="ml-2 mr-2">{review.rating}</span>
                              {Array.from(
                                { length: review.rating },
                                (_, idx) => (
                                  <Star
                                    key={idx}
                                    className="w-5 h-5 text-yellow-500 fill-yellow-500"
                                  />
                                ),
                              )}
                            </p>
                            <div className="mt-3">
                              <Link
                                to={`/vendor/reviews/${review.id}/`}
                                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow transition"
                              >
                                <Eye className="w-5 h-5 mr-2" /> View Review
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Pagination Controls */}
                    {totalCount > reviews.length && (
                      <div className="flex justify-center items-center mt-8 gap-6">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={!hasPrev || loading}
                          className="px-6 py-3 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                        >
                          Previous
                        </button>

                        <span className="text-lg font-medium">
                          Page {currentPage} ({totalCount} total reviews)
                        </span>

                        <button
                          onClick={() => setCurrentPage((prev) => prev + 1)}
                          disabled={!hasNext || loading}
                          className="px-6 py-3 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700 transition"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <h5 className="mt-4 p-3 text-center text-gray-600 text-lg">
                    No reviews yet
                  </h5>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default Reviews;
