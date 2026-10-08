import * as XLSX from 'xlsx';

async function main() {
  const wb = XLSX.readFile('NNVS (Responses).xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log('Total rows in XLSX (including header):', data.length);
  const header = data[0];
  console.log('Header columns:', header.length);
  
  let validRows = 0;
  let emptyRows = 0;
  const legacyIds = new Map<string, number[]>();
  const mobiles = new Map<string, number[]>();
  const emails = new Map<string, number[]>();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0 || row.every(cell => cell === undefined || cell === null || String(cell).trim() === '')) {
      emptyRows++;
      continue;
    }
    validRows++;
    const legId = String(row[0] || '').trim();
    const email = String(row[2] || '').trim().toLowerCase();
    const name = String(row[3] || '').trim();
    const mob = String(row[25] || '').trim();

    if (legId) {
      if (!legacyIds.has(legId)) legacyIds.set(legId, []);
      legacyIds.get(legId)!.push(i + 1);
    }
    if (mob) {
      if (!mobiles.has(mob)) mobiles.set(mob, []);
      mobiles.get(mob)!.push(i + 1);
    }
    if (email) {
      if (!emails.has(email)) emails.set(email, []);
      emails.get(email)!.push(i + 1);
    }
  }

  console.log('Valid data rows:', validRows);
  console.log('Empty rows:', emptyRows);

  console.log('\n--- DUPLICATE LEGACY IDS (Col A) ---');
  let dupLegCount = 0;
  for (const [id, rows] of legacyIds.entries()) {
    if (rows.length > 1) {
      dupLegCount++;
      console.log(`Legacy ID "${id}" appears ${rows.length} times in rows:`, rows.join(', '));
    }
  }
  console.log('Total duplicate legacy IDs:', dupLegCount);

  console.log('\n--- DUPLICATE MOBILES (Col Z) ---');
  let dupMobCount = 0;
  for (const [mob, rows] of mobiles.entries()) {
    if (rows.length > 1) {
      dupMobCount++;
      if (dupMobCount <= 10) {
        console.log(`Mobile "${mob}" appears ${rows.length} times in rows:`, rows.join(', '));
      }
    }
  }
  console.log('Total duplicate mobile groups:', dupMobCount);

  console.log('\n--- DUPLICATE EMAILS (Col C) ---');
  let dupEmailCount = 0;
  for (const [email, rows] of emails.entries()) {
    if (rows.length > 1) {
      dupEmailCount++;
      if (dupEmailCount <= 10) {
        console.log(`Email "${email}" appears ${rows.length} times in rows:`, rows.join(', '));
      }
    }
  }
  console.log('Total duplicate email groups:', dupEmailCount);
}

main().catch(console.error);
