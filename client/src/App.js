import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./hooks/use-toast";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Salary from "./pages/Salary";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import ChangePassword from "./pages/ChangePassword";
import Attendance from "./pages/Attendance";
import EmployeeProfile from "./pages/EmployeeProfile";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes with dashboard layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/salary" element={<Salary />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/users" element={<Users />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/attendance" element={<Attendance />} />
              </Route>
            </Route>

            {/* Role-protected routes */}
            <Route element={<RoleProtectedRoute allowedRoles={["user"]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="/profile" element={<EmployeeProfile />} />
              </Route>
            </Route>

            {/* Redirect to login or dashboard based on auth status */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
