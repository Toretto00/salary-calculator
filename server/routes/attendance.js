const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

// Path to attendance data file
const attendanceFile = path.join(__dirname, "../data/attendance.json");

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "salary-calculator-jwt-secret"
    );
    req.user = decoded;

    // Check if session is still valid
    if (decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ message: "Session expired" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Admin middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Helper function to read attendance data
const readAttendanceData = () => {
  try {
    if (!fs.existsSync(attendanceFile)) {
      // Create empty attendance file if it doesn't exist
      fs.writeFileSync(attendanceFile, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(attendanceFile, "utf8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is corrupt, return an empty array
    return [];
  }
};

// Helper function to write attendance data
const writeAttendanceData = (data) => {
  // Ensure the directory exists
  const dir = path.dirname(attendanceFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(attendanceFile, JSON.stringify(data, null, 2));
};

// Helper function to get active attendance record
const getActiveAttendance = (userId) => {
  const attendanceData = readAttendanceData();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
  
  return attendanceData.find(record => 
    record.userId === userId && 
    record.date.split("T")[0] === todayStr && 
    !record.checkOut.time
  );
};

// Check-in
router.post("/check-in", isAuthenticated, (req, res) => {
  try {
    const userId = req.user.id;
    const { notes } = req.body;
    
    // Check if user is already checked in today
    const activeAttendance = getActiveAttendance(userId);
    
    if (activeAttendance) {
      return res.status(400).json({ 
        message: "You are already checked in. Please check out first." 
      });
    }
    
    // Get employee ID from users data
    const usersFile = path.join(__dirname, "../data/users.json");
    const usersData = JSON.parse(fs.readFileSync(usersFile, "utf8"));
    
    const user = usersData.find(user => user.id.toString() === userId.toString());
    if (!user || !user.employeeId) {
      return res.status(400).json({ 
        message: "No employee record found for this user." 
      });
    }
    
    // Create new attendance record
    const now = new Date();
    const attendanceRecord = {
      id: uuidv4(),
      employeeId: user.employeeId,
      userId: userId,
      date: now.toISOString(),
      checkIn: {
        time: now.toISOString(),
        notes: notes || ""
      },
      checkOut: {
        time: null,
        notes: ""
      },
      workingHours: 0,
      status: "incomplete",
      overtime: 0,
      isApproved: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    
    // Add to attendance data
    const attendanceData = readAttendanceData();
    attendanceData.push(attendanceRecord);
    writeAttendanceData(attendanceData);
    
    res.status(201).json({ 
      message: "Checked in successfully",
      attendance: attendanceRecord
    });
    
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ message: "Server error during check-in" });
  }
});

// Check-out
router.post("/check-out", isAuthenticated, (req, res) => {
  try {
    const userId = req.user.id;
    const { notes } = req.body;
    
    // Find today's active attendance record
    const attendanceData = readAttendanceData();
    const activeAttendanceIndex = attendanceData.findIndex(record => 
      record.userId.toString() === userId.toString() && 
      !record.checkOut.time
    );
    
    if (activeAttendanceIndex === -1) {
      return res.status(400).json({ 
        message: "No active check-in found. Please check in first." 
      });
    }
    
    // Update the record with check-out time
    const now = new Date();
    const checkOutTime = now.toISOString();
    
    // Calculate working hours
    const checkInTime = new Date(attendanceData[activeAttendanceIndex].checkIn.time);
    const timeDiff = now.getTime() - checkInTime.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    const workingHours = Math.round(hoursDiff * 100) / 100;
    
    // Calculate overtime (assuming 8 hours is standard)
    let overtime = 0;
    if (workingHours > 8) {
      overtime = Math.round((workingHours - 8) * 100) / 100;
    }
    
    // Update record
    attendanceData[activeAttendanceIndex].checkOut.time = checkOutTime;
    attendanceData[activeAttendanceIndex].checkOut.notes = notes || "";
    attendanceData[activeAttendanceIndex].workingHours = workingHours;
    attendanceData[activeAttendanceIndex].status = "present";
    attendanceData[activeAttendanceIndex].overtime = overtime;
    attendanceData[activeAttendanceIndex].updatedAt = now.toISOString();
    
    writeAttendanceData(attendanceData);
    
    res.json({ 
      message: "Checked out successfully",
      attendance: attendanceData[activeAttendanceIndex]
    });
    
  } catch (error) {
    console.error("Check-out error:", error);
    res.status(500).json({ message: "Server error during check-out" });
  }
});

// Get today's attendance status for current user
router.get("/status", isAuthenticated, (req, res) => {
  try {
    const userId = req.user.id;
    
    const attendanceData = readAttendanceData();
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
    
    const todayAttendance = attendanceData.find(record => 
      record.userId.toString() === userId.toString() && 
      record.date.split("T")[0] === todayStr
    );
    
    if (!todayAttendance) {
      return res.json({ 
        status: "not-checked-in",
        message: "Not checked in today" 
      });
    }
    
    if (todayAttendance.checkOut.time) {
      return res.json({
        status: "checked-out",
        message: "Checked out for today",
        attendance: todayAttendance
      });
    } else {
      return res.json({
        status: "checked-in",
        message: "Currently checked in",
        attendance: todayAttendance
      });
    }
    
  } catch (error) {
    console.error("Get attendance status error:", error);
    res.status(500).json({ message: "Server error getting attendance status" });
  }
});

// Get attendance history for current user (paginated)
router.get("/history", isAuthenticated, (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const attendanceData = readAttendanceData();
    
    // Filter by user ID and sort by date (most recent first)
    const userAttendance = attendanceData
      .filter(record => record.userId.toString() === userId.toString())
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const total = userAttendance.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedAttendance = userAttendance.slice(startIndex, endIndex);
    
    res.json({
      records: paginatedAttendance,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error("Get attendance history error:", error);
    res.status(500).json({ message: "Server error getting attendance history" });
  }
});

// Admin: Get attendance for specific employee and date range
router.get("/employee/:employeeId", isAuthenticated, isAdmin, (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;
    
    const attendanceData = readAttendanceData();
    
    // Filter by employee ID
    let filteredAttendance = attendanceData.filter(
      record => record.employeeId.toString() === employeeId.toString()
    );
    
    // Apply date range filter if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of the day
      
      filteredAttendance = filteredAttendance.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
      });
    }
    
    // Sort by date (most recent first)
    filteredAttendance.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate summary statistics
    const totalHours = filteredAttendance.reduce((sum, record) => sum + record.workingHours, 0);
    const totalOvertimeHours = filteredAttendance.reduce((sum, record) => sum + record.overtime, 0);
    const presentDays = filteredAttendance.filter(record => record.status === "present").length;
    
    res.json({
      records: filteredAttendance,
      summary: {
        totalHours,
        totalOvertimeHours,
        presentDays,
        totalRecords: filteredAttendance.length
      }
    });
    
  } catch (error) {
    console.error("Get employee attendance error:", error);
    res.status(500).json({ message: "Server error getting employee attendance" });
  }
});

// Admin: Get attendance summary for all employees in a specific date range or month
router.get("/summary", isAuthenticated, isAdmin, (req, res) => {
  try {
    const { startDate, endDate, month, year } = req.query;
    
    const attendanceData = readAttendanceData();
    let filteredAttendance = [...attendanceData];
    
    // Apply date filters
    if (month && year) {
      const monthNum = parseInt(month) - 1; // JavaScript months are 0-indexed
      const yearNum = parseInt(year);
      
      filteredAttendance = filteredAttendance.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === monthNum && recordDate.getFullYear() === yearNum;
      });
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of the day
      
      filteredAttendance = filteredAttendance.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
      });
    }
    
    // Get employees data to include names
    const employeesFile = path.join(__dirname, "../data/employees.json");
    const employeesData = JSON.parse(fs.readFileSync(employeesFile, "utf8"));
    
    // Group by employee
    const employeeSummary = {};
    
    filteredAttendance.forEach(record => {
      const employeeId = record.employeeId.toString();
      
      if (!employeeSummary[employeeId]) {
        const employee = employeesData.find(emp => emp.id.toString() === employeeId);
        
        employeeSummary[employeeId] = {
          employeeId,
          employee: employee || { name: "Unknown Employee" },
          totalHours: 0,
          totalOvertime: 0,
          presentDays: 0,
          recordCount: 0
        };
      }
      
      employeeSummary[employeeId].totalHours += record.workingHours;
      employeeSummary[employeeId].totalOvertime += record.overtime;
      
      if (record.status === "present") {
        employeeSummary[employeeId].presentDays += 1;
      }
      
      employeeSummary[employeeId].recordCount += 1;
    });
    
    // Convert to array and sort by employee name
    const summaryArray = Object.values(employeeSummary).sort((a, b) => {
      const nameA = a.employee.name || "";
      const nameB = b.employee.name || "";
      return nameA.localeCompare(nameB);
    });
    
    res.json(summaryArray);
    
  } catch (error) {
    console.error("Get attendance summary error:", error);
    res.status(500).json({ message: "Server error getting attendance summary" });
  }
});

module.exports = router;
