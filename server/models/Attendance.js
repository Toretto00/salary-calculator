const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Path to attendance data file
const attendanceFile = path.join(__dirname, '../data/attendance.json');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create empty attendance file if it doesn't exist
if (!fs.existsSync(attendanceFile)) {
  fs.writeFileSync(attendanceFile, JSON.stringify([], null, 2));
}

// Helper function to read attendance data
const readAttendanceData = () => {
  try {
    const data = fs.readFileSync(attendanceFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading attendance data:', error);
    return [];
  }
};

// Helper function to write attendance data
const writeAttendanceData = (data) => {
  try {
    fs.writeFileSync(attendanceFile, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing attendance data:', error);
    return false;
  }
};

// Attendance model functions
const AttendanceModel = {
  // Create a new attendance record
  create: (attendanceData) => {
    const attendances = readAttendanceData();
    const newAttendance = {
      id: uuidv4(),
      employeeId: attendanceData.employeeId,
      userId: attendanceData.userId,
      date: attendanceData.date,
      checkIn: attendanceData.checkIn,
      checkOut: attendanceData.checkOut,
      workingHours: attendanceData.workingHours,
      status: attendanceData.status,
      overtime: attendanceData.overtime,
      isApproved: attendanceData.isApproved,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    attendances.push(newAttendance);
    writeAttendanceData(attendances);
    return newAttendance;
  },

  // Find attendance records by query
  find: (query = {}) => {
    const attendances = readAttendanceData();
    
    // If no query, return all records
    if (Object.keys(query).length === 0) {
      return attendances;
    }
    
    // Filter by query parameters
    return attendances.filter(record => {
      for (const key in query) {
        if (record[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  },

  // Find one attendance record
  findOne: (query) => {
    const attendances = readAttendanceData();
    
    return attendances.find(record => {
      for (const key in query) {
        if (record[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  },

  // Update an attendance record
  findByIdAndUpdate: (id, updates) => {
    const attendances = readAttendanceData();
    const index = attendances.findIndex(record => record.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const updated = {
      ...attendances[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    attendances[index] = updated;
    writeAttendanceData(attendances);
    return updated;
  },

  // Delete an attendance record
  findByIdAndDelete: (id) => {
    const attendances = readAttendanceData();
    const index = attendances.findIndex(record => record.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const deleted = attendances[index];
    attendances.splice(index, 1);
    writeAttendanceData(attendances);
    return deleted;
  }
};

module.exports = AttendanceModel;
