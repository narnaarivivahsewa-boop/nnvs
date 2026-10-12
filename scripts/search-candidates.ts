import * as XLSX from "xlsx";

function main() {
  const wb = XLSX.readFile('NNVS (Responses).xlsx');
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }) as any[][];

  const searchNames = ['Akshay', 'Aman manchanda', 'Siddharth Kalia', 'Himanshu', 'Shivam Narang', 'Smriti Batra'];

  for (const name of searchNames) {
    console.log(`\nSearching for "${name}" in NNVS (Responses).xlsx:`);
    let found = 0;
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      const rName = String(r[3] || '');
      const rId = String(r[0] || '');
      if (rName.toLowerCase().includes(name.toLowerCase()) || rId.toLowerCase().includes(name.toLowerCase())) {
        console.log(`  Row ${i + 1}: Col A: "${r[0]}" | Name: "${r[3]}" | Gender: "${r[4]}" | MS: "${r[5]}" | DOB: "${r[6]}"`);
        found++;
      }
    }
    if (found === 0) console.log(`  NOT FOUND in NNVS (Responses).xlsx`);
  }
}

main();
