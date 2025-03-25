const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "salary-calculator-secret-key";

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "salary-calculator-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 3600000, // 1 hour
      httpOnly: true,
    },
  })
);

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid token" });
  }
};

// Ensure data directory exists
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure employees.json exists
const employeesFile = path.join(dataDir, "employees.json");
if (!fs.existsSync(employeesFile)) {
  fs.writeFileSync(employeesFile, JSON.stringify([], null, 2));
}

// Ensure users.json exists with default admin
const usersFile = path.join(dataDir, "users.json");
if (!fs.existsSync(usersFile)) {
  const adminPassword = bcrypt.hashSync("admin123", 10);
  const defaultUsers = [
    {
      id: 1,
      username: "admin",
      password: adminPassword,
      role: "admin",
    },
  ];
  fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2));
}

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/employees", authenticateToken, require("./routes/employees"));
app.use("/api/salary", authenticateToken, require("./routes/salary"));
app.use("/api/reports", authenticateToken, require("./routes/reports"));

// Status route
app.get("/api/status", (req, res) => {
  res.json({ status: "API is running", timestamp: new Date() });
});

// Production setup
if (process.env.NODE_ENV === "production") {
  // Serve static files from the React frontend app
  app.use(express.static(path.join(__dirname, "../client/build")));

  // Anything that doesn't match the above, send back index.html
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build/index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing
