import axios from "axios";

const API_URL = "http://localhost:5000/api";

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
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (username, password) => {
    const response = await api.post("/auth/login", { username, password });
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      // Set token expiration (1 hour)
      const expirationTime = new Date().getTime() + 60 * 60 * 1000;
      localStorage.setItem("tokenExpiration", expirationTime);
    }
    return response.data;
  },

  logout: async () => {
    await api.post("/auth/logout");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiration");
  },

  checkAuth: async () => {
    try {
      const response = await api.get("/auth/check");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    const token = localStorage.getItem("token");
    const expiration = localStorage.getItem("tokenExpiration");

    if (!token || !expiration) {
      return false;
    }

    // Check if token is expired
    return new Date().getTime() < parseInt(expiration, 10);
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

  // Calculate salary for selected employees
  calculate: async (calculationData) => {
    try {
      const response = await api.post("/salary/calculate", calculationData);
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
