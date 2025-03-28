const express = require("express");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const ExcelJS = require("exceljs");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const { PDFDocument } = require("pdf-lib");
const { getAttendanceSummary } = require("../utils/attendanceAnalyzer");

const router = express.Router();
const salaryCalculationsFile = path.join(
  __dirname,
  "../data/salary_calculations.json"
);
const employeesFile = path.join(__dirname, "../data/employees.json");

// Constants for salary calculation
const TAX_LEVELS = [
  { number: 1, from: 0, to: 5000000, percent: 5, title: "To 5m (5%)" },
  {
    number: 2,
    from: 5000000,
    to: 10000000,
    percent: 10,
    title: "From 5m to 10m (10%)",
  },
  {
    number: 3,
    from: 10000000,
    to: 18000000,
    percent: 15,
    title: "From 10m to 18m (15%)",
  },
  {
    number: 4,
    from: 18000000,
    to: 32000000,
    percent: 20,
    title: "From 18m to 32m (20%)",
  },
  {
    number: 5,
    from: 32000000,
    to: 52000000,
    percent: 25,
    title: "From 32m to 52m (25%)",
  },
  {
    number: 6,
    from: 52000000,
    to: 80000000,
    percent: 30,
    title: "From 52m to 80m (30%)",
  },
  { number: 7, from: 80000000, percent: 35, title: "From 80m (35%)" },
];

// Calculate working days in a month (Monday to Friday)
function getWorkingDaysInMonth(month, year) {
  // Create date for the first day of the month
  const startDate = new Date(year, month - 1, 1);
  // Create date for the first day of next month
  const endDate = new Date(year, month, 0);

  let workingDays = 0;

  // Loop through all days in the month
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    // Check if the day is a weekday (1-5 = Monday to Friday)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
}

const MAX_SALARY_FOR_SOCIAL_INSURANCE = 2340000 * 20;
const MAX_SALARY_FOR_HEALTH_INSURANCE = 2340000 * 20;
const MAX_SALARY_FOR_ACCIDENT_INSURANCE = 4960000 * 20;
const TAX_PAYER_PERSONAL_RELIEF = 11000000;
const DEPENDENTS_RELIEF = 4400000;

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
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Calculate salary for an employee
function calculateSalary(inputData = {}) {
  // Use input data with 0 as defaults
  const workingDays = inputData.workingDays || 0;
  const daysOff = inputData.daysOff || 0;
  const grossSalary = inputData.salary || inputData.grossSalary || 0; // Use salary from employee profile if available
  const dependents = inputData.dependents || 0;
  // Use allowances from employee profile if available
  const food = inputData.allowances?.food || inputData.food || 0;
  const clothes = inputData.allowances?.clothes || inputData.clothes || 0;
  const parking = inputData.allowances?.parking || inputData.parking || 0;
  const fuel = inputData.allowances?.fuel || inputData.fuel || 0;
  const houseRent = inputData.allowances?.houseRent || inputData.houseRent || 0;
  const phone = inputData.allowances?.phone || inputData.phone || 0;
  const otTimeSoon = inputData.otTimeSoon || 0;
  const otTimeLate = inputData.otTimeLate || 0;
  const bonus = inputData.bonus || 0;
  const isProbation = inputData.probation === "yes";
  const isVietnamese = inputData.nationality === "vietnamese";
  const fullname = inputData.fullname || "Employee";

  // Apply probation adjustment to gross salary (85% if on probation)
  const effectiveGrossSalary = isProbation ? grossSalary * 0.85 : grossSalary;

  // Guard against division by zero
  const grossSalaryPerHour =
    workingDays > 0 ? effectiveGrossSalary / (workingDays * 8) : 0;
  const nonTaxableIncome = 0;

  // Calculate overtime amounts using effective gross salary
  const moneyOfOtTimeSoon = otTimeSoon * 1.5 * grossSalaryPerHour;
  const moneyOfOtTimeLate = otTimeLate * 1.8 * grossSalaryPerHour;
  const taxPayerPersonalRelief =
    TAX_PAYER_PERSONAL_RELIEF + DEPENDENTS_RELIEF * dependents;
  const healthInsurance =
    (grossSalary >= MAX_SALARY_FOR_HEALTH_INSURANCE
      ? MAX_SALARY_FOR_HEALTH_INSURANCE
      : grossSalary) * 0.015;
  const socialInsurance =
    (grossSalary >= MAX_SALARY_FOR_SOCIAL_INSURANCE
      ? MAX_SALARY_FOR_SOCIAL_INSURANCE
      : grossSalary) * 0.08;
  const accidentInsurance = isVietnamese
    ? (grossSalary >= MAX_SALARY_FOR_ACCIDENT_INSURANCE
        ? MAX_SALARY_FOR_ACCIDENT_INSURANCE
        : grossSalary) * 0.01
    : 0;

  // Calculate adjusted salary based on working days
  const adjustedSalary =
    workingDays > 0
      ? (effectiveGrossSalary / workingDays) * (workingDays - daysOff)
      : 0;

  let taxableIncome =
    adjustedSalary -
    healthInsurance -
    socialInsurance -
    accidentInsurance -
    taxPayerPersonalRelief -
    nonTaxableIncome +
    parking +
    fuel +
    houseRent +
    phone +
    (food > 730000 ? food - 730000 : 0) +
    (clothes > 5000000 / 12 ? clothes - 5000000 / 12 : 0) +
    (otTimeSoon > 0 ? otTimeSoon * grossSalaryPerHour : 0) +
    (otTimeLate > 0 ? otTimeLate * grossSalaryPerHour : 0) +
    bonus;

  taxableIncome = taxableIncome < 0 ? 0 : taxableIncome;

  let totalTax = 0;
  TAX_LEVELS.forEach((taxLevel) => {
    if (taxableIncome >= taxLevel.from) {
      totalTax +=
        ((taxableIncome < taxLevel.to
          ? taxableIncome - taxLevel.from
          : taxLevel.to - taxLevel.from) *
          taxLevel.percent) /
        100;
    }
  });

  // Calculate total benefits
  const totalBenefits = parking + fuel + houseRent + phone + food + clothes;

  // Calculate total insurance
  const totalInsurance = healthInsurance + socialInsurance + accidentInsurance;

  // Calculate total overtime
  const totalOvertime = moneyOfOtTimeSoon + moneyOfOtTimeLate;

  // Calculate net salary
  const netSalary =
    adjustedSalary +
    food +
    clothes -
    totalTax -
    totalInsurance +
    parking +
    fuel +
    houseRent +
    phone +
    totalOvertime +
    bonus;

  return {
    fullname,
    grossSalary: effectiveGrossSalary, // Use effective gross salary
    workDays: workingDays - daysOff,
    adjustedSalary,
    otTimeSoon,
    otTimeLate,
    moneyOfOtTimeSoon,
    moneyOfOtTimeLate,
    totalOvertime,
    food,
    clothes,
    parking,
    fuel,
    houseRent,
    phone,
    bonus,
    totalBenefits,
    healthInsurance,
    socialInsurance,
    accidentInsurance,
    totalInsurance,
    taxableIncome,
    totalTax,
    netSalary,
    isProbation,
    isVietnamese,
    calculatedAt: new Date().toISOString(),
  };
}

// Ensure salary calculations file exists
if (!fs.existsSync(salaryCalculationsFile)) {
  fs.writeFileSync(salaryCalculationsFile, JSON.stringify([], null, 2));
}

// Get all salary calculations
router.get("/", isAuthenticated, (req, res) => {
  try {
    const calculations = JSON.parse(
      fs.readFileSync(salaryCalculationsFile, "utf8")
    );
    res.json(calculations);
  } catch (error) {
    console.error("Error getting salary calculations:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get salary calculations by period (month/year)
router.get("/period", isAuthenticated, (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        message: "Month and year parameters are required",
      });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    const calculations = JSON.parse(
      fs.readFileSync(salaryCalculationsFile, "utf8")
    );

    const filteredCalculations = calculations.filter(
      (calc) => calc.month === monthNum && calc.year === yearNum
    );

    res.json(filteredCalculations);
  } catch (error) {
    console.error("Error getting salary calculations by period:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Export routes must come before dynamic parameter routes
router.get("/export/excel", isAuthenticated, async (req, res) => {
  try {
    // Get query parameters for filtering
    const { month, year } = req.query;

    // Get salary calculations
    let calculations = [];
    if (fs.existsSync(salaryCalculationsFile)) {
      calculations = JSON.parse(
        fs.readFileSync(salaryCalculationsFile, "utf8")
      );
    }

    // Filter by month and year if provided
    if (month && year) {
      calculations = calculations.filter(
        (calc) => calc.month === parseInt(month) && calc.year === parseInt(year)
      );
    }

    if (calculations.length === 0) {
      return res
        .status(404)
        .json({ message: "No salary calculations found for export" });
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Salary Calculations");

    // Define columns
    worksheet.columns = [
      { header: "Full Name", key: "fullname", width: 20 },
      { header: "Gross Salary", key: "grossSalary", width: 15 },
      { header: "Working Days", key: "workDays", width: 15 },
      { header: "Adjusted Salary", key: "adjustedSalary", width: 15 },
      { header: "Food", key: "food", width: 15 },
      { header: "Clothes", key: "clothes", width: 15 },
      { header: "Parking", key: "parking", width: 15 },
      { header: "Fuel", key: "fuel", width: 15 },
      { header: "House Rent", key: "houseRent", width: 15 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Total Benefits", key: "totalBenefits", width: 15 },
      { header: "Health Insurance", key: "healthInsurance", width: 15 },
      { header: "Social Insurance", key: "socialInsurance", width: 15 },
      { header: "Unemployment Insurance", key: "accidentInsurance", width: 15 },
      { header: "Total Insurance", key: "totalInsurance", width: 15 },
      { header: "Income Tax", key: "incomeTax", width: 15 },
      { header: "Total Tax", key: "totalTax", width: 15 },
      { header: "Total Overtime", key: "totalOvertime", width: 15 },
      { header: "Net Salary", key: "netSalary", width: 15 },
    ];

    // Add data
    calculations.forEach((calculation) => {
      worksheet.addRow({
        fullname: calculation.fullname,
        grossSalary: calculation.grossSalary,
        workDays: calculation.workDays,
        adjustedSalary: calculation.adjustedSalary,
        food: calculation.food,
        clothes: calculation.clothes,
        parking: calculation.parking,
        fuel: calculation.fuel,
        houseRent: calculation.houseRent,
        phone: calculation.phone,
        totalBenefits: calculation.totalBenefits,
        totalTax: calculation.totalTax,
        totalInsurance: calculation.totalInsurance,
        totalOvertime: calculation.totalOvertime,
        healthInsurance: calculation.healthInsurance,
        socialInsurance: calculation.socialInsurance,
        accidentInsurance: calculation.accidentInsurance,
        netSalary: calculation.netSalary,
        incomeTax:
          calculation.taxableIncome < 0 ? 0 : calculation.taxableIncome,
      });
    });

    // Format currency columns
    [
      "grossSalary",
      "netSalary",
      "totalBenefits",
      "totalTax",
      "totalInsurance",
      "totalOvertime",
      "adjustedSalary",
      "food",
      "clothes",
      "parking",
      "fuel",
      "houseRent",
      "phone",
      "healthInsurance",
      "socialInsurance",
      "accidentInsurance",
      "incomeTax",
    ].forEach((key) => {
      worksheet.getColumn(key).numFmt = '#,##0 "₫"';
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=salary_calculations_${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );

    res.send(buffer);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    res.status(500).json({ message: "Error exporting to Excel" });
  }
});

// Get salary calculations by year and month (path params)
// This must be BEFORE the /:id route to avoid conflicts
router.get("/:year/:month", isAuthenticated, (req, res) => {
  try {
    const { month, year } = req.params;

    if (!month || !year) {
      return res.status(400).json({
        message: "Month and year parameters are required",
      });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    // Make sure we're working with valid numbers
    if (isNaN(monthNum) || isNaN(yearNum)) {
      return res.status(400).json({
        message: "Month and year must be valid numbers",
      });
    }

    const calculations = JSON.parse(
      fs.readFileSync(salaryCalculationsFile, "utf8")
    );

    const filteredCalculations = calculations.filter(
      (calc) => calc.month === monthNum && calc.year === yearNum
    );

    res.json(filteredCalculations);
  } catch (error) {
    console.error("Error getting salary calculations by period:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get salary calculation by ID (now comes AFTER the year/month route)
router.get("/:id", isAuthenticated, (req, res) => {
  try {
    // Check if the ID is a number to avoid confusing with other routes
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const calculations = JSON.parse(
      fs.readFileSync(salaryCalculationsFile, "utf8")
    );
    const calculation = calculations.find(
      (calc) => calc.id === id
    );

    if (!calculation) {
      return res.status(404).json({ message: "Salary calculation not found" });
    }

    res.json(calculation);
  } catch (error) {
    console.error("Error getting salary calculation:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new salary calculation
router.post("/", isAuthenticated, (req, res) => {
  try {
    // Get employee data first
    let employees = [];
    if (fs.existsSync(employeesFile)) {
      employees = JSON.parse(fs.readFileSync(employeesFile, "utf8"));
    }

    const employee = employees.find(
      (emp) => emp.id === parseInt(req.body.employeeId)
    );
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Get existing salary calculations
    let calculations = [];
    if (fs.existsSync(salaryCalculationsFile)) {
      calculations = JSON.parse(
        fs.readFileSync(salaryCalculationsFile, "utf8")
      );
    }

    // Combine employee data with salary data for calculation
    const calculationData = {
      ...req.body,
      fullname: employee.fullname,
      dependents: employee.dependents || 0,
      probation: employee.probation || "no",
      nationality: employee.nationality || "vietnamese",
    };

    const result = calculateSalary(calculationData);

    // Save the result
    const newCalculation = {
      id:
        calculations.length > 0
          ? Math.max(...calculations.map((c) => c.id)) + 1
          : 1,
      employeeId: employee.id,
      ...result,
    };

    calculations.push(newCalculation);
    fs.writeFileSync(
      salaryCalculationsFile,
      JSON.stringify(calculations, null, 2)
    );

    res.status(201).json(newCalculation);
  } catch (error) {
    console.error("Error creating salary calculation:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a salary calculation
router.put("/:id", isAuthenticated, (req, res) => {
  try {
    // Get salary calculations
    let calculations = [];
    if (fs.existsSync(salaryCalculationsFile)) {
      calculations = JSON.parse(
        fs.readFileSync(salaryCalculationsFile, "utf8")
      );
    }

    const calculationIndex = calculations.findIndex(
      (calc) => calc.id === parseInt(req.params.id)
    );
    if (calculationIndex === -1) {
      return res.status(404).json({ message: "Salary calculation not found" });
    }

    // Get employee data for recalculation
    let employees = [];
    if (fs.existsSync(employeesFile)) {
      employees = JSON.parse(fs.readFileSync(employeesFile, "utf8"));
    }

    const employeeId =
      req.body.employeeId || calculations[calculationIndex].employeeId;
    const employee = employees.find((emp) => emp.id === parseInt(employeeId));
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Combine employee data with salary data for recalculation
    const calculationData = {
      ...req.body,
      fullname: employee.fullname,
      dependents: employee.dependents || 0,
      probation: employee.probation || "no",
      nationality: employee.nationality || "vietnamese",
    };

    const result = calculateSalary(calculationData);

    // Update the calculation
    calculations[calculationIndex] = {
      ...calculations[calculationIndex],
      ...result,
      employeeId,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
      salaryCalculationsFile,
      JSON.stringify(calculations, null, 2)
    );

    res.json(calculations[calculationIndex]);
  } catch (error) {
    console.error("Error updating salary calculation:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a salary calculation
router.delete("/:id", isAuthenticated, (req, res) => {
  try {
    if (!fs.existsSync(salaryCalculationsFile)) {
      return res.status(404).json({ message: "No salary calculations found" });
    }

    let calculations = JSON.parse(
      fs.readFileSync(salaryCalculationsFile, "utf8")
    );
    const initialLength = calculations.length;

    calculations = calculations.filter(
      (calc) => calc.id !== parseInt(req.params.id)
    );

    if (calculations.length === initialLength) {
      return res.status(404).json({ message: "Salary calculation not found" });
    }

    fs.writeFileSync(
      salaryCalculationsFile,
      JSON.stringify(calculations, null, 2)
    );

    res.json({ message: "Salary calculation deleted successfully" });
  } catch (error) {
    console.error("Error deleting salary calculation:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Calculate and create new salary records (batch processing)
router.post("/calculate", isAuthenticated, (req, res) => {
  try {
    const {
      employeeIds,
      month,
      year,
      workingDays = 0,
      daysOff = 0,
      otTimeSoon = 0,
      otTimeLate = 0,
      bonus = 0,
    } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        message: "Employee IDs are required",
      });
    }

    if (!month || !year) {
      return res.status(400).json({
        message: "Month and year are required",
      });
    }

    // Get employees
    const employees = JSON.parse(fs.readFileSync(employeesFile, "utf8"));
    
    // Get attendance summary for all employees
    const attendanceSummary = getAttendanceSummary(
      employeeIds.map(id => parseInt(id)), 
      parseInt(month), 
      parseInt(year)
    );

    // Get or create salary calculations array
    let calculations = [];
    if (fs.existsSync(salaryCalculationsFile)) {
      calculations = JSON.parse(fs.readFileSync(salaryCalculationsFile, "utf8"));
    }

    const results = [];

    // Calculate salary for each employee
    for (const employeeId of employeeIds) {
      const employee = employees.find((emp) => emp.id === parseInt(employeeId));
      if (!employee) {
        results.push({
          employeeId,
          error: "Employee not found",
        });
        continue;
      }

      // Check if salary already exists for this employee and period
      const existingIndex = calculations.findIndex(
        (calc) =>
          calc.employeeId === parseInt(employeeId) &&
          calc.month === parseInt(month) &&
          calc.year === parseInt(year)
      );

      // Get attendance data for this employee
      const attendance = attendanceSummary[employeeId] || {
        workDays: workingDays,
        absences: daysOff,
        totalWorkingDays: workingDays + daysOff
      };

      // Prepare calculation data
      const calculationData = {
        employeeId: parseInt(employeeId),
        month: parseInt(month),
        year: parseInt(year),
        workingDays: attendance.totalWorkingDays,
        daysOff: attendance.absences,
        otTimeSoon,
        otTimeLate,
        bonus,
        // Include employee data
        fullname: employee.fullname,
        salary: employee.salary,
        dependents: employee.dependents || 0,
        probation: employee.probation || "no",
        nationality: employee.nationality || "vietnamese",
        // Include allowances
        allowances: employee.allowances || {},
      };

      // Calculate salary
      const result = calculateSalary(calculationData);

      // Add metadata
      const calculation = {
        id:
          existingIndex >= 0
            ? calculations[existingIndex].id
            : calculations.length > 0
            ? Math.max(...calculations.map((c) => c.id)) + 1
            : 1,
        employeeId: parseInt(employeeId),
        month: parseInt(month),
        year: parseInt(year),
        attendanceSummary: attendance,
        createdAt: new Date().toISOString(),
        ...result,
      };

      // Add or update calculation
      if (existingIndex >= 0) {
        calculations[existingIndex] = calculation;
      } else {
        calculations.push(calculation);
      }

      results.push(calculation);
    }

    // Save calculations
    fs.writeFileSync(
      salaryCalculationsFile,
      JSON.stringify(calculations, null, 2)
    );

    res.status(200).json(results);
  } catch (error) {
    console.error("Error calculating salary:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Generate payslip
router.get("/:id/payslip", async (req, res) => {
  try {
    const salaryId = req.params.id;
    const salary = await getSalaryById(salaryId);
    const employee = await getEmployeeById(salary.employeeId);

    if (!salary || !employee) {
      return res.status(404).json({ message: "Salary or employee not found" });
    }

    // Read the template file
    const templatePath = path.join(
      __dirname,
      "../payslip-template/Acamar AI Vietnam - Payslip.pdf"
    );

    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      throw new Error("PDF template file not found");
    }

    // Read the PDF template
    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get the first page
    const page = pdfDoc.getPages()[0];

    // Format currency values
    const formatCurrency = (value) => {
      return value.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
    };

    // Calculate total benefits
    const totalBenefits = salary.totalBenefits;

    // Set text size and spacing
    const fontSize = 8;
    const lineHeight = fontSize * 1.2;

    // Helper function to draw text with right alignment
    const drawText = (text, x, y, size = fontSize, isRightAligned = false) => {
      if (!text) return;

      // Convert Vietnamese characters to their ASCII equivalents
      const asciiText = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
        .replace(/[èéẹẻẽêềếệểễ]/g, "e")
        .replace(/[ìíịỉĩ]/g, "i")
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
        .replace(/[ùúụủũưừứựửữ]/g, "u")
        .replace(/[ỳýỵỷỹ]/g, "y");

      // Calculate text width (approximate)
      const textWidth = asciiText.length * size * 0.6; // Approximate width based on font size

      // Adjust x position for right alignment
      const finalX = isRightAligned ? x - textWidth : x;

      page.drawText(asciiText, {
        x: finalX,
        y,
        size,
      });
    };

    // Draw employee information (left aligned)
    drawText(employee.fullname || "", 170, 720);
    drawText(employee.id.toString() || "", 170, 702);
    drawText(`${months[salary.month - 1]} ${salary.year}`, 170, 684);
    drawText(formatCurrency(salary.grossSalary || 0), 170, 666);
    drawText(formatCurrency(salary.grossSalary || 0), 170, 648);

    drawText(employee.idNumber || "", 430, 720);
    drawText(employee.jobTitle || "", 430, 702);
    drawText(employee.email || "", 430, 684);
    drawText(
      employee.contractStatus === "official"
        ? "Official Contract"
        : "Temporary Contract",
      430,
      666
    );
    drawText(employee.dependents.toString() || "0", 430, 648);

    // Draw salary details (right aligned)
    drawText(formatCurrency(salary.grossSalary || 0), 420, 580, fontSize, true);
    drawText(formatCurrency(totalBenefits), 412, 564, fontSize, true);
    drawText(salary.workDays?.toString() || "0", 414, 546, fontSize, true);
    drawText(formatCurrency(salary.bonus || 0), 412, 534, fontSize, true);
    drawText(
      formatCurrency(salary.taxableIncome || 0),
      412,
      520,
      fontSize,
      true
    );
    drawText(
      formatCurrency(salary.adjustedSalary + salary.bonus + totalBenefits || 0),
      420,
      482,
      10,
      true
    );

    // Draw deductions (right aligned)
    drawText(
      formatCurrency(salary.socialInsurance || 0),
      560,
      446,
      fontSize,
      true
    );
    drawText(
      formatCurrency(salary.healthInsurance || 0),
      560,
      430,
      fontSize,
      true
    );
    drawText(
      formatCurrency(salary.accidentInsurance || 0),
      560,
      414,
      fontSize,
      true
    );
    drawText(formatCurrency(salary.totalTax || 0), 556, 396, fontSize, true);
    drawText("0", 556, 378, fontSize, true);
    drawText(
      formatCurrency(salary.totalInsurance + salary.totalTax || 0),
      560,
      358,
      fontSize,
      true
    );

    // Draw net salary (right aligned)
    drawText(formatCurrency(salary.netSalary || 0), 450, 324, fontSize, true);

    // Draw bank details (left aligned)
    drawText(employee.bankName || "", 170, 324);
    drawText(employee.bankAccountName || "", 170, 306);
    drawText(employee.bankAccountNumber || "", 170, 288);

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();

    // Create a safe filename
    const safeFilename = `payslip_${salary.employeeId}_${salary.month}_${salary.year}.pdf`;

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename}"`
    );
    res.setHeader("Content-Length", modifiedPdfBytes.length);

    // Send the PDF directly to the user
    res.send(Buffer.from(modifiedPdfBytes));
  } catch (error) {
    console.error("Error generating payslip:", error);
    res.status(500).json({
      message: "Error generating payslip",
      error: error.message,
    });
  }
});

// Helper function to get salary by ID
const getSalaryById = async (id) => {
  try {
    const salaries = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../data/salary_calculations.json"),
        "utf8"
      )
    );
    return salaries.find((s) => s.id === parseInt(id));
  } catch (error) {
    console.error("Error getting salary:", error);
    return null;
  }
};

// Helper function to get employee by ID
const getEmployeeById = async (id) => {
  try {
    const employees = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/employees.json"), "utf8")
    );
    return employees.find((e) => e.id === parseInt(id));
  } catch (error) {
    console.error("Error getting employee:", error);
    return null;
  }
};

// Months array for payment cycle
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

module.exports = router;
