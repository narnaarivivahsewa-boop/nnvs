import fs from "fs";
import path from "path";

type ParsedProfile = {
  profileId: string;
  fullName: string;
  gender: string;
  maritalStatus: string;
  dateOfBirth: string;
  birthPlace: string;
  birthTime: string;
  height: string;
  qualification: string;
  profession: string;
  income: string;
  residence: string;
  diet: string;
  drinking: string;
  smoking: string;
  manglikStatus: string;
  fatherName: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  siblingsDetails: string;
  houseStatus: string;
  familyType: string;
  propertyAssets: string;
  partnerPreference: string;
  contactNumbers: string[];
};

function clean(value: string | undefined): string {
  return (value ?? "")
    .replace(/\r/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getField(
  block: string,
  label: string,
  nextLabels: string[]
): string {
  const escapedLabel = label.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const escapedNextLabels = nextLabels
    .map((x) =>
      x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    .join("|");

  const regex = new RegExp(
    `(?:^|\\n)\\s*${escapedLabel}\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*(?:${escapedNextLabels})\\s*(?::|$))`,
    "i"
  );

  const match = block.match(regex);

  return clean(match?.[1]);
}

function getContactNumbers(block: string): string[] {
  const match = block.match(
    /Contact Number\s*:\s*([^\n]+)/i
  );

  if (!match) {
    return [];
  }

  const numbers = match[1].match(/\d{10}/g) ?? [];

  return [...new Set(numbers)];
}

function parseProfile(block: string): ParsedProfile {
  const labels = [
    "Profile ID",
    "Full Name",
    "Gender",
    "Marital Status",
    "Date of Birth",
    "Birth Place",
    "Birth Time",
    "Height",
    "Qualification",
    "Profession",
    "Income",
    "Residence",
    "Diet",
    "Drinking",
    "Smoking",
    "Manglik Status",
    "Family Details",
    "Father Name",
    "Father Occupation",
    "Mother Name",
    "Mother Occupation",
    "Siblings Details",
    "Family Information",
    "House Status",
    "Family Type",
    "Property / Assets",
    "Partner Preference",
    "Contact Number",
  ];

  return {
    profileId: getField(block, "Profile ID", labels),
    fullName: getField(block, "Full Name", labels),
    gender: getField(block, "Gender", labels),
    maritalStatus: getField(block, "Marital Status", labels),
    dateOfBirth: getField(block, "Date of Birth", labels),
    birthPlace: getField(block, "Birth Place", labels),
    birthTime: getField(block, "Birth Time", labels),
    height: getField(block, "Height", labels),
    qualification: getField(block, "Qualification", labels),
    profession: getField(block, "Profession", labels),
    income: getField(block, "Income", labels),
    residence: getField(block, "Residence", labels),
    diet: getField(block, "Diet", labels),
    drinking: getField(block, "Drinking", labels),
    smoking: getField(block, "Smoking", labels),
    manglikStatus: getField(block, "Manglik Status", labels),
    fatherName: getField(block, "Father Name", labels),
    fatherOccupation: getField(block, "Father Occupation", labels),
    motherName: getField(block, "Mother Name", labels),
    motherOccupation: getField(block, "Mother Occupation", labels),
    siblingsDetails: getField(block, "Siblings Details", labels),
    houseStatus: getField(block, "House Status", labels),
    familyType: getField(block, "Family Type", labels),
    propertyAssets: getField(block, "Property / Assets", labels),
    partnerPreference: getField(block, "Partner Preference", labels),
    contactNumbers: getContactNumbers(block),
  };
}

async function main() {
  const textPath = path.join(
    process.cwd(),
    "scripts",
    "pdf-text.txt"
  );

  if (!fs.existsSync(textPath)) {
    throw new Error(`File not found: ${textPath}`);
  }

  const text = fs.readFileSync(textPath, "utf8");

  const match = text.match(
    /Profile ID:\s*NNVS-G-0001[\s\S]*?(?=\nProfile ID:\s*NNVS-G-0002|\s*$)/i
  );

  if (!match) {
    throw new Error("NNVS-G-0001 not found.");
  }

  const profile = parseProfile(match[0]);

  console.log("\n================================");
  console.log("G-0001 PARSER DRY RUN");
  console.log("================================\n");

  console.log(JSON.stringify(profile, null, 2));

  const outputPath = path.join(
    process.cwd(),
    "scripts",
    "g0001.json"
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(profile, null, 2),
    "utf8"
  );

  console.log("\n================================");
  console.log("DRY RUN COMPLETE");
  console.log("================================");
  console.log(`Saved to: ${outputPath}`);
}

main().catch((error) => {
  console.error("\nPARSER ERROR:");
  console.error(error);
  process.exit(1);
});