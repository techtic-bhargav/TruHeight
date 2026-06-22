// Load .env before Metro runs Babel. Release APK/AAB builds invoke Metro from Gradle without Expo CLI,
// so EXPO_PUBLIC_* would otherwise be missing and babel-preset-expo inlines undefined for production.
const path = require("path");
const fs = require("fs");

(function loadEnvFromDotEnvFile() {
  try {
    const envPath = path.join(__dirname, ".env");
    if (!fs.existsSync(envPath)) return;
    const text = fs.readFileSync(envPath, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore — fall back to embedded defaults in app.json / env.ts
  }
})();

const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
