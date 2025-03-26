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
      const response = await api.get(
        `/salary/period?month=${month}&year=${year}`
      );
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
      const response = await api.post("/salary/calculate", {
        employeeIds: data.employeeIds,
        month: data.month,
        year: data.year,
        daysOff: data.daysOff || 0,
        overtimesoon: data.overtimesoon || 0,
        overtimelate: data.overtimelate || 0,
        bonus: data.bonus || 0,
      });
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
      let url = `${API_URL}/salary/export/excel`;

      // Add month and year as query parameters if provided
      if (month && year) {
        url += `?month=${month}&year=${year}`;
      }

      const response = await api.get(url, {
        responseType: "blob",
      });

      // Create a URL for the blob
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));

      // Create a link and trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      const filename =
        month && year
          ? `salary_calculations_${year}_${month}.xlsx`
          : `salary_calculations_${
              new Date().toISOString().split("T")[0]
            }.xlsx`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      return true;
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      throw error;
    }
  },

  // Export payslip as PDF
  exportPayslip: async (salaryId) => {
    try {
      const response = await api.get(`/salary/${salaryId}/payslip`, {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
        },
      });
      return response;
    } catch (error) {
      console.error("Error exporting payslip:", error);
      throw error;
    }
  },
};

// Helper functions for formatting currency
export const formatVND = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export const parseVNDToNumber = (formattedAmount) => {
  if (!formattedAmount) return 0;
  // Remove currency symbol, spaces and commas
  const cleaned = formattedAmount.replace(/[^\d]/g, "");
  return parseInt(cleaned, 10) || 0;
};

export default api;
