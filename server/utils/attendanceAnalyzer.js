const fs = require("fs");
const path = require("path");

const attendanceFile = path.join(__dirname, "../data/attendance.json");

/**
 * Calculate working days based on attendance records
 * @param {Number} employeeId - The employee ID
 * @param {Number} month - Month (1-12)
 * @param {Number} year - Year
 * @returns {Object} Object containing workDays, halfDays, fullDays, and absences
 */
function calculateWorkingDays(employeeId, month, year) {
  try {
    // Get attendance records
    const attendanceRecords = JSON.parse(
      fs.readFileSync(attendanceFile, "utf8")
    );

    // Filter records for the specific employee and month/year
    const employeeRecords = attendanceRecords.filter((record) => {
      const recordDate = new Date(record.date);
      return (
        record.employeeId === employeeId &&
        recordDate.getMonth() + 1 === parseInt(month) &&
        recordDate.getFullYear() === parseInt(year)
      );
    });

    // Calculate total working days in the month (Monday to Friday)
    const totalWorkingDays = getWorkingDaysInMonth(month, year);

    // Analyze attendance records
    let fullDays = 0;
    let halfDays = 0;

    // Process each attendance record
    employeeRecords.forEach((record) => {
      if (record.workingHours >= 7) {
        fullDays++;
      } else if (record.workingHours >= 4 && record.workingHours < 7) {
        halfDays++;
      }
    });

    // Check if current date is within the month/year being calculated
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const isCurrentMonth =
      parseInt(month) === currentMonth && parseInt(year) === currentYear;

    // If calculating current month and not at month-end, count remaining working days as full days
    if (isCurrentMonth) {
      const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0);
      lastDayOfMonth.setHours(0, 0, 0, 0); // Reset time to midnight

      // If today is not the last day of month, calculate remaining working days
      if (today.getDate() <= lastDayOfMonth.getDate()) {
        // Count business days from tomorrow to end of month
        let futureWorkingDays = 0;
        const tempDate = new Date(today);
        tempDate.setDate(tempDate.getDate() + 1); // Start from tomorrow

        while (tempDate <= lastDayOfMonth) {
          const dayOfWeek = tempDate.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            futureWorkingDays++;
            fullDays++; // Add to full days since we're assuming they will be worked
          }
          tempDate.setDate(tempDate.getDate() + 1);
        }

        console.log(
          `Adding ${futureWorkingDays} future working days as full attendance for employee ${employeeId}`
        );
      }
    }

    // Calculate equivalent work days (full day = 1, half day = 0.5)
    const workDays = fullDays + halfDays * 0.5;

    // Calculate absence days
    const absences = totalWorkingDays - workDays;

    return {
      workDays,
      halfDays,
      fullDays,
      absences,
      totalWorkingDays,
    };
  } catch (error) {
    console.error("Error calculating working days:", error);
    // Return default values if an error occurs
    return {
      workDays: 0,
      halfDays: 0,
      fullDays: 0,
      absences: 0,
      totalWorkingDays: getWorkingDaysInMonth(month, year),
    };
  }
}

/**
 * Get the number of working days (Monday to Friday) in a month
 * @param {Number} month - Month (1-12)
 * @param {Number} year - Year
 * @returns {Number} Number of working days
 */
function getWorkingDaysInMonth(month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  let workingDays = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
}

/**
 * Get summary of attendance for multiple employees
 * @param {Array} employeeIds - Array of employee IDs
 * @param {Number} month - Month (1-12)
 * @param {Number} year - Year
 * @returns {Object} Object mapping employee IDs to attendance data
 */
function getAttendanceSummary(employeeIds, month, year) {
  const summary = {};

  employeeIds.forEach((employeeId) => {
    summary[employeeId] = calculateWorkingDays(employeeId, month, year);
  });

  return summary;
}

module.exports = {
  calculateWorkingDays,
  getWorkingDaysInMonth,
  getAttendanceSummary,
};
