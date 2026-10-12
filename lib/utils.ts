    export function generateProfileId(): string {
  const random = Math.floor(100000 + Math.random() * 900000);

  return `NNVS${random}`;
}

export function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();

  const monthDiff = today.getMonth() - dob.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function capitalize(value: string): string {
  if (!value) return "";

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function formatBirthTime(val?: string | null): string {
  if (!val) return "-";
  const trimmed = String(val).trim();
  if (
    !trimmed ||
    trimmed === "-" ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined"
  ) {
    return "-";
  }

  // Case 1: JavaScript Date toString or Excel date string containing 1899 or full date format
  // e.g. "Sat Dec 30 1899 12:28:00 GMT+0521 (India Standard Time)" or "1899-12-30T12:28:00"
  if (trimmed.includes("1899") || /^[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{4}/i.test(trimmed)) {
    const timeMatch = trimmed.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2];
      const ampm = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes} ${ampm}`;
    }
  }

  // Normalize string for checking am/pm
  const cleanVal = trimmed.replace(/\./g, "").trim();

  // Check for explicit AM/PM
  const ampmMatch = cleanVal.match(/(am|pm)/i);
  let explicitAmPm: "AM" | "PM" | null = null;
  if (ampmMatch) {
    explicitAmPm = ampmMatch[1].toUpperCase() as "AM" | "PM";
  } else {
    const lower = trimmed.toLowerCase();
    if (lower.includes("morning")) explicitAmPm = "AM";
    else if (lower.includes("night")) {
      // 12:xx night or 1..5 night is AM; 8..11 night is PM
      const hMatch = trimmed.match(/(\d{1,2})/);
      const h = hMatch ? parseInt(hMatch[1], 10) : 0;
      explicitAmPm = h === 12 || h < 6 ? "AM" : "PM";
    } else if (lower.includes("evening") || lower.includes("afternoon")) {
      explicitAmPm = "PM";
    }
  }

  // Extract hours and minutes
  const timeMatch = trimmed.match(/(\d{1,2})[:.](\d{1,2})/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2].padStart(2, "0");

    if (explicitAmPm) {
      const hours12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${hours12}:${minutes} ${explicitAmPm}`;
    } else {
      // No explicit am/pm, treat 24hr or standard
      if (hours >= 12) {
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes} PM`;
      } else {
        const hours12 = hours === 0 ? 12 : hours;
        return `${hours12}:${minutes} AM`;
      }
    }
  }

  // Check if just hour like "10AM" or "4 pm"
  const hourOnlyMatch = trimmed.match(/(\d{1,2})\s*(am|pm)/i);
  if (hourOnlyMatch) {
    let hours = parseInt(hourOnlyMatch[1], 10);
    const ampm = hourOnlyMatch[2].toUpperCase();
    const hours12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${hours12}:00 ${ampm}`;
  }

  return trimmed;
}