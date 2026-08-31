import fs from "fs";
import path from "path";

function clean(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractField(
  lines: string[],
  label: string
): string {
  const index = lines.findIndex((line) =>
    new RegExp(`^\\s*${label}\\s*:`, "i").test(line)
  );

  if (index === -1) {
    return "";
  }

  const line = lines[index];

  const escaped = label.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const match = line.match(
    new RegExp(
      `^\\s*${escaped}\\s*:\\s*(.*)$`,
      "i"
    )
  );

  return clean(match?.[1] ?? "");
}

function extractContacts(lines: string[]): string[] {
  const line = lines.find((x) =>
    /^\s*Contact Number\s*:/i.test(x)
  );

  if (!line) {
    return [];
  }

  const numbers =
    line.match(/\d{10}/g) ?? [];

  return [...new Set(numbers)];
}

function getProfileBlock(
  text: string,
  profileId: string
): string {
  const escaped = profileId.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const regex = new RegExp(
    `Profile ID:\\s*${escaped}[\\s\\S]*?(?=\\nProfile ID:\\s*NNVS-|$)`,
    "i"
  );

  const match = text.match(regex);

  return match?.[0] ?? "";
}

async function main() {
  const textPath = path.join(
    process.cwd(),
    "scripts",
    "pdf-text.txt"
  );

  const text = fs.readFileSync(
    textPath,
    "utf8"
  );

  const block = getProfileBlock(
  text,
  "NNVS-G-0016"
);

  if (!block) {
    throw new Error(
      "NNVS-G-0001 not found."
    );
  }

  const lines = block
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

  const profile = {
    profileId: extractField(
      lines,
      "Profile ID"
    ),

    fullName: extractField(
      lines,
      "Full Name"
    ),

    gender: extractField(
      lines,
      "Gender"
    ),

    maritalStatus: extractField(
      lines,
      "Marital Status"
    ),

    dateOfBirth: extractField(
      lines,
      "Date of Birth"
    ),

    birthPlace: extractField(
      lines,
      "Birth Place"
    ),

    birthTime: extractField(
      lines,
      "Birth Time"
    ),

    height: extractField(
      lines,
      "Height"
    ),

    qualification: extractField(
      lines,
      "Qualification"
    ),

    profession: extractField(
      lines,
      "Profession"
    ),

    income: extractField(
      lines,
      "Income"
    ),

    residence: extractField(
      lines,
      "Residence"
    ),

    diet: extractField(
      lines,
      "Diet"
    ),

    drinking: extractField(
      lines,
      "Drinking"
    ),

    smoking: extractField(
      lines,
      "Smoking"
    ),

    manglikStatus: extractField(
      lines,
      "Manglik Status"
    ),

    fatherName: extractField(
      lines,
      "Father Name"
    ),

    fatherOccupation: extractField(
      lines,
      "Father Occupation"
    ),

    motherName: extractField(
      lines,
      "Mother Name"
    ),

    motherOccupation: extractField(
      lines,
      "Mother Occupation"
    ),

    siblingsDetails: extractField(
      lines,
      "Siblings Details"
    ),

    houseStatus: extractField(
      lines,
      "House Status"
    ),

    familyType: extractField(
      lines,
      "Family Type"
    ),

    propertyAssets: extractField(
      lines,
      "Property / Assets"
    ),

    partnerPreference: extractField(
      lines,
      "Partner Preference"
    ),

    contactNumbers:
      extractContacts(lines),
  };

  console.log(
    "\n================================"
  );
  console.log(
    "LINE-BASED G-0001 TEST"
  );
  console.log(
    "================================\n"
  );

  console.log(
    JSON.stringify(
      profile,
      null,
      2
    )
  );

  const outputPath = path.join(
    process.cwd(),
    "scripts",
    "g0001-line-test.json"
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      profile,
      null,
      2
    ),
    "utf8"
  );

  console.log(
    "\nSaved to:"
  );
  console.log(outputPath);
}

main().catch((error) => {
  console.error(
    "\nLINE PARSER ERROR:"
  );
  console.error(error);
  process.exit(1);
});