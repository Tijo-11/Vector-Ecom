export default function ProductDetailPlaceholder() {
  return (
    <div className="container mx-auto py-8 animate-pulse">
      {/* animate-pulse — applies a subtle pulsing animation (fading in and out) to indicate loading or attention. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="w-full h-96 bg-gray-300 rounded-lg">
          <div>
            <div className="h-8 bg-gray-300 rounded mb-4 w-3/4"> </div>
            <div className="h-6 bg-gray-300 rounded mb-4 w-1/2"> </div>
            <div className="h-4 bg-gray-300 rounded mb-6 w-full"> </div>
            <div className="h-10 bg-gray-300 rounded w-32"> </div>
          </div>
        </div>
        <div className="mt-8">
          <div className="h-6 bg-gray 300 rounded mb-4 w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="border rounded-lg shadow-lg 
overflow-hidden"
              >
                <div className="w-full h-48 bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-4"></div>
                  <div className="h-8 bg-gray-300 rounded w-32"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
