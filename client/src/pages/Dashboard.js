import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Salary Calculator Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            Welcome, <span className="font-medium">{user?.username}</span>
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card hover:shadow-md transition-shadow">
          <h2 className="text-xl font-bold mb-4">Employees</h2>
          <p className="text-gray-600 mb-4">
            Manage employee information, add new employees, or update existing
            records.
          </p>
          <Link
            to="/employees"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Manage Employees
          </Link>
        </div>

        <div className="card hover:shadow-md transition-shadow">
          <h2 className="text-xl font-bold mb-4">Salary Calculations</h2>
          <p className="text-gray-600 mb-4">
            Calculate salaries, view past calculations, and export salary
            reports.
          </p>
          <Link
            to="/salary"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Manage Salaries
          </Link>
        </div>

        <div className="card hover:shadow-md transition-shadow">
          <h2 className="text-xl font-bold mb-4">Reports</h2>
          <p className="text-gray-600 mb-4">
            Generate and export salary reports in Excel format for accounting
            purposes.
          </p>
          <Link
            to="/reports"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            View Reports
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
