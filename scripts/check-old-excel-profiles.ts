import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

async function main() {
  const filePath = "NNVS (Responses).xlsx";

  console.log("\n======================================");
  console.log("NNVS EXCEL PROFILE DRY RUN");
  console.log("NO DATA WILL BE DELETED");
  console.log("======================================\n");

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
  });

  const excelProfileIds = [
    ...new Set(
      rows
        .map((row) => String(row["Profile ID"] || "").trim())
        .filter(Boolean)
    ),
  ];

  console.log("Excel rows:", rows.length);
  console.log("Unique Profile IDs:", excelProfileIds.length);

  const profiles = await prisma.profile.findMany({
    where: {
      profileId: {
        in: excelProfileIds,
      },
    },
    select: {
      id: true,
      profileId: true,
      userId: true,
      user: {
        select: {
          id: true,
          fullName: true,
          mobile: true,
        },
      },
    },
    orderBy: {
      profileId: "asc",
    },
  });

  const foundIds = new Set(profiles.map((p) => p.profileId));

  const notFound = excelProfileIds.filter(
    (id) => !foundIds.has(id)
  );

  console.log("\n======================================");
  console.log("RESULT");
  console.log("======================================");

  console.log("Excel unique IDs :", excelProfileIds.length);
  console.log("Database matches :", profiles.length);
  console.log("Not found        :", notFound.length);

  console.log("\n======================================");
  console.log("MATCHED PROFILES");
  console.log("======================================\n");

  for (const profile of profiles) {
    console.log(
      `${profile.profileId} | ${profile.user.fullName || "-"} | ${profile.user.mobile}`
    );
  }

  if (notFound.length > 0) {
    console.log("\n======================================");
    console.log("NOT FOUND IN DATABASE");
    console.log("======================================\n");

    for (const id of notFound) {
      console.log(id);
    }
  }

  console.log("\n======================================");
  console.log("DRY RUN COMPLETE");
  console.log("NOTHING WAS DELETED");
  console.log("======================================\n");
}

main()
  .catch((error) => {
    console.error("\nDRY RUN ERROR:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });