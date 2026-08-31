import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

async function main() {
  const pdfPath = path.join(process.cwd(), "g-series.pdf");
  const outputPath = path.join(
    process.cwd(),
    "scripts",
    "pdf-text.txt"
  );

  console.log("Reading PDF:");
  console.log(pdfPath);

  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF not found: ${pdfPath}`);
  }

  const buffer = fs.readFileSync(pdfPath);

  const parser = new PDFParse({
    data: buffer,
  });

  try {
    const result = await parser.getText();

    fs.writeFileSync(
      outputPath,
      result.text,
      "utf8"
    );

    console.log("\n==============================");
    console.log("PDF EXTRACTION SUCCESS");
    console.log("==============================");

    console.log("Total text length:", result.text.length);

    console.log("\nSaved full extracted text to:");
    console.log(outputPath);

  } finally {
    await parser.destroy();
  }
}

main().catch((error) => {
  console.error("\nPDF TEST ERROR:");
  console.error(error);
  process.exit(1);
});