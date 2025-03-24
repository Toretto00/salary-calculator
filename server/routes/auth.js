const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const usersFile = path.join(__dirname, "../data/users.json");

// Config
const JWT_SECRET = process.env.JWT_SECRET || "salary-calculator-secret-key";
const TOKEN_EXPIRY = "8h"; // 8 hours

// Middleware to check if user is logged in
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

    // Check if session is still valid (less than 1 hour old)
    if (decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ message: "Session expired" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Get user data
const getUsersData = () => {
  if (!fs.existsSync(usersFile)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(usersFile, "utf8"));
};

// Login route
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  const users = getUsersData();
  const user = users.find((u) => u.username === username);

  if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  // For development purposes only - if password is stored as plaintext
  if (user.password === password) {
    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  }

  // Compare password with hashed password
  try {
    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Password verification error:", error);
    res.status(500).json({ message: "Error during login process" });
  }
});

// Validate token route
router.get("/validate", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    res.json({
      user: {
        id: verified.id,
        username: verified.username,
        name: verified.name,
        role: verified.role,
      },
    });
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
});

// Check if user is authenticated
router.get("/check", isAuthenticated, (req, res) => {
  res.json({ user: req.user });
});

// Logout route
router.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
