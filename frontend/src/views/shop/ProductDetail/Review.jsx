import { useState, useEffect } from "react";
import apiInstance from "../../../utils/axios";
import moment from "moment";
import Swal from "sweetalert2";
import log from "loglevel";

export default function Review({ product, userData }) {
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [createReview, setCreateReview] = useState({
    review: "",
    rating: 0,
  });

  // Fetch all reviews - UPDATED URL
  const fetchReviewData = async () => {
    if (product?.id) {
      try {
        const res = await apiInstance.get(`reviews/product/${product.id}/`);
        setReviews(res.data);
      } catch (error) {
        log.error("Error fetching reviews:", error);
      }
    }
  };

  // Check if user has purchased the product
  const checkPurchaseStatus = async () => {
    if (!userData?.user_id || !product?.id) {
      setHasPurchased(false);
      return;
    }

    try {
      const res = await apiInstance.get(`product/${product.id}/has-purchased/`);
      setHasPurchased(res.data.has_purchased);
    } catch (error) {
      log.error("Error checking purchase status:", error);
      setHasPurchased(false);
    }
  };

  useEffect(() => {
    if (product && product.id) {
      fetchReviewData();
      checkPurchaseStatus();
    }
  }, [product, userData]);

  const handleReviewChange = (e) => {
    setCreateReview({
      ...createReview,
      [e.target.name]: e.target.value,
    });
  };

  const startEdit = (review) => {
    setIsEditing(true);
    setEditingReviewId(review.id);
    setCreateReview({
      review: review.review,
      rating: review.rating,
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingReviewId(null);
    setCreateReview({ review: "", rating: 0 });
    setShowForm(false);
  };

  // Handle Submit (Create or Update) - UPDATED POST URL for create
  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (createReview.rating === 0) {
      Swal.fire({
        icon: "info",
        title: "Select Rating",
        text: "Please select a star rating before submitting.",
      });
      return;
    }

    const formdata = new FormData();
    formdata.append("rating", createReview.rating);
    formdata.append("review", createReview.review);

    try {
      if (isEditing) {
        await apiInstance.patch(`reviews/${editingReviewId}/`, formdata);
        Swal.fire({
          icon: "success",
          title: "Review updated successfully!",
        });
      } else {
        // UPDATED: New endpoint for create/list
        await apiInstance.post(`reviews/product/${product?.id}/`, formdata);
        Swal.fire({
          icon: "success",
          title: "Review submitted successfully!",
        });
      }

      await fetchReviewData();
      cancelEdit();
    } catch (error) {
      let errorMessage = isEditing
        ? "Failed to update review"
        : "Failed to submit review";

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      if (error.response?.status === 403) {
        errorMessage = "You can only review products you have purchased.";
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response.data.error ||
          "You have already reviewed this product.";
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
      });
    }
  };

  // Handle Delete (unchanged - uses detail endpoint)
  const handleDelete = async (reviewId) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete Review?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it",
    });

    if (confirm.isConfirmed) {
      try {
        await apiInstance.delete(`reviews/${reviewId}/`);
        await fetchReviewData();
        Swal.fire({
          icon: "success",
          title: "Review deleted successfully!",
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Failed to delete review",
          text: error.response?.data?.error || "An error occurred",
        });
      }
    }
  };

  const isAuthor = (review) => review.user_id === userData?.user_id;

  return (
    <div className="container mx-auto mt-8">
      <h3 className="text-2xl font-semibold mb-6">Reviews</h3>

      {/* Review Form */}
      <div className="mb-12">
        {userData?.user_id ? (
          hasPurchased === null ? (
            <p className="text-gray-600">Checking eligibility...</p>
          ) : hasPurchased ? (
            <>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setShowForm(!showForm)}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-semibold text-lg"
                >
                  {showForm ? "Hide Review Form" : "Write a Review"}
                </button>
              )}

              {showForm && (
                <form
                  onSubmit={handleReviewSubmit}
                  className="mt-6 p-6 border rounded-lg bg-gray-50 shadow-lg space-y-6"
                >
                  <div>
                    <label className="block mb-2 font-medium text-lg">
                      Rating <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="rating"
                      onChange={handleReviewChange}
                      value={createReview.rating}
                      required
                      className="w-full border rounded-lg p-3 text-lg"
                    >
                      <option value="0">Select rating</option>
                      <option value="1">★ Poor</option>
                      <option value="2">★★ Fair</option>
                      <option value="3">★★★ Good</option>
                      <option value="4">★★★★ Very Good</option>
                      <option value="5">★★★★★ Excellent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-lg">
                      Your Review <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="w-full border rounded-lg p-3 h-40 resize-none"
                      name="review"
                      value={createReview.review}
                      onChange={handleReviewChange}
                      placeholder="Share your experience with this product..."
                      required
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
                    >
                      {isEditing ? "Update Review" : "Submit Review"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="p-6 bg-yellow-50 border border-yellow-300 rounded-lg">
              <p className="text-lg text-gray-800">
                <strong>Note:</strong> You can only review products you have
                purchased and received.
              </p>
              <p className="mt-2 text-gray-600">
                Once your order is delivered, you'll be able to share your
                feedback here.
              </p>
            </div>
          )
        ) : (
          <div className="p-6 bg-gray-100 border rounded-lg text-center">
            <p className="text-lg text-gray-700">
              Please{" "}
              <a
                href="/login"
                className="text-blue-600 underline hover:text-blue-800"
              >
                login
              </a>{" "}
              to write a review.
            </p>
          </div>
        )}
      </div>

      {/* Display Reviews */}
      <div>
        {reviews.length > 0 ? (
          <>
            <h2 className="text-xl font-bold mb-6">
              Customer Reviews ({reviews.length})
            </h2>
            <div className="space-y-8">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white shadow-lg rounded-lg p-6 border flex space-x-6 relative"
                >
                  <div className="flex-shrink-0">
                    <img
                      src={review.profile?.image || "/default-avatar.png"}
                      alt="Reviewer"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-lg">
                        {review.profile?.full_name || "Anonymous"}
                      </h5>
                      <p className="text-sm text-gray-500">
                        {moment(review.date).format("MMMM Do, YYYY")}
                      </p>
                    </div>
                    <div className="flex items-center mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill={i < review.rating ? "currentColor" : "none"}
                          stroke="currentColor"
                          className="w-5 h-5 text-yellow-500"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ))}
                      <span className="ml-2 text-gray-600">
                        {review.rating} out of 5
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {review.review}
                    </p>
                  </div>

                  {/* Edit / Delete Buttons - Only for Author */}
                  {isAuthor(review) && (
                    <div className="absolute top-4 right-4 flex gap-3">
                      <button
                        onClick={() => startEdit(review)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <h2 className="text-2xl font-medium text-gray-600 mb-4">
              No Reviews Yet
            </h2>
            <p className="text-gray-500">
              {userData?.user_id && hasPurchased
                ? "Be the first to review this product!"
                : "Reviews will appear here once customers share their experience."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
