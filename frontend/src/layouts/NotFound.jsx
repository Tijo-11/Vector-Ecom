import { Link } from "react-router-dom";

export default function NotFund() {
  return (
    <div className="min-h-screen flex items-center  justify-center bg-gray-100">
      {/*  A full-height flex container that, takes at least the full height of the viewport (min-h-screen)
       centers its children both vertically (items-center) and horizontally (justify-center)*/}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          {" "}
          404 Page Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          Sorry, the page you are looking for does not exist.
        </p>
        <Link
          to="/"
          className="bg
            blue-600 text-white py-2 px-4 rounded 
            hover:bg-blue-700"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
