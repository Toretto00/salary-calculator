const express = require("express");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const ExcelJS = require("exceljs");

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

  const taxableIncome =
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
    (otTimeLate > 0 ? otTimeLate * grossSalaryPerHour : 0);

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
    totalOvertime;

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

// Get salary calculation by ID
router.get("/:id", isAuthenticated, (req, res) => {
  try {
    const calculations = JSON.parse(
      fs.readFileSync(salaryCalculationsFile, "utf8")
    );
    const calculation = calculations.find(
      (calc) => calc.id === parseInt(req.params.id)
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

// Export salary calculations to Excel
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

// Calculate and create new salary records (batch processing)
router.post("/calculate", isAuthenticated, (req, res) => {
  try {
    const { employeeIds, month, year, workingDays, daysOff, overtime, bonus } =
      req.body;

    // Basic validation
    if (!employeeIds || !month || !year || workingDays === undefined) {
      return res.status(400).json({
        message:
          "Missing required fields: employeeIds, month, year, workingDays",
      });
    }

    // Get employees data
    let employees = [];
    if (fs.existsSync(employeesFile)) {
      employees = JSON.parse(fs.readFileSync(employeesFile, "utf8"));
    }

    // Get existing salary calculations
    let calculations = [];
    if (fs.existsSync(salaryCalculationsFile)) {
      calculations = JSON.parse(
        fs.readFileSync(salaryCalculationsFile, "utf8")
      );
    }

    const results = [];
    const errors = [];

    // Process each employee
    employeeIds.forEach((employeeId) => {
      try {
        // Find employee
        const employee = employees.find(
          (emp) => emp.id === parseInt(employeeId)
        );
        if (!employee) {
          errors.push({ employeeId, message: "Employee not found" });
          return;
        }

        // Check if salary record already exists for this month/year
        const existingRecord = calculations.find(
          (calc) =>
            calc.employeeId === employee.id &&
            calc.month === parseInt(month) &&
            calc.year === parseInt(year)
        );

        if (existingRecord) {
          errors.push({
            employeeId,
            message: "Salary calculation already exists for this month/year",
            recordId: existingRecord.id,
          });
          return;
        }

        // Combine employee data with salary calculation data
        const calculationData = {
          fullname: employee.fullname,
          salary: employee.salary || 0,
          dependents: employee.dependents || 0,
          allowances: employee.allowances || {},
          probation: employee.probation || "no",
          nationality: employee.nationality || "vietnamese",
          workingDays,
          daysOff: daysOff || 0,
          otTimeSoon: overtime || 0,
          otTimeLate: 0,
          bonus: bonus || 0,
        };

        // Calculate salary
        const result = calculateSalary(calculationData);

        // Create new calculation record
        const newCalculation = {
          id:
            calculations.length > 0
              ? Math.max(...calculations.map((c) => c.id)) + 1
              : 1,
          employeeId: employee.id,
          month: parseInt(month),
          year: parseInt(year),
          ...result,
        };

        // Add to results and calculations
        results.push(newCalculation);
        calculations.push(newCalculation);
      } catch (error) {
        errors.push({ employeeId, message: error.message });
      }
    });

    // Save all calculations
    fs.writeFileSync(
      salaryCalculationsFile,
      JSON.stringify(calculations, null, 2)
    );

    res.status(201).json({
      success: results.length > 0,
      message: `Successfully calculated ${results.length} salary records`,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error calculating salaries:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
