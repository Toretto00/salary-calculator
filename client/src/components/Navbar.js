import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            Salary Calculator
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="hover:text-blue-200">
                Dashboard
              </Link>
              <Link to="/employees" className="hover:text-blue-200">
                Employees
              </Link>
              <Link to="/salary" className="hover:text-blue-200">
                Salary
              </Link>
              <Link to="/reports" className="hover:text-blue-200">
                Reports
              </Link>
              <div className="border-l border-blue-500 pl-4">
                <span className="mr-2">{user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 bg-blue-800 hover:bg-blue-900 rounded-md ml-2"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1 bg-blue-800 hover:bg-blue-900 rounded-md"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
