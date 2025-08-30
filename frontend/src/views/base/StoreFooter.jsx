import React from "react";

function StoreFooter() {
  return (
    <footer className="bg-gray-100 text-gray-800">
      {/* Top Section */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Social Row */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-300 pb-6 mb-6">
          <p className="font-semibold text-center md:text-left mb-4 md:mb-0">
            Get connected with us on social networks
          </p>
          <div className="flex space-x-3">
            {/* Facebook */}
            <a
              href="#!"
              className="w-9 h-9 flex items-center justify-center rounded-full text-white"
              style={{ backgroundColor: "#3b5998" }}
            >
              <i className="fab fa-facebook-f" />
            </a>
            {/* Twitter */}
            <a
              href="#!"
              className="w-9 h-9 flex items-center justify-center rounded-full text-white"
              style={{ backgroundColor: "#55acee" }}
            >
              <i className="fab fa-twitter" />
            </a>
            {/* Pinterest */}
            <a
              href="#!"
              className="w-9 h-9 flex items-center justify-center rounded-full text-white"
              style={{ backgroundColor: "#c61118" }}
            >
              <i className="fab fa-pinterest" />
            </a>
            {/* YouTube */}
            <a
              href="#!"
              className="w-9 h-9 flex items-center justify-center rounded-full text-white"
              style={{ backgroundColor: "#ed302f" }}
            >
              <i className="fab fa-youtube" />
            </a>
            {/* Instagram */}
            <a
              href="#!"
              className="w-9 h-9 flex items-center justify-center rounded-full text-white"
              style={{ backgroundColor: "#ac2bac" }}
            >
              <i className="fab fa-instagram" />
            </a>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Us */}
          <div>
            <h3 className="font-semibold mb-3">About us</h3>
            <p className="text-sm leading-relaxed text-gray-600">
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Iste
              atque ea quis molestias. Fugiat pariatur maxime quis culpa
              corporis vitae repudiandae aliquam voluptatem veniam, est atque
              cumque eum delectus sint!
            </p>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="font-semibold mb-3">Useful links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#!" className="hover:text-blue-600">
                  Privacy policy
                </a>
              </li>
              <li>
                <a href="#!" className="hover:text-blue-600">
                  Media
                </a>
              </li>
              <li>
                <a href="#!" className="hover:text-blue-600">
                  Job offers
                </a>
              </li>
              <li>
                <a href="#!" className="hover:text-blue-600">
                  Cooperation
                </a>
              </li>
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-3">Products</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#!" className="hover:text-blue-600">
                  Electronics
                </a>
              </li>
              <li>
                <a href="#!" className="hover:text-blue-600">
                  Fashion
                </a>
              </li>
              <li>
                <a href="#!" className="hover:text-blue-600">
                  Beauty
                </a>
              </li>
              <li>
                <a href="#!" className="hover:text-blue-600">
                  Automotive
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-3">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#!" className="hover:text-blue-600">
                  Complaints
                </a>
              </li>
              <li>
                <a href="#!" className="hover:text-blue-600">
                  Help center
                </a>
              </li>
              <li>
                <a href="#!" className="hover:text-blue-600">
                  Community
                </a>
              </li>
              <li>
                <a href="#!" className="hover:text-blue-600">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-gray-200 text-center py-4 text-sm text-gray-700">
        © 2025 Copyright:{" "}
        <a href="#" className="font-medium hover:text-blue-600">
          Tijo Thomas
        </a>
      </div>
    </footer>
  );
}

export default StoreFooter;
