import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add a request interceptor to include the JWT token for authenticated requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log("Request interceptor - Token:", token ? "Present" : "Missing");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.log("Response interceptor - Status:", error.response.status);
      console.log("Response interceptor - Data:", error.response.data);
      switch (error.response.status) {
        case 401:
          console.log("Token expired or invalid - Clearing storage");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("tokenExpiration");
          window.location.href = "/login";
          break;
        case 403:
          // Forbidden
          console.error("Access forbidden:", error.response.data);
          break;
        default:
          console.error("API Error:", error.response.data);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error("No response received:", error.request);
    } else {
      // Something else happened
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post("/auth/login", { username, password });
      console.log("Login response:", response.data);
      if (response.data.token) {
        console.log("Storing token and user data");
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        // Set token expiration (1 hour)
        const expirationTime = new Date().getTime() + 60 * 60 * 1000;
        localStorage.setItem("tokenExpiration", expirationTime);
        console.log("Token expiration set to:", new Date(expirationTime));
      }
      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      console.log("Logging out - Clearing storage");
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("tokenExpiration");
    }
  },

  checkAuth: async () => {
    try {
      console.log("Checking auth status");
      const response = await api.get("/auth/check");
      console.log("Auth check response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Auth check error:", error);
      throw error;
    }
  },

  getUser: () => {
    const user = localStorage.getItem("user");
    console.log("Getting user from storage:", user ? "Present" : "Missing");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    const token = localStorage.getItem("token");
    const expiration = localStorage.getItem("tokenExpiration");
    console.log(
      "Checking authentication - Token:",
      token ? "Present" : "Missing"
    );
    console.log(
      "Token expiration:",
      expiration ? new Date(parseInt(expiration)) : "Missing"
    );

    if (!token || !expiration) {
      console.log("Not authenticated - Missing token or expiration");
      return false;
    }

    // Check if token is expired
    const isValid = new Date().getTime() < parseInt(expiration, 10);
    console.log("Token validity:", isValid ? "Valid" : "Expired");
    return isValid;
  },
};

// Get token from localStorage
const getToken = () => {
  const token = localStorage.getItem("token");
  return token;
};

// Add authorization header to requests
const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Employee API services
export const employeeService = {
  // Get all employees
  getAll: async () => {
    try {
      const response = await api.get("/employees");
      return response.data;
    } catch (error) {
      console.error("Error fetching employees:", error);
      throw error;
    }
  },

  // Get employee by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/employees/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching employee with ID ${id}:`, error);
      throw error;
    }
  },

  // Create new employee
  create: async (employeeData) => {
    try {
      const response = await api.post("/employees", employeeData);
      return response.data;
    } catch (error) {
      console.error("Error creating employee:", error);
      throw error;
    }
  },

  // Update existing employee
  update: async (id, employeeData) => {
    try {
      const response = await api.put(`/employees/${id}`, employeeData);
      return response.data;
    } catch (error) {
      console.error(`Error updating employee with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete employee
  delete: async (id) => {
    try {
      const response = await api.delete(`/employees/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting employee with ID ${id}:`, error);
      throw error;
    }
  },
};

// Salary API services
export const salaryService = {
  // Get all salary records
  getAll: async () => {
    try {
      const response = await api.get("/salary");
      return response.data;
    } catch (error) {
      console.error("Error fetching salary records:", error);
      throw error;
    }
  },

  // Get salary records for a specific period
  getByPeriod: async (month, year) => {
    try {
      const response = await api.get(`/salary/${year}/${month}`);
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching salary records for ${month}/${year}:`,
        error
      );
      throw error;
    }
  },

  // Calculate salary for one or more employees
  calculate: async (data) => {
    try {
      const response = await api.post("/salary/calculate", data);
      return response.data;
    } catch (error) {
      console.error("Error calculating salary:", error);
      throw error;
    }
  },

  // Delete salary record
  delete: async (id) => {
    try {
      const response = await api.delete(`/salary/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting salary record with ID ${id}:`, error);
      throw error;
    }
  },

  // Export salary calculations to Excel
  exportToExcel: async (month, year) => {
    try {
      const response = await api.get(`/salary/export/${year}/${month}`, {
        responseType: "blob",
      });

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Create a link element
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `salary_report_${year}_${month}.xlsx`
      );

      // Append the link to the body
      document.body.appendChild(link);

      // Programmatically click the link to trigger the download
      link.click();

      // Clean up by removing the link and revoking the URL
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error("Error exporting salary data to Excel:", error);
      throw error;
    }
  },

  // Export payslip as PDF
  exportPayslip: async (salaryId) => {
    try {
      const response = await api.get(`/salary/payslip/${salaryId}`, {
        responseType: "blob",
      });
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      window.open(url, "_blank");
      
      return true;
    } catch (error) {
      console.error("Error exporting payslip:", error);
      throw error;
    }
  },
};

// Attendance API services
export const attendanceService = {
  // Check in
  checkIn: async (notes = "") => {
    try {
      const response = await api.post("/attendance/check-in", { notes });
      return response.data;
    } catch (error) {
      console.error("Error checking in:", error);
      throw error;
    }
  },

  // Check out
  checkOut: async (notes = "") => {
    try {
      const response = await api.post("/attendance/check-out", { notes });
      return response.data;
    } catch (error) {
      console.error("Error checking out:", error);
      throw error;
    }
  },

  // Get today's attendance status
  getStatus: async () => {
    try {
      const response = await api.get("/attendance/status");
      return response.data;
    } catch (error) {
      console.error("Error getting attendance status:", error);
      throw error;
    }
  },

  // Get attendance history
  getHistory: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/attendance/history?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error("Error getting attendance history:", error);
      throw error;
    }
  },

  // Admin: Get employee attendance
  getEmployeeAttendance: async (employeeId, startDate, endDate) => {
    try {
      let url = `/attendance/employee/${employeeId}`;
      
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error getting employee attendance:", error);
      throw error;
    }
  },

  // Admin: Get attendance summary
  getSummary: async (params) => {
    try {
      let queryParams = new URLSearchParams();
      
      if (params.month && params.year) {
        queryParams.append("month", params.month);
        queryParams.append("year", params.year);
      } else if (params.startDate && params.endDate) {
        queryParams.append("startDate", params.startDate);
        queryParams.append("endDate", params.endDate);
      }
      
      const response = await api.get(`/attendance/summary?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error("Error getting attendance summary:", error);
      throw error;
    }
  }
};

// User API services
export const userService = {
  // Get all users
  getAll: async () => {
    try {
      const response = await api.get("/auth/users");
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  // Get user by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/auth/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }
  },

  // Create new user
  create: async (userData) => {
    try {
      const response = await api.post("/auth/users", userData);
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  // Create user from employee
  createFromEmployee: async (employeeId, role) => {
    try {
      const response = await api.post("/auth/users/create-from-employee", {
        employeeId,
        role,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating user from employee:", error);
      throw error;
    }
  },

  // Update existing user
  update: async (id, userData) => {
    try {
      const response = await api.put(`/auth/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete user
  delete: async (id) => {
    try {
      const response = await api.delete(`/auth/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw error;
    }
  },

  // Reset user password
  resetPassword: async (id) => {
    try {
      const response = await api.post(`/auth/users/${id}/reset-password`);
      return response.data;
    } catch (error) {
      console.error(`Error resetting password for user with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Change own password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post("/auth/change-password", {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error("Error changing password:", error);
      throw error;
    }
  }
};

// Helper functions for formatting currency
export const formatVND = (amount) => {
  if (amount === undefined || amount === null) return "";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export const parseVNDToNumber = (formattedAmount) => {
  if (!formattedAmount) return 0;
  return parseInt(formattedAmount.replace(/[^\d]/g, ""));
};

// Helper functions for date formatting
export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit", 
    minute: "2-digit"
  });
};

export default api;
