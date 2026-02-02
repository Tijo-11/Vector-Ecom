import { Star, StarHalf, StarOff } from "lucide-react";
const StarRating = ({ rating }) => {
  const maxStars = 5;
  const fullStars = Math.floor(rating || 0);
  const hasHalfStar = rating && rating % 1 >= 0.3 && rating % 1 <= 0.7;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center space-x-1 text-yellow-500 text-sm">
      {[...Array(fullStars)].map((_, index) => (
        <Star key={`full-${index}`} size={16} fill="currentColor" />
      ))}
      {hasHalfStar && <StarHalf size={16} fill="currentColor" />}
      {[...Array(emptyStars)].map((_, index) => (
        <Star key={`empty-${index}`} size={16} className="text-gray-300" />
      ))}
      {rating ? (
        <span className="ml-1">{rating.toFixed(1)}</span>
      ) : (
        <span className="ml-1">0.0</span>
      )}
    </div>
  );
};
export default StarRating;
