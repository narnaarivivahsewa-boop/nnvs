import fs from "fs";

function main() {
  const data = JSON.parse(fs.readFileSync("scripts/audit-pipeline-results.json", "utf8"));
  const gender = data.discrepancies.filter((d: any) => d.field.startsWith("Gender"));
  const ms = data.discrepancies.filter((d: any) => d.field === "Marital Status");
  const dob = data.discrepancies.filter((d: any) => d.field === "Date of Birth");
  const loc = data.discrepancies.filter((d: any) => d.field === "Work Location vs Designation");

  console.log("================================================================================");
  console.log("GENDER DISCREPANCIES / PREFIX CONFLICTS (" + gender.length + ")");
  console.log("================================================================================");
  console.log(JSON.stringify(gender, null, 2));

  console.log("\n================================================================================");
  console.log("MARITAL STATUS DISCREPANCIES (" + ms.length + ")");
  console.log("================================================================================");
  console.log(JSON.stringify(ms, null, 2));

  console.log("\n================================================================================");
  console.log("DOB SAMPLES (First 5 of " + dob.length + ")");
  console.log("================================================================================");
  console.log(JSON.stringify(dob.slice(0, 5), null, 2));

  console.log("\n================================================================================");
  console.log("LOCATION VS DESIGNATION SAMPLES (First 5 of " + loc.length + ")");
  console.log("================================================================================");
  console.log(JSON.stringify(loc.slice(0, 5), null, 2));
}

main();
