const { execSync } = require("child_process");

console.log("🔧 Forcing ownership and permissions before npm install...");

// Change ownership of the build directory to the 'expo' user.
// This ensures the user running the build has full control.
execSync("sudo chown -R expo:staff /Users/expo/workingdir/build", {
  stdio: "inherit",
});

// Grant full read, write, and execute permissions to all users.
// This is a safe practice in the isolated, single-use EAS environment.
execSync("sudo chmod -R 777 /Users/expo/workingdir/build", {
  stdio: "inherit",
});

console.log("✅ Permissions adjusted successfully.");

// Now, proceed with your original commands to clean and install.
execSync("rm -rf node_modules package-lock.json", { stdio: "inherit" });
execSync("npm install --legacy-peer-deps --unsafe-perm=true", {
  stdio: "inherit",
});

console.log("📦 Dependencies installed successfully.");
