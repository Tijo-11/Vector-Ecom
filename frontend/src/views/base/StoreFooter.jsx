import React, { useState, useEffect } from "react";
import apiInstance from "../../utils/axios";
import { Link } from "react-router-dom";
import { 
  Facebook, Twitter, Youtube, Instagram, 
  MapPin, Mail, Phone, ChevronRight, Heart
} from "lucide-react";

function StoreFooter() {
  const [categories, setCategories] = useState([]);
  
  useEffect(() => {
    // Ideally limit categories to top 5-6 for footer to avoid massive lists
    apiInstance.get(`category/`).then((response) => {
      setCategories(response.data.slice(0, 6)); 
    });
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 border-t border-gray-800 text-gray-400 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Brand & About */}
          <div className="space-y-6">
            <Link to="/" className="inline-block">
              <span className="text-2xl font-black bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                RetroRelics
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              Discover unique vintage treasures and timeless relics. We curate stories, not just stuff. Join our community of collectors today.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="p-2 bg-gray-800 hover:bg-blue-600 hover:text-white rounded-full transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 bg-gray-800 hover:bg-sky-500 hover:text-white rounded-full transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 bg-gray-800 hover:bg-pink-600 hover:text-white rounded-full transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="p-2 bg-gray-800 hover:bg-red-600 hover:text-white rounded-full transition-colors">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-6">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/about" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                  <ChevronRight className="h-3 w-3" /> About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                  <ChevronRight className="h-3 w-3" /> Contact
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                  <ChevronRight className="h-3 w-3" /> Careers
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                  <ChevronRight className="h-3 w-3" /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                  <ChevronRight className="h-3 w-3" /> Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-6">Top Categories</h3>
            <ul className="space-y-3 text-sm">
              {categories.map((cat, index) => (
                <li key={index}>
                  <Link 
                    to={`/category/${cat.slug}`} 
                    className="hover:text-blue-500 transition-colors flex items-center gap-2 truncate"
                  >
                    <ChevronRight className="h-3 w-3" /> {cat.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/category" className="text-blue-500 hover:text-blue-400 text-xs font-semibold uppercase tracking-wider mt-2 inline-block">
                  View All Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
             <h3 className="text-white font-semibold mb-6">Stay Connected</h3>
             <ul className="space-y-4 text-sm mb-6">
               <li className="flex items-start gap-3">
                 <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                 <span>123 Vintage Lane, Retro City,<br/>RC 56789</span>
               </li>
               <li className="flex items-center gap-3">
                 <Phone className="h-5 w-5 text-gray-500" />
                 <span>+1 (555) 123-4567</span>
               </li>
               <li className="flex items-center gap-3">
                 <Mail className="h-5 w-5 text-gray-500" />
                 <span>support@retrorelics.com</span>
               </li>
             </ul>
             
             {/* Simple input field for aesthetics */}
             <div className="relative">
               <input 
                 type="email" 
                 placeholder="Enter your email" 
                 className="w-full bg-gray-800 text-white text-sm rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700 placeholder-gray-500"
               />
               <button className="absolute right-1.5 top-1.5 p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                 <ChevronRight className="h-4 w-4" />
               </button>
             </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © {currentYear} RetroRelics. All rights reserved. Built by <span className="text-gray-300">Tijo Thomas</span>.
          </p>
          <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
             <span className="flex items-center gap-1">Made with <Heart className="h-3 w-3 text-red-500 fill-current" /></span>
             {/* Payment Icons Placeholder - can replace with images later if needed */}
             <div className="flex gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
                {/* SVG Placeholders or Pay icons could go here */}
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default StoreFooter;
