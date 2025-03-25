import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";

// Import icons from lucide-react
import {
  Menu,
  X,
  UserCircle,
  LogOut,
  LayoutDashboard,
  Users,
  Calculator,
  BarChart,
} from "lucide-react";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Navigation items
  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5 mr-2" />,
    },
    {
      name: "Employees",
      path: "/employees",
      icon: <Users className="h-5 w-5 mr-2" />,
    },
    {
      name: "Salary",
      path: "/salary",
      icon: <Calculator className="h-5 w-5 mr-2" />,
    },
    {
      name: "Reports",
      path: "/reports",
      icon: <BarChart className="h-5 w-5 mr-2" />,
    },
  ];

  // Check if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-background border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="text-xl font-bold text-primary hover:text-primary/90 transition-colors"
          >
            Salary Calculator
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-2 py-1 rounded-md transition-colors ${
                    isActive(item.path)
                      ? "text-primary font-medium bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </div>
          )}

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <UserCircle className="h-5 w-5" />
                  <span>{user?.username}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button asChild>
                <Link to="/login">Login</Link>
              </Button>
            )}

            {/* Mobile Menu Button */}
            {isAuthenticated && (
              <button
                className="md:hidden rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isAuthenticated && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <button
                className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
                onClick={closeMobileMenu}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </button>
            </SheetHeader>
            <div className="mt-6 flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center p-2 rounded-md ${
                    isActive(item.path)
                      ? "text-primary font-medium bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                  onClick={closeMobileMenu}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
              <div className="pt-6 mt-6 border-t">
                <div className="flex items-center mb-4 text-muted-foreground">
                  <UserCircle className="h-5 w-5 mr-2" />
                  <span>{user?.username}</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </nav>
  );
};

export default Navbar;
