import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Star, Reply, Send } from "lucide-react";

import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import Sidebar from "./Sidebar";

function ReviewDetail() {
  const [review, setReview] = useState([]);
  const [updateReviews, setUpdateReviews] = useState({ reply: "" });
  const [showReplyBox, setShowReplyBox] = useState(false);

  if (UserData()?.vendor_id === 0) {
    window.location.href = "/vendor/register/";
  }

  const axios = apiInstance;
  const userData = UserData();
  const params = useParams();

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `vendor-reviews/${userData?.vendor_id}/${params.id}`
      );
      setReview(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReplyChange = (event) => {
    setUpdateReviews({
      ...updateReviews,
      [event.target.name]: event.target.value,
    });
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    const formdata = new FormData();
    formdata.append("reply", updateReviews.reply);

    await axios
      .patch(`vendor-reviews/${userData?.vendor_id}/${review.id}/`, formdata)
      .then((res) => {
        console.log(res.data);
        fetchData();
        setUpdateReviews({ reply: "" });
        setShowReplyBox(false);
      });
  };

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 p-6">
        <h4 className="flex items-center text-xl font-semibold mb-6">
          <Star className="w-6 h-6 mr-2 text-yellow-500" /> Review Details
        </h4>

        <section className="p-6 rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 shadow-md">
          <div className="flex flex-col items-center">
            <div className="w-full max-w-5xl">
              <div className="bg-white shadow-md rounded-xl p-6">
                <div className="flex flex-col md:flex-row items-center md:items-start">
                  <img
                    src={review?.profile?.image}
                    className="rounded-full shadow-md w-40 h-40 object-cover mb-4 md:mb-0"
                    alt="profile avatar"
                  />
                  <div className="md:ml-6 flex-1">
                    <p className="text-gray-800 mb-2">
                      <b>Review:</b> {review?.review}
                    </p>
                    <p className="text-gray-800 mb-2">
                      <b>Reply:</b>{" "}
                      {review?.reply === null ? (
                        <span className="ml-2 text-gray-500">No Response</span>
                      ) : (
                        <span className="ml-2">{review.reply}</span>
                      )}
                    </p>
                    <p className="text-gray-800 mb-2">
                      <strong>Name:</strong> {review?.profile?.full_name}
                    </p>
                    <p className="text-gray-800 mb-2">
                      <b>Product:</b> {review?.product?.title}
                    </p>
                    <p className="text-gray-800 mb-2 flex items-center">
                      Rating:
                      <span className="ml-2 mr-2">{review?.rating}</span>
                      {Array.from({ length: review?.rating || 0 }).map(
                        (_, idx) => (
                          <Star
                            key={idx}
                            className="w-5 h-5 text-yellow-500 fill-yellow-500"
                          />
                        )
                      )}
                    </p>

                    {/* Reply Section */}
                    <div className="mt-4">
                      <button
                        onClick={() => setShowReplyBox(!showReplyBox)}
                        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow"
                      >
                        <Reply className="w-5 h-5 mr-2" /> Reply
                      </button>

                      {showReplyBox && (
                        <form
                          onSubmit={handleReplySubmit}
                          method="POST"
                          className="mt-3 flex"
                        >
                          <input
                            onChange={handleReplyChange}
                            value={updateReviews.reply}
                            type="text"
                            name="reply"
                            placeholder="Write Reply..."
                            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                          <button
                            type="submit"
                            className="ml-2 flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg shadow"
                          >
                            <Send className="w-5 h-5 mr-1" /> Send
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ReviewDetail;
