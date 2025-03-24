import React, { createContext, useState, useContext, useEffect } from "react";
import { authService } from "../api/api";

// Create context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const checkLoggedIn = async () => {
      setLoading(true);
      try {
        if (authService.isAuthenticated()) {
          const userData = authService.getUser();
          setUser(userData);

          // Verify with the server
          try {
            await authService.checkAuth();
          } catch (error) {
            console.error("Session validation error:", error);
            // If server validation fails, log out
            await authService.logout();
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthError("Failed to verify authentication status");
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login function
  const login = async (username, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authService.login(username, password);
      setUser(data.user);
      return data;
    } catch (error) {
      console.error("Login error:", error);
      setAuthError(
        error.response?.data?.message || "Failed to login. Please try again."
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Setup inactivity timer for automatic logout
  useEffect(() => {
    let inactivityTimer;

    // Reset the timer on any user activity
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      // Set timeout for 1 hour of inactivity
      inactivityTimer = setTimeout(() => {
        if (user) {
          console.log("Logging out due to inactivity");
          logout();
        }
      }, 60 * 60 * 1000); // 1 hour
    };

    // Only setup timer if user is logged in
    if (user) {
      // Initialize timer
      resetTimer();

      // Add event listeners for user activity
      const events = [
        "mousedown",
        "mousemove",
        "keypress",
        "scroll",
        "touchstart",
      ];
      events.forEach((event) => {
        document.addEventListener(event, resetTimer);
      });

      // Cleanup function
      return () => {
        clearTimeout(inactivityTimer);
        events.forEach((event) => {
          document.removeEventListener(event, resetTimer);
        });
      };
    }
  }, [user]);

  // Context value
  const value = {
    user,
    loading,
    authError,
    login,
    logout,
    isAuthenticated: !!user,
    token: localStorage.getItem("token"),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
