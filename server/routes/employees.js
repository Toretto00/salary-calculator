const express = require("express");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const router = express.Router();
const employeesFile = path.join(__dirname, "../data/employees.json");

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  console.log(token);

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "salary-calculator-jwt-secret"
    );
    console.log(decoded);
    req.user = decoded;
    console.log(req.user);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Get all employees
router.get("/", isAuthenticated, (req, res) => {
  try {
    if (!fs.existsSync(employeesFile)) {
      return res.json([]);
    }

    const employees = JSON.parse(fs.readFileSync(employeesFile, "utf8"));
    res.json(employees);
  } catch (error) {
    console.error("Error getting employees:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get employee by ID
router.get("/:id", isAuthenticated, (req, res) => {
  try {
    const employees = JSON.parse(fs.readFileSync(employeesFile, "utf8"));
    const employee = employees.find(
      (emp) => emp.id === parseInt(req.params.id)
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);
  } catch (error) {
    console.error("Error getting employee:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create employee
router.post("/", isAuthenticated, (req, res) => {
  try {
    let employees = [];
    if (fs.existsSync(employeesFile)) {
      employees = JSON.parse(fs.readFileSync(employeesFile, "utf8"));
    }

    const newEmployee = {
      id:
        employees.length > 0 ? Math.max(...employees.map((e) => e.id)) + 1 : 1,
      fullname: req.body.fullname,
      salary: req.body.salary || 0,
      dependents: req.body.dependents || 0,
      probation: req.body.probation || "no",
      nationality: req.body.nationality || "vietnamese",
      idNumber: req.body.idNumber || "",
      jobTitle: req.body.jobTitle || "",
      email: req.body.email || "",
      contractStatus: req.body.contractStatus || "official",
      bankName: req.body.bankName || "",
      bankAccountName: req.body.bankAccountName || "",
      bankAccountNumber: req.body.bankAccountNumber || "",
      allowances: req.body.allowances || {
        food: 0,
        clothes: 0,
        parking: 0,
        fuel: 0,
        houseRent: 0,
        phone: 0,
      },
      createdAt: new Date().toISOString(),
    };

    employees.push(newEmployee);
    fs.writeFileSync(employeesFile, JSON.stringify(employees, null, 2));

    res.status(201).json(newEmployee);
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update employee
router.put("/:id", isAuthenticated, (req, res) => {
  try {
    let employees = [];
    if (fs.existsSync(employeesFile)) {
      employees = JSON.parse(fs.readFileSync(employeesFile, "utf8"));
    }

    const employeeIndex = employees.findIndex(
      (emp) => emp.id === parseInt(req.params.id)
    );

    if (employeeIndex === -1) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Update employee data
    employees[employeeIndex] = {
      ...employees[employeeIndex],
      fullname: req.body.fullname || employees[employeeIndex].fullname,
      salary:
        req.body.salary !== undefined
          ? req.body.salary
          : employees[employeeIndex].salary || 0,
      dependents:
        req.body.dependents !== undefined
          ? req.body.dependents
          : employees[employeeIndex].dependents,
      probation: req.body.probation || employees[employeeIndex].probation,
      nationality: req.body.nationality || employees[employeeIndex].nationality,
      idNumber: req.body.idNumber || employees[employeeIndex].idNumber,
      jobTitle: req.body.jobTitle || employees[employeeIndex].jobTitle,
      email: req.body.email || employees[employeeIndex].email,
      contractStatus:
        req.body.contractStatus || employees[employeeIndex].contractStatus,
      bankName: req.body.bankName || employees[employeeIndex].bankName,
      bankAccountName:
        req.body.bankAccountName || employees[employeeIndex].bankAccountName,
      bankAccountNumber:
        req.body.bankAccountNumber ||
        employees[employeeIndex].bankAccountNumber,
      allowances: req.body.allowances ||
        employees[employeeIndex].allowances || {
          food: 0,
          clothes: 0,
          parking: 0,
          fuel: 0,
          houseRent: 0,
          phone: 0,
        },
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(employeesFile, JSON.stringify(employees, null, 2));

    res.json(employees[employeeIndex]);
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete employee
router.delete("/:id", isAuthenticated, (req, res) => {
  try {
    if (!fs.existsSync(employeesFile)) {
      return res.status(404).json({ message: "No employees found" });
    }

    let employees = JSON.parse(fs.readFileSync(employeesFile, "utf8"));
    const initialLength = employees.length;

    employees = employees.filter((emp) => emp.id !== parseInt(req.params.id));

    if (employees.length === initialLength) {
      return res.status(404).json({ message: "Employee not found" });
    }

    fs.writeFileSync(employeesFile, JSON.stringify(employees, null, 2));

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
