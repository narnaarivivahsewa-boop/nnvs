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
  const escaped = label.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const index = lines.findIndex((line) =>
    new RegExp(
      `^\\s*${escaped}\\s*:`,
      "i"
    ).test(line)
  );

  if (index === -1) {
    return "";
  }

  const match = lines[index].match(
    new RegExp(
      `^\\s*${escaped}\\s*:\\s*(.*)$`,
      "i"
    )
  );

  return clean(match?.[1] ?? "");
}

function extractContacts(
  lines: string[]
): string[] {
  const contactLines = lines.filter((line) =>
    /^\s*Contact Number\s*:/i.test(line)
  );

  const numbers: string[] = [];

  for (const line of contactLines) {
    const found = line.match(/\d{10}/g) ?? [];
    numbers.push(...found);
  }

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

function parseProfile(
  block: string
): ParsedProfile {
  const lines = block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
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
}

function findProfileIds(
  text: string
): string[] {
  const matches =
    text.match(/NNVS-G-\d{4}/gi) ?? [];

  return [
    ...new Set(
      matches.map((id) => id.toUpperCase())
    ),
  ];
}

function checkDuplicates(
  ids: string[]
): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.push(id);
    }

    seen.add(id);
  }

  return [...new Set(duplicates)];
}

function findMissingIds(
  ids: string[]
): string[] {
  const numbers = ids
    .map((id) => {
      const match = id.match(
        /NNVS-G-(\d{4})/i
      );

      return match
        ? Number(match[1])
        : null;
    })
    .filter(
      (value): value is number =>
        value !== null
    );

  if (numbers.length === 0) {
    return [];
  }

  const min = Math.min(...numbers);
  const max = Math.max(...numbers);

  const existing = new Set(numbers);
  const missing: string[] = [];

  for (let i = min; i <= max; i++) {
    if (!existing.has(i)) {
      missing.push(
        `NNVS-G-${String(i).padStart(4, "0")}`
      );
    }
  }

  return missing;
}

async function main() {
  const textPath = path.join(
    process.cwd(),
    "scripts",
    "pdf-text.txt"
  );

  if (!fs.existsSync(textPath)) {
    throw new Error(
      `PDF text file not found:\n${textPath}`
    );
  }

  const text = fs.readFileSync(
    textPath,
    "utf8"
  );

  console.log(
    "\n================================"
  );
  console.log(
    "NNVS G-SERIES FULL DRY RUN"
  );
  console.log(
    "================================\n"
  );

  const ids = findProfileIds(text);

  const duplicates =
    checkDuplicates(ids);

  const missing =
    findMissingIds(ids);

  console.log(
    `Profile IDs detected: ${ids.length}`
  );

  console.log(
    `Duplicate IDs: ${duplicates.length}`
  );

  console.log(
    `Missing IDs in range: ${missing.length}`
  );

  if (duplicates.length > 0) {
    console.log(
      "\nDUPLICATE IDS:"
    );

    console.log(
      duplicates.join("\n")
    );
  }

  if (missing.length > 0) {
    console.log(
      "\nMISSING IDS:"
    );

    console.log(
      missing.join("\n")
    );
  }

  const profiles: ParsedProfile[] = [];
  const errors: string[] = [];

  for (const id of ids) {
    try {
      const block =
        getProfileBlock(
          text,
          id
        );

      if (!block) {
        errors.push(
          `${id}: Profile block not found`
        );

        continue;
      }

      const profile =
        parseProfile(block);

      if (!profile.fullName) {
        errors.push(
          `${id}: Full Name missing`
        );
      }

      if (
        profile.contactNumbers.length === 0
      ) {
        errors.push(
          `${id}: Contact Number missing`
        );
      }

      profiles.push(profile);
    } catch (error) {
      errors.push(
        `${id}: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );
    }
  }

  const profilesWithMultipleNumbers =
    profiles.filter(
      (profile) =>
        profile.contactNumbers.length > 1
    );

  const profilesWithoutNumbers =
    profiles.filter(
      (profile) =>
        profile.contactNumbers.length === 0
    );

  console.log(
    `Profiles parsed: ${profiles.length}`
  );

  console.log(
    `Profiles with multiple numbers: ${profilesWithMultipleNumbers.length}`
  );

  console.log(
    `Profiles without mobile: ${profilesWithoutNumbers.length}`
  );

  console.log(
    `Parser errors: ${errors.length}`
  );

  if (errors.length > 0) {
    console.log(
      "\nPARSER ERRORS:"
    );

    for (const error of errors) {
      console.log(`- ${error}`);
    }
  }

  if (
    profilesWithMultipleNumbers.length > 0
  ) {
    console.log(
      "\nMULTIPLE MOBILE PROFILES:"
    );

    for (
      const profile of
        profilesWithMultipleNumbers
    ) {
      console.log(
        `${profile.profileId} | ${profile.fullName} | ${profile.contactNumbers.join(", ")}`
      );
    }
  }

  const outputPath = path.join(
    process.cwd(),
    "scripts",
    "g-series-parsed.json"
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      profiles,
      null,
      2
    ),
    "utf8"
  );

  console.log(
    "\n================================"
  );
  console.log(
    "DRY RUN COMPLETE"
  );
  console.log(
    "================================"
  );

  console.log(
    `\nSaved parsed data to:`
  );

  console.log(outputPath);

  console.log(
    "\nDATABASE WAS NOT MODIFIED."
  );
}

main().catch((error) => {
  console.error(
    "\nFULL PARSER ERROR:"
  );

  console.error(error);

  process.exit(1);
});