const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;
const usersFilePath = path.join(__dirname, "data", "users.json");

// Read the users file
try {
  const users = JSON.parse(fs.readFileSync(usersFilePath, "utf8"));

  // Hash each user's password if it's not already hashed
  const updatedUsers = users.map((user) => {
    // Skip already hashed passwords (they typically start with $2b$)
    if (user.password && !user.password.startsWith("$2b$")) {
      console.log(`Hashing password for user: ${user.username}`);
      return {
        ...user,
        password: bcrypt.hashSync(user.password, SALT_ROUNDS),
      };
    }
    return user;
  });

  // Write the updated users back to the file
  fs.writeFileSync(usersFilePath, JSON.stringify(updatedUsers, null, 2));
  console.log("All passwords have been hashed successfully!");
} catch (error) {
  console.error("Error processing users:", error);
}
