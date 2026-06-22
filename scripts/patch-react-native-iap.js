const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();

const targetPath = path.join(
  projectRoot,
  "node_modules",
  "react-native-iap",
  "android",
  "src",
  "play",
  "java",
  "com",
  "dooboolab",
  "rniap",
  "RNIapModule.kt",
);

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const original = fs.readFileSync(filePath, "utf8");

  const updated = original.replace(
    /val\s+activity\s*=\s*currentActivity\b/g,
    "val activity = getCurrentActivity()",
  );

  if (updated === original) return false;
  fs.writeFileSync(filePath, updated, "utf8");
  return true;
}

const changed = patchFile(targetPath);
if (changed) {
  // eslint-disable-next-line no-console
  console.log("[postinstall] Patched react-native-iap for RN currentActivity compatibility");
}

