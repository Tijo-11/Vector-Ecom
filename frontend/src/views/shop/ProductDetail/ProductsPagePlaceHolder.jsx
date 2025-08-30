export default function ProductsPagePlaceholder() {
  return (
    <div className="container mx-auto py-8 animate-pulse">
      {/* animate-pulse — applies a subtle pulsing animation (fading in and out) to indicate loading or attention. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="w-full h-96 bg-gray-300 rounded-lg">
          {/* rounded-lg — gives the element large rounded corners for a smoother, softer look. */}
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
            {/* grid — enables CSS grid layout */}
            {/* grid-cols-1 — 1 column by default

sm:grid-cols-2 — 2 columns on small screens

md:grid-cols-3 — 3 columns on medium screens

lg:grid-cols-4 — 4 columns on large screens

gap-6 — sets uniform spacing between grid items */}
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
            {/* Array.from({ length: 4 }) — creates an array with 4 undefined item 
            (_, i) — ignores the item, uses index i
            key={i} — assigns a unique key for React rendering optimization
            overflow-hidden — clips child content that overflows the element’s boundaries*/}
          </div>
        </div>
      </div>
    </div>
  );
}
