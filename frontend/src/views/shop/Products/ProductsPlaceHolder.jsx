export default function ProductsPlaceholder() {
  return (
    <div className="container p-6 animate-pulse">
      <h1 className="text-5xl text-center font-bold mb-10">Products</h1>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="sr-only">Products</h2>

        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="group block border rounded-lg shadow-sm overflow-hidden"
            >
              {/* Product image placeholder */}
              <div className="w-full h-64 bg-gray-300 rounded-lg"></div>

              {/* Product title */}
              <div className="mt-4 h-4 bg-gray-300 rounded w-3/4"></div>

              {/* Price section */}
              <div className="flex items-center gap-2 mt-3">
                <div className="h-4 bg-gray-300 rounded w-16"></div>
                <div className="h-5 bg-gray-300 rounded w-20"></div>
              </div>

              {/* Rating placeholder */}
              <div className="mt-2 h-3 bg-gray-300 rounded w-12"></div>

              {/* Buttons */}
              <div className="mt-4 flex flex-col gap-2">
                <div className="h-10 bg-gray-300 rounded w-full"></div>
                <div className="h-10 bg-gray-300 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
