import fs from "fs";

try {
  const envContent = fs.readFileSync(".env", "utf8");
  const lines = envContent.split("\n");
  console.log("=== DATABASE CONFIGURATION INSPECTION ===");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("DATABASE_URL") || trimmed.startsWith("DIRECT_URL")) {
      const parts = trimmed.split("=");
      const key = parts[0];
      const rawUrl = parts.slice(1).join("=").replace(/^["']|["']$/g, "");
      try {
        const u = new URL(rawUrl);
        console.log(`${key}:`);
        console.log(`  - Database Type: ${u.protocol.replace(":", "")}`);
        console.log(`  - Host Domain: ${u.hostname}`);
        console.log(`  - Port: ${u.port || "default"}`);
        console.log(`  - Database Name: ${u.pathname.replace("/", "")}`);
        console.log(`  - Pool / Query Params: ${u.search || "none"}`);
      } catch (err: any) {
        console.log(`${key} failed to parse URL: ${err.message}`);
      }
    }
  }
} catch (e: any) {
  console.error("Could not read .env:", e.message);
}
