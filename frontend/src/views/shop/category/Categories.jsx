import { Link } from "react-router-dom";

export default function Categories({ categories }) {
  return (
    <div className="mt-6 ml-8">
      <h2 className="text-xl font-bold mb-4">Categories</h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
        {categories.map((cat) => (
          <div key={cat.id} className="flex-shrink-0 w-40 cursor-pointer group">
            <div className="relative h-24 w-40 rounded-full overflow-hidden">
              <Link to={`/category/${cat.slug}`}>
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </Link>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-700 text-center">
              {cat.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
