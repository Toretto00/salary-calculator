const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Ensure data directory exists
const dataDir = path.join(__dirname, "server/data");
if (!fs.existsSync(dataDir)) {
  console.log("Creating data directory...");
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize data files
const initializeDataFile = (fileName, initialContent = []) => {
  const filePath = path.join(dataDir, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`Creating ${fileName}...`);
    fs.writeFileSync(filePath, JSON.stringify(initialContent, null, 2));
  }
};

// Create initial users data
const initialUsers = [
  {
    id: 1,
    username: "admin",
    password: "admin123", // In a real app, this would be hashed
    name: "Admin User",
    role: "admin",
  },
];

// Initialize data files
initializeDataFile("users.json", initialUsers);
initializeDataFile("employees.json");
initializeDataFile("salary.json");

// Install dependencies
try {
  console.log("\nInstalling server dependencies...");
  execSync("cd server && npm install", { stdio: "inherit" });

  console.log("\nInstalling client dependencies...");
  execSync("cd client && npm install", { stdio: "inherit" });

  console.log("\n✅ Setup completed successfully!");
  console.log("\nTo start the application:");
  console.log("1. Start the server:");
  console.log("   cd server && npm run dev");
  console.log("2. In a new terminal, start the client:");
  console.log("   cd client && npm start");
  console.log("\nDefault login credentials:");
  console.log("Username: admin");
  console.log("Password: admin123");
} catch (error) {
  console.error("\n❌ Error during setup:", error.message);
  process.exit(1);
}
