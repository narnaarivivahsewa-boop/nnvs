export function generateProfileId(): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `NNVS${random}`;
}

export function generateDraftProfileId(): string {
  return `DRAFT-${Date.now()}`;
}

export function generateOfficialProfileId(): string {
  return `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
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
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));
}

export function formatDOB(dob?: Date | string | null): string {
  if (!dob) return "-";

  // Handle pure date strings without timezone shifts
  if (typeof dob === "string") {
    const trimmed = dob.trim();
    if (
      !trimmed ||
      trimmed === "-" ||
      trimmed.toLowerCase() === "null" ||
      trimmed.toLowerCase() === "undefined"
    ) {
      return "-";
    }

    // Match DD/MM/YYYY or DD-MM-YYYY
    const dmy = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (dmy) {
      const day = parseInt(dmy[1], 10);
      const monthIdx = parseInt(dmy[2], 10) - 1;
      const year = dmy[3];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      if (monthIdx >= 0 && monthIdx <= 11) {
        return `${day} ${months[monthIdx]} ${year}`;
      }
    }

    // Match pure YYYY-MM-DD
    const ymd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymd) {
      const year = ymd[1];
      const monthIdx = parseInt(ymd[2], 10) - 1;
      const day = parseInt(ymd[3], 10);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      if (monthIdx >= 0 && monthIdx <= 11) {
        return `${day} ${months[monthIdx]} ${year}`;
      }
    }
  }

  const d = new Date(dob);
  if (isNaN(d.getTime())) return String(dob);

  // Format in Asia/Kolkata timezone (IST UTC+5:30) to prevent off-by-one day bugs
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
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
    const hours = parseInt(timeMatch[1], 10);
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
    const hours = parseInt(hourOnlyMatch[1], 10);
    const ampm = hourOnlyMatch[2].toUpperCase();
    const hours12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${hours12}:00 ${ampm}`;
  }

  return trimmed;
}

/**
 * Builds the WhatsApp message template for admin communication with candidates.
 * Unpaid / draft profiles receive a polite payment & activation reminder in Hindi-English.
 * Paid / live profiles receive the standard greeting message.
 */
export function buildAdminProfileWhatsAppMessage(profile: {
  profileId: string;
  legacyProfileId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  paymentCompleted?: boolean | null;
  isPaymentExempted?: boolean | null;
  approvalStatus?: string | null;
  user?: {
    fullName?: string | null;
    payments?: { id?: string; amount?: number; grossAmount?: number | null }[];
  } | null;
}): string {
  const candidateName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    profile.user?.fullName ||
    "Candidate";

  const displayProfileId = profile.legacyProfileId || profile.profileId;

  const isPaidOrExempt = Boolean(profile.paymentCompleted || profile.isPaymentExempted);
  const latestPayment = profile.user?.payments?.[0];
  const hasSuccessfulPayment = Boolean(latestPayment?.id);
  const isDraftStatus = profile.approvalStatus === "DRAFT";
  const isPaymentUnrecorded = !hasSuccessfulPayment && !isPaidOrExempt;

  const isUnpaidOrDraft = !isPaidOrExempt || isDraftStatus || isPaymentUnrecorded;

  if (isUnpaidOrDraft) {
    return `Namaste ${candidateName},

Aapne RishteClub (NNVS Matrimony) par apni matrimonial profile (${displayProfileId}) banayi hai, lekin abhi tak payment complete nahi ki hai — isliye aapki profile abhi Draft mein hai aur website par live nahi hui hai.

Kripya https://www.rishteclub.com/login par jakar apne registered mobile number aur Password / OTP se login karein aur payment complete karein.

Payment complete hote hi aapki profile website par Live kar di jayegi aur aapko NNVS ke official WhatsApp groups mein bhi add kar diya jayega!

— Team RishteClub (Nar Naari Vivah Sewa)`;
  }

  return `Namaste ${candidateName}! This is regarding your matrimonial profile (${displayProfileId}) on RishteClub.`;
}

