import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCircle,
  LayoutDashboard,
  Users,
  Calculator,
  BarChart,
  X,
} from "lucide-react";

const Sidebar = ({
  collapsed = false,
  toggleSidebar,
  mobile = false,
  onClose,
}) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    if (mobile && onClose) {
      onClose();
    }
  };

  // Navigation items
  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Employees",
      path: "/employees",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Salary",
      path: "/salary",
      icon: <Calculator className="h-5 w-5" />,
    },
    {
      name: "Reports",
      path: "/reports",
      icon: <BarChart className="h-5 w-5" />,
    },
  ];

  // Check if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="h-full flex flex-col bg-background border-r">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b">
        <Link
          to="/"
          className={`flex items-center text-primary ${
            collapsed && !mobile ? "justify-center" : ""
          }`}
        >
          <Calculator className="h-6 w-6 flex-shrink-0" />
          {(!collapsed || mobile) && (
            <span className="ml-2 font-bold text-lg">Salary App</span>
          )}
        </Link>

        {/* Close button for mobile */}
        {mobile && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}

        {/* Toggle button for desktop */}
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="flex-shrink-0"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="px-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-3 rounded-md transition-colors ${
                isActive(item.path)
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              } ${collapsed && !mobile ? "justify-center" : ""}`}
              onClick={mobile && onClose ? onClose : undefined}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              {(!collapsed || mobile) && (
                <span className="ml-3">{item.name}</span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* User info and logout */}
      <div className="border-t p-4">
        {(!collapsed || mobile) && (
          <div className="mb-4 px-2">
            <div className="flex items-center">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
              <span className="ml-2 text-sm font-medium truncate">
                {user?.username}
              </span>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className={`w-full flex items-center ${
            collapsed && !mobile ? "justify-center px-0" : ""
          }`}
        >
          <LogOut className="h-4 w-4" />
          {(!collapsed || mobile) && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
