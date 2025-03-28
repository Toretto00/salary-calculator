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

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Get user data
const getUsersData = () => {
  if (!fs.existsSync(usersFile)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(usersFile, "utf8"));
};

// Save user data
const saveUsersData = (users) => {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

// Generate random password (8 characters)
const generateRandomPassword = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
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
        employeeId: user.employeeId,
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
        employeeId: user.employeeId,
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
        employeeId: user.employeeId,
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
        employeeId: user.employeeId,
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

// GET all users (admin only)
router.get("/users", isAuthenticated, isAdmin, (req, res) => {
  try {
    const users = getUsersData();
    // Remove password field from response
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET single user (admin only)
router.get("/users/:id", isAuthenticated, isAdmin, (req, res) => {
  try {
    const users = getUsersData();
    const user = users.find((u) => u.id === parseInt(req.params.id));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove password field from response
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST create new user (admin only)
router.post("/users", isAuthenticated, isAdmin, (req, res) => {
  try {
    const { username, name, role, employeeId } = req.body;

    if (!username || !role) {
      return res
        .status(400)
        .json({ message: "Username and role are required" });
    }

    const users = getUsersData();

    // Check if username already exists
    if (users.some((u) => u.username === username)) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Generate random password
    const randomPassword = generateRandomPassword();
    const hashedPassword = bcrypt.hashSync(randomPassword, 10);

    // Get next available ID
    const nextId =
      users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;

    const newUser = {
      id: nextId,
      username,
      password: hashedPassword,
      name: name || username,
      role,
      employeeId: employeeId || null,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsersData(users);

    // Remove password from response but include the generated password
    // so admin can communicate it to the user
    const { password, ...safeUser } = newUser;

    res.status(201).json({
      user: safeUser,
      generatedPassword: randomPassword,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT update user (admin only)
router.put("/users/:id", isAuthenticated, isAdmin, (req, res) => {
  try {
    const { name, role, password } = req.body;
    const userId = parseInt(req.params.id);

    const users = getUsersData();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user fields
    if (name) users[userIndex].name = name;
    if (role) users[userIndex].role = role;
    if (password) users[userIndex].password = bcrypt.hashSync(password, 10);

    users[userIndex].updatedAt = new Date().toISOString();

    saveUsersData(users);

    // Remove password from response
    const { password: pwd, ...safeUser } = users[userIndex];

    res.json(safeUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE user (admin only)
router.delete("/users/:id", isAuthenticated, isAdmin, (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Prevent deleting the only admin
    const users = getUsersData();
    const userToDelete = users.find((u) => u.id === userId);

    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      userToDelete.role === "admin" &&
      users.filter((u) => u.role === "admin").length <= 1
    ) {
      return res
        .status(400)
        .json({ message: "Cannot delete the only admin user" });
    }

    const updatedUsers = users.filter((user) => user.id !== userId);
    saveUsersData(updatedUsers);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST create user from employee (admin only)
router.post(
  "/users/create-from-employee",
  isAuthenticated,
  isAdmin,
  (req, res) => {
    try {
      const { employeeId, role } = req.body;

      if (!employeeId || !role) {
        return res
          .status(400)
          .json({ message: "Employee ID and role are required" });
      }

      // Read employees data
      const employeesFile = path.join(__dirname, "../data/employees.json");
      const employees = JSON.parse(fs.readFileSync(employeesFile, "utf8"));

      const employee = employees.find((e) => e.id === parseInt(employeeId));
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      if (!employee.email) {
        return res
          .status(400)
          .json({ message: "Employee has no email address" });
      }

      const users = getUsersData();

      // Check if user already exists with this email as username
      if (users.some((u) => u.username === employee.email)) {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      }

      // Generate random password
      const randomPassword = generateRandomPassword();
      const hashedPassword = bcrypt.hashSync(randomPassword, 10);

      // Get next available ID
      const nextId =
        users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;

      const newUser = {
        id: nextId,
        username: employee.email,
        password: hashedPassword,
        name: employee.fullname,
        role,
        employeeId: employee.id,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveUsersData(users);

      // Remove password from response but include the generated password
      const { password, ...safeUser } = newUser;

      res.status(201).json({
        user: safeUser,
        generatedPassword: randomPassword,
      });
    } catch (error) {
      console.error("Error creating user from employee:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// POST reset user password (admin only)
router.post(
  "/users/:id/reset-password",
  isAuthenticated,
  isAdmin,
  (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      const users = getUsersData();
      const userIndex = users.findIndex((u) => u.id === userId);

      if (userIndex === -1) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate new random password
      const randomPassword = generateRandomPassword();
      users[userIndex].password = bcrypt.hashSync(randomPassword, 10);
      users[userIndex].updatedAt = new Date().toISOString();

      saveUsersData(users);

      res.json({
        message: "Password reset successful",
        username: users[userIndex].username,
        newPassword: randomPassword,
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// POST change own password (for any authenticated user)
router.post("/change-password", isAuthenticated, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
      });
    }

    const users = getUsersData();
    const userIndex = users.findIndex((u) => u.id === req.user.id);

    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isPasswordValid = bcrypt.compareSync(
      currentPassword,
      users[userIndex].password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password
    users[userIndex].password = bcrypt.hashSync(newPassword, 10);
    users[userIndex].updatedAt = new Date().toISOString();

    saveUsersData(users);

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
