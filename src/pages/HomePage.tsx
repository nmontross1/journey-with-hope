import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "./Layout";
import { FiMenu } from "react-icons/fi";

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Layout>
      <div className="flex min-h-[60vh] relative">
        {/* Hamburger Button */}
        <div className="fixed top-4 left-4 z-30">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-indigo-700 text-3xl p-2 hover:bg-indigo-100 rounded"
            aria-label="Toggle menu"
          >
            <FiMenu />
          </button>
        </div>

        {/* Sidebar Menu */}
        {menuOpen && (
          <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-20 flex flex-col pt-20 px-6 space-y-4 border-r border-gray-200">
            <Link
              to="/shop"
              className="text-gray-700 hover:text-indigo-600 transition font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Shop
            </Link>
            <Link
              to="/book-an-appoitment"
              className="text-gray-700 hover:text-indigo-600 transition font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Book an Appointment
            </Link>
            <Link
              to="/locations"
              className="text-gray-700 hover:text-indigo-600 transition font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Locations
            </Link>
            <Link
              to="/contact"
              className="text-gray-700 hover:text-indigo-600 transition font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </Link>
          </div>
        )}

        {/* Main Content */}
        <div
          className={`flex-1 flex flex-col items-center justify-center text-center px-4 w-full transition-all duration-300 ${
            menuOpen ? "pl-72" : ""
          }`}
        >
          <img src="images/05166FD6-F9D2-4532-A6B2-6E353F7A7081.png" alt="" />

          <p className="text-lg text-gray-700 mb-8 max-w-2xl">
            Discover healing through spiritual guidance and wellness tools.
          </p>

          <Link
            to="/dashboard"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Create your account
          </Link>
        </div>
      </div>
    </Layout>
  );
}
