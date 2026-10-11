import assert from "assert";

export function formatBirthTime(raw?: string | number | null): string {
  if (!raw) return "-";
  const str = String(raw).trim();
  if (!str || str === "-" || str.toLowerCase() === "null" || str.toLowerCase() === "undefined") {
    return "-";
  }

  // 1. If decimal number / fraction (Excel serial time e.g. 0.55208333333)
  const num = Number(str);
  if (!isNaN(num) && num >= 0 && num < 1) {
    const totalMinutes = Math.round(num * 24 * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
  }

  // 2. If legacy date string containing time: e.g. "Sat Dec 30 1899 13:15:00 GMT+0521..."
  const legacyMatch = str.match(/(?:1899|1900).*?(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (legacyMatch) {
    const h = parseInt(legacyMatch[1], 10);
    const m = parseInt(legacyMatch[2], 10);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
  }

  // 3. If standard 12-hour format e.g. "1:15 pm", "01:15 PM", "10:30am"
  const twelveHourMatch = str.match(/^(\d{1,2})[:\.](\d{2})\s*(am|pm)$/i);
  if (twelveHourMatch) {
    const h = parseInt(twelveHourMatch[1], 10);
    const m = parseInt(twelveHourMatch[2], 10);
    const period = twelveHourMatch[3].toUpperCase();
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
  }

  // 4. If standard 24-hour format e.g. "13:15", "13:15:00", "05:30"
  const twentyFourHourMatch = str.match(/^(\d{1,2})[:\.](\d{2})(?::(\d{2}))?$/);
  if (twentyFourHourMatch) {
    const h = parseInt(twentyFourHourMatch[1], 10);
    const m = parseInt(twentyFourHourMatch[2], 10);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      const period = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
    }
  }

  // 5. If natural language / text (e.g. "Early morning", "Not Known", "Midnight") -> preserve cleanly
  return str;
}

export function formatDOBSafe(dob?: Date | string | null): string {
  if (!dob) return "-";

  // If string in DD/MM/YYYY or DD-MM-YYYY format
  if (typeof dob === "string") {
    const dmy = dob.trim().match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (dmy) {
      const day = String(parseInt(dmy[1], 10)).padStart(2, "0");
      const monthIdx = parseInt(dmy[2], 10) - 1;
      const year = dmy[3];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      if (monthIdx >= 0 && monthIdx <= 11) {
        return `${day} ${months[monthIdx]} ${year}`;
      }
    }
  }

  const d = new Date(dob);
  if (isNaN(d.getTime())) return String(dob);

  // Format in Asia/Kolkata timezone (IST UTC+5:30) to preserve true source calendar date
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(d);

  const day = parts.find((p) => p.type === "day")?.value || "";
  const month = parts.find((p) => p.type === "month")?.value || "";
  const year = parts.find((p) => p.type === "year")?.value || "";

  return `${day} ${month} ${year}`;
}

export function calculateAgeSafe(dob?: Date | string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;

  // Extract calendar day/month/year in Asia/Kolkata
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(d);

  const birthDay = parseInt(parts.find((p) => p.type === "day")?.value || "0", 10);
  const birthMonth = parseInt(parts.find((p) => p.type === "month")?.value || "0", 10);
  const birthYear = parseInt(parts.find((p) => p.type === "year")?.value || "0", 10);

  // Now get today in Asia/Kolkata
  const todayParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(new Date());

  const todayDay = parseInt(todayParts.find((p) => p.type === "day")?.value || "0", 10);
  const todayMonth = parseInt(todayParts.find((p) => p.type === "month")?.value || "0", 10);
  const todayYear = parseInt(todayParts.find((p) => p.type === "year")?.value || "0", 10);

  let age = todayYear - birthYear;
  if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
    age--;
  }

  return age >= 0 ? age : null;
}

// Verification checks
console.log("Testing formatBirthTime:");
console.log("0.5520833333357587 =>", formatBirthTime("0.5520833333357587")); // 01:15 PM
console.log("0.43402777778101154 =>", formatBirthTime("0.43402777778101154")); // 10:25 AM
console.log("0.06944444444525288 =>", formatBirthTime("0.06944444444525288")); // 01:40 AM
console.log("Sat Dec 30 1899 13:15:00 GMT+0521 =>", formatBirthTime("Sat Dec 30 1899 13:15:00 GMT+0521 (India Standard Time)")); // 01:15 PM
console.log("Sat Dec 30 1899 10:25:00 GMT+0521 =>", formatBirthTime("Sat Dec 30 1899 10:25:00 GMT+0521 (India Standard Time)")); // 10:25 AM
console.log("13:15:00 =>", formatBirthTime("13:15:00")); // 01:15 PM
console.log("05:30:00 =>", formatBirthTime("05:30:00")); // 05:30 AM
console.log("Not Known =>", formatBirthTime("Not Known")); // Not Known
console.log("null =>", formatBirthTime(null)); // -

console.log("\nTesting formatDOBSafe across boundaries:");
console.log("1990-03-03T18:30:00.000Z =>", formatDOBSafe("1990-03-03T18:30:00.000Z")); // 04 Mar 1990
console.log("1998-07-15T18:30:00.000Z =>", formatDOBSafe("1998-07-15T18:30:00.000Z")); // 16 Jul 1998
console.log("1980-07-31T18:30:00.000Z =>", formatDOBSafe("1980-07-31T18:30:00.000Z")); // 01 Aug 1980
console.log("1999-12-31T18:30:00.000Z =>", formatDOBSafe("1999-12-31T18:30:00.000Z")); // 01 Jan 2000
console.log("2000-02-28T18:30:00.000Z =>", formatDOBSafe("2000-02-28T18:30:00.000Z")); // 29 Feb 2000 (Leap day!)
console.log("05-02-1992 =>", formatDOBSafe("05-02-1992")); // 05 Feb 1992
