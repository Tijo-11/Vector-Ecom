export default function RelatedProducts({ related }) {
  return (
    <div className="mt-12">
      <h3 className="text-2xl font-semibold mb-6">Related Products</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {/* {related?.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <img
              src={item.img}
              alt={item.name}
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <h4 className="font-semibold">{item.name}</h4>
              <p className="text-gray-600">{item.price}</p>
            </div>
          </div>
        ))} */}
      </div>
    </div>
  );
}
