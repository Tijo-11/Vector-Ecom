export default function PlaceholderContainer() {
  return (
    <>
      <div
        className="border rounded-lg 
            shadow-lg overflow-hidden animate-pulse"
      >
        <div className="w-full h-48 bg-gray-300"></div>
        <div className="p-4">
          <div className="h-6 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded mb-4"></div>
          <div className="h-8 bg-gray-300 rounded w-32"></div>
        </div>
      </div>
    </>
  );
}

// Production build - env vars from Azure
