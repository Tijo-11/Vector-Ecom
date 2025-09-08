import { useState, useEffect } from "react";
import apiInstance from "../../../utils/axios";
import moment from "moment"; //📅 Imports Moment.js, a JavaScript library for parsing, validating, manipulating,
//  and formatting dates and times.
import Swal from "sweetalert2";
//
export default function Review({ product, userData }) {
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [createReview, setCreateReview] = useState({
    user_id: 0,
    product_id: product?.product_id || 0,
    review: "",
    rating: 0,
  });
  // Fetch all reviews
  const fetchReviewData = async () => {
    if (product?.id) {
      try {
        const res = await apiInstance.get(`reviews/${product.id}/`);
        setReviews(res.data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    }
  };
  useEffect(() => {
    //At first render, product is still {} (empty object from useState({}) in ProductDetail),
    // so product?.id is undefined. That builds a URL like:
    if (product && product.id) {
      fetchReviewData();
    }
  }, [product]);

  // Handle input change
  //Updates review state dynamically Copies existing createReview state and updates the field matching
  //  e.target.name with its new value from e.target.value. Useful for handling multiple form inputs with
  // one function.
  //e.target.name: The name attribute of the input element that triggered the event. It tells which
  // field (e.g., "title", "comment") is being updated.
  //e.target.value: The current value entered in that input field.
  const handleReviewChange = (e) => {
    setCreateReview({
      ...createReview,
      [e.target.name]: e.target.value,
    });
    // console.log(createReview);
  };
  /* Axios is a third-party library that simplifies HTTP requests with features like automatic JSON parsing, 
request/response interceptors, and built-in support for timeouts and cancellation. It works in both browsers 
and Node.js, making it versatile for frontend and backend use. In contrast, Fetch is a native browser API 
that requires manual handling of JSON responses and errors, and lacks some of Axios’s advanced features like 
interceptors and progress tracking. While Fetch is lightweight and built-in, Axios offers more convenience 
and abstraction for complex request handling. */

  //handleSubmit
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const formdata = new FormData(); //Creates a browser-native object to build key–value pairs for form
    // submission, especially useful for sending files. Automatically formats data as multipart/form-data,
    //  which is required for file uploads and complex form data in HTTP requests.
    formdata.append("user_id", userData?.user_id);
    formdata.append("product_id", product?.id);
    formdata.append("rating", createReview.rating);
    formdata.append("review", createReview.review);
    try {
      await apiInstance.post(`reviews/${product?.id}/`, formdata);
      fetchReviewData();
      Swal.fire({
        icon: "success",
        title: "Review created successfully",
      });
      setCreateReview({ ...createReview, review: "", rating: 0 });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to submit review",
      });
    }
  };
  return (
    <div className="container mx-auto mt-8">
      <h3 className="text-2xl font-semibold mb-6">Reviews</h3>

      {/* Create Review Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {userData?.user_id ? (
            <>
              {/* Collapsible Banner */}
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
              >
                {showForm ? "Hide Review Form" : "Add a Review"}
              </button>

              {showForm && (
                <form
                  onSubmit={handleReviewSubmit}
                  className="space-y-4 mt-4 p-4 border rounded-lg bg-gray-50 shadow"
                >
                  <div>
                    <label className="block mb-2 font-medium">Rating</label>
                    <select
                      name="rating"
                      onChange={handleReviewChange}
                      value={createReview.rating}
                      className="w-full border rounded-lg p-2"
                    >
                      <option value="0">Select rating</option>
                      <option value="1">★</option>
                      <option value="2">★★</option>
                      <option value="3">★★★</option>
                      <option value="4">★★★★</option>
                      <option value="5">★★★★★</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 font-medium">Review</label>
                    <textarea
                      className="w-full border rounded-lg p-2"
                      rows="4"
                      name="review"
                      value={createReview.review}
                      onChange={handleReviewChange}
                      placeholder="Write your review"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Submit Review
                  </button>
                </form>
              )}
            </>
          ) : (
            <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold">
              Login to add a review
            </button>
          )}
        </div>
      </div>

      {/* Display Reviews */}
      <div>
        {reviews.length > 0 ? (
          <>
            <h2 className="text-xl font-bold mb-4">All Reviews</h2>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white shadow rounded-lg p-4 flex space-x-4"
                >
                  <div className="flex-shrink-0">
                    <img
                      src={review.profile?.image}
                      alt="User"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h5 className="font-semibold">
                      {review.profile?.full_name}
                    </h5>
                    <p className="text-sm text-gray-500">
                      {moment(review.date).format("MM/DD/YYYY")}
                    </p>
                    <p className="mt-2">{review.review}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <h2 className="text-lg text-gray-600">No Reviews Yet</h2>
        )}
      </div>
    </div>
  );
}
