import fs from "fs";

function main() {
  const data = JSON.parse(fs.readFileSync("scripts/full-dataset-correction-preview.json", "utf8"));
  console.log("=== TOTALS ===");
  console.log(data.totals);

  console.log("\n=== SAMPLE PROFILES BEFORE/AFTER ===");
  // Sample 1: Bhopender Dhankar (NNVS-B-0005)
  // Sample 2: Chirag Dawar (NNVS-B-0001)
  // Sample 3: Gunjan Sehgal (NNVS-G-0001)
  // Sample 4: Dr Esh kumar gulati (NNVS-B-0004)
  // Sample 5: Dinkar Sehgal (NNVS-B-0006)
  const sampleIds = ["NNVS-B-0005", "NNVS-B-0001", "NNVS-G-0001", "NNVS-B-0004", "NNVS-B-0006"];
  for (const id of sampleIds) {
    const p = data.summaries.find((s: any) => s.legacyProfileId === id);
    if (p) {
      console.log(`\nProfile: [${p.legacyProfileId}] ${p.candidateName} (${p.sourceStatus})`);
      p.changes.forEach((c: any) => {
        console.log(`  - ${c.fieldName}:`);
        console.log(`      Current Value : ${c.currentValue}`);
        console.log(`      Source Value  : ${c.sourceValue}`);
        console.log(`      Proposed Fix  : ${c.proposedValue}`);
      });
    }
  }

  // Unmatched samples
  const unmatched = data.summaries.filter((s: any) => s.sourceStatus === "NO_RELIABLE_SOURCE_MATCH");
  console.log(`\n=== UNMATCHED PROFILES (${unmatched.length} total) ===`);
  console.log("Sample unmatched profiles from live sheet sync (first 8):");
  unmatched.slice(0, 8).forEach((u: any) => {
    console.log(`  - [${u.legacyProfileId || 'NO_LEGACY_ID'}] ${u.candidateName} (DB ID: ${u.profileId})`);
  });
}

main();
