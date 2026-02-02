import { useState, useEffect } from "react";
import apiInstance from "../../../utils/axios";
import moment from "moment";
import Swal from "sweetalert2";
import log from "loglevel";
import StarRating from "../Products/StarRating";

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

  const fetchReviewData = async () => {
    if (product?.id) {
      try {
        const res = await apiInstance.get(`reviews/product/${product.id}/`);
        // Handle both pagination and direct array response
        setReviews(Array.isArray(res.data) ? res.data : res.data.results || []);
      } catch (error) {
        log.error("Error fetching reviews:", error);
      }
    }
  };

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
    if (product?.id) {
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
        Swal.fire({ icon: "success", title: "Review updated successfully!" });
      } else {
        await apiInstance.post(`reviews/product/${product?.id}/`, formdata);
        Swal.fire({ icon: "success", title: "Review submitted successfully!" });
      }

      await fetchReviewData();
      cancelEdit();
    } catch (error) {
      const status = error.response?.status;
      let msg = isEditing ? "Failed to update review" : "Failed to submit review";
      
      if (error.response?.data?.error) {
          msg = error.response.data.error;
      } else if (status === 403) {
          msg = "You can only review products you have purchased.";
      } else if (status === 400) {
          msg = "You have already reviewed this product.";
      }

      Swal.fire({ icon: "error", title: "Error", text: msg });
    }
  };

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
        Swal.fire({ icon: "success", title: "Review deleted successfully!" });
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
      
      {/* Review Form Section */}
      <div className="mb-12">
        {userData?.user_id ? (
          // Logged In
          hasPurchased === null ? (
            <p className="text-gray-500 animate-pulse">Checking eligibility...</p>
          ) : hasPurchased ? (
            // Has Purchased - Show Form/Button
            <>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setShowForm(!showForm)}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-semibold text-lg transition-colors"
                >
                  {showForm ? "Hide Review Form" : "Write a Review"}
                </button>
              )}

              {showForm && (
                <form
                  onSubmit={handleReviewSubmit}
                  className="mt-6 p-6 border rounded-lg bg-gray-50 shadow-sm space-y-6"
                >
                  <div>
                    <label className="block mb-2 font-medium text-lg text-gray-900">
                      Rating <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-4">
                        <select
                        name="rating"
                        onChange={handleReviewChange}
                        value={createReview.rating}
                        required
                        className="w-full md:w-1/3 border border-gray-300 rounded-lg p-3 text-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                        <option value="0">Select rating</option>
                        <option value="1">★ Poor</option>
                        <option value="2">★★ Fair</option>
                        <option value="3">★★★ Good</option>
                        <option value="4">★★★★ Very Good</option>
                        <option value="5">★★★★★ Excellent</option>
                        </select>
                         <div className="hidden md:block">
                             <StarRating rating={Number(createReview.rating)} />
                         </div>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-lg text-gray-900">
                      Your Review <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg p-3 h-32 resize-none focus:ring-blue-500 focus:border-blue-500"
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
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium transition-colors"
                    >
                      {isEditing ? "Update Review" : "Submit Review"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            // Not Purchased
            <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-lg text-yellow-800 font-medium">
                 Verify Purchase to Review
              </p>
              <p className="mt-1 text-yellow-700">
                You can only review products you've purchased and received.
              </p>
            </div>
          )
        ) : (
          // Not Logged In
          <div className="p-8 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <p className="text-lg text-gray-600">
              Please <a href="/login" className="text-blue-600 font-semibold hover:underline">login</a> to write a review.
            </p>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <h3 className="text-xl font-bold mb-6 text-gray-900">Customer Reviews ({reviews.length})</h3>
      
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                 <img
                    src={review.profile?.image || "https://ui-avatars.com/api/?name=" + (review.profile?.full_name || "User") + "&background=random"}
                    alt="User"
                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                 />
                 <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                       <h5 className="font-bold text-gray-900">{review.profile?.full_name || "Anonymous"}</h5>
                       <span className="text-sm text-gray-500">{moment(review.date).format("MMM D, YYYY")}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                       <StarRating rating={review.rating} />
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{review.review}</p>
                 </div>
              </div>

              {isAuthor(review) && (
                <div className="mt-4 flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => startEdit(review)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
           <div className="text-gray-400 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
           </div>
           <p className="text-gray-500 font-medium">No reviews yet.</p>
           <p className="text-sm text-gray-400 mt-1">Be the first to share your thoughts!</p>
        </div>
      )}
    </div>
  );
}
