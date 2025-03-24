const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const salaryFile = path.join(__dirname, "../data/salary.json");
const employeesFile = path.join(__dirname, "../data/employees.json");

// Helper to read salary data
const getSalaryData = () => {
  if (!fs.existsSync(salaryFile)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(salaryFile, "utf8"));
};

// Helper to read employees data
const getEmployeesData = () => {
  if (!fs.existsSync(employeesFile)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(employeesFile, "utf8"));
};

// Get monthly summary report
router.get("/monthly", (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const salaryRecords = getSalaryData().filter((record) => {
      return record.month === parseInt(month) && record.year === parseInt(year);
    });

    if (salaryRecords.length === 0) {
      return res.json({
        month: parseInt(month),
        year: parseInt(year),
        totalEmployees: 0,
        totalGrossSalary: 0,
        totalNetSalary: 0,
        totalTax: 0,
        totalInsurance: 0,
        departments: [],
        records: [],
      });
    }

    // Get employee data for department info
    const employees = getEmployeesData();

    // Enhance records with department info
    const enhancedRecords = salaryRecords.map((record) => {
      const employee = employees.find((emp) => emp.id === record.employeeId);
      return {
        ...record,
        department: employee ? employee.department : "Unknown",
      };
    });

    // Calculate totals
    const totalGrossSalary = enhancedRecords.reduce(
      (sum, record) => sum + record.grossSalary,
      0
    );
    const totalNetSalary = enhancedRecords.reduce(
      (sum, record) => sum + record.netSalary,
      0
    );
    const totalTax = enhancedRecords.reduce(
      (sum, record) => sum + record.tax,
      0
    );
    const totalInsurance = enhancedRecords.reduce(
      (sum, record) => sum + record.insurance.total,
      0
    );

    // Group by department for departmental summary
    const departmentSummary = enhancedRecords.reduce((result, record) => {
      const dept = record.department;

      if (!result[dept]) {
        result[dept] = {
          department: dept,
          employeeCount: 0,
          totalGrossSalary: 0,
          totalNetSalary: 0,
        };
      }

      result[dept].employeeCount++;
      result[dept].totalGrossSalary += record.grossSalary;
      result[dept].totalNetSalary += record.netSalary;

      return result;
    }, {});

    // Convert department summary to array
    const departments = Object.values(departmentSummary);

    res.json({
      month: parseInt(month),
      year: parseInt(year),
      totalEmployees: enhancedRecords.length,
      totalGrossSalary,
      totalNetSalary,
      totalTax,
      totalInsurance,
      departments,
      records: enhancedRecords,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error generating monthly report",
      error: error.message,
    });
  }
});

// Get yearly summary report
router.get("/yearly", (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ message: "Year is required" });
    }

    const salaryRecords = getSalaryData().filter((record) => {
      return record.year === parseInt(year);
    });

    if (salaryRecords.length === 0) {
      return res.json({
        year: parseInt(year),
        totalEmployees: 0,
        totalGrossSalary: 0,
        totalNetSalary: 0,
        totalTax: 0,
        totalInsurance: 0,
        monthlySummary: [],
        departmentSummary: [],
      });
    }

    // Get employee data for department info
    const employees = getEmployeesData();

    // Enhance records with department info
    const enhancedRecords = salaryRecords.map((record) => {
      const employee = employees.find((emp) => emp.id === record.employeeId);
      return {
        ...record,
        department: employee ? employee.department : "Unknown",
      };
    });

    // Calculate totals
    const totalGrossSalary = enhancedRecords.reduce(
      (sum, record) => sum + record.grossSalary,
      0
    );
    const totalNetSalary = enhancedRecords.reduce(
      (sum, record) => sum + record.netSalary,
      0
    );
    const totalTax = enhancedRecords.reduce(
      (sum, record) => sum + record.tax,
      0
    );
    const totalInsurance = enhancedRecords.reduce(
      (sum, record) => sum + record.insurance.total,
      0
    );

    // Count unique employees
    const uniqueEmployees = new Set(
      enhancedRecords.map((record) => record.employeeId)
    );

    // Group by month for monthly summary
    const monthlySummary = Array.from({ length: 12 }, (_, i) => {
      const monthRecords = enhancedRecords.filter(
        (record) => record.month === i + 1
      );

      return {
        month: i + 1,
        employeeCount: monthRecords.length,
        totalGrossSalary: monthRecords.reduce(
          (sum, record) => sum + record.grossSalary,
          0
        ),
        totalNetSalary: monthRecords.reduce(
          (sum, record) => sum + record.netSalary,
          0
        ),
        totalTax: monthRecords.reduce((sum, record) => sum + record.tax, 0),
        totalInsurance: monthRecords.reduce(
          (sum, record) => sum + record.insurance.total,
          0
        ),
      };
    });

    // Group by department for departmental summary
    const departmentSummary = enhancedRecords.reduce((result, record) => {
      const dept = record.department;

      if (!result[dept]) {
        result[dept] = {
          department: dept,
          employeeCount: new Set(),
          totalGrossSalary: 0,
          totalNetSalary: 0,
        };
      }

      result[dept].employeeCount.add(record.employeeId);
      result[dept].totalGrossSalary += record.grossSalary;
      result[dept].totalNetSalary += record.netSalary;

      return result;
    }, {});

    // Convert department summary to array and replace Sets with counts
    const departments = Object.values(departmentSummary).map((dept) => ({
      ...dept,
      employeeCount: dept.employeeCount.size,
    }));

    res.json({
      year: parseInt(year),
      totalEmployees: uniqueEmployees.size,
      totalGrossSalary,
      totalNetSalary,
      totalTax,
      totalInsurance,
      monthlySummary,
      departmentSummary: departments,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error generating yearly report",
      error: error.message,
    });
  }
});

// Get employee salary history
router.get("/employee/:id", (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    const { year } = req.query;

    // Get employee data
    const employees = getEmployeesData();
    const employee = employees.find((emp) => emp.id === employeeId);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Get salary records for this employee
    let salaryRecords = getSalaryData().filter(
      (record) => record.employeeId === employeeId
    );

    // Filter by year if provided
    if (year) {
      salaryRecords = salaryRecords.filter(
        (record) => record.year === parseInt(year)
      );
    }

    // Sort by date
    salaryRecords.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    // Calculate totals
    const totalGrossSalary = salaryRecords.reduce(
      (sum, record) => sum + record.grossSalary,
      0
    );
    const totalNetSalary = salaryRecords.reduce(
      (sum, record) => sum + record.netSalary,
      0
    );
    const totalTax = salaryRecords.reduce((sum, record) => sum + record.tax, 0);
    const totalInsurance = salaryRecords.reduce(
      (sum, record) => sum + record.insurance.total,
      0
    );

    // Calculate averages
    const avgGrossSalary =
      salaryRecords.length > 0 ? totalGrossSalary / salaryRecords.length : 0;
    const avgNetSalary =
      salaryRecords.length > 0 ? totalNetSalary / salaryRecords.length : 0;

    res.json({
      employee: {
        id: employee.id,
        name: employee.name,
        position: employee.position,
        department: employee.department,
        joinDate: employee.joinDate,
      },
      summary: {
        recordCount: salaryRecords.length,
        totalGrossSalary,
        totalNetSalary,
        totalTax,
        totalInsurance,
        avgGrossSalary,
        avgNetSalary,
      },
      records: salaryRecords,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving employee salary history",
      error: error.message,
    });
  }
});

module.exports = router;
