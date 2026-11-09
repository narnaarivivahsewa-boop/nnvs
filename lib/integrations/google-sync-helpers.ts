// Clean and extract valid 10-digit Indian mobile numbers (handles multiple numbers, labels, delimiters)
export function extractIndianMobiles(raw: any): { primary: string | null; all: string[]; raw: string } {
  if (!raw) return { primary: null, all: [], raw: "" };
  const rawStr = String(raw).trim();

  // Replace delimiters with spaces
  const cleaned = rawStr.replace(/[\/\,;\n\+\-\(\)\&]/g, " ");
  const candidates = cleaned.split(/\s+/).filter(Boolean);
  const matchedMobiles: string[] = [];

  const isValid = (d: string) => d.length === 10 && /^[6-9]\d{9}$/.test(d);

  for (let i = 0; i < candidates.length; i++) {
    const chunk = candidates[i].replace(/\D/g, "");
    if (isValid(chunk)) {
      if (!matchedMobiles.includes(chunk)) matchedMobiles.push(chunk);
    } else if (chunk.length === 12 && chunk.startsWith("91") && isValid(chunk.slice(2))) {
      const num = chunk.slice(2);
      if (!matchedMobiles.includes(num)) matchedMobiles.push(num);
    } else if (chunk.length === 11 && chunk.startsWith("0") && isValid(chunk.slice(1))) {
      const num = chunk.slice(1);
      if (!matchedMobiles.includes(num)) matchedMobiles.push(num);
    } else if (i + 1 < candidates.length) {
      // Try combining split consecutive 5-digit pieces e.g. "94160 85772"
      const combined = (candidates[i] + candidates[i + 1]).replace(/\D/g, "");
      if (isValid(combined)) {
        if (!matchedMobiles.includes(combined)) matchedMobiles.push(combined);
        i++;
      }
    }
  }

  // Fallback regex match across whole raw string
  if (matchedMobiles.length === 0) {
    const globalMatches = rawStr.match(/[6-9]\d{9}/g);
    if (globalMatches) {
      for (const m of globalMatches) {
        if (!matchedMobiles.includes(m)) matchedMobiles.push(m);
      }
    }
  }

  return {
    primary: matchedMobiles[0] || null,
    all: matchedMobiles,
    raw: rawStr,
  };
}

// Extract Google Drive file ID from various Drive URL formats
export function extractDriveFileId(urlOrText: any): string | null {
  if (!urlOrText || typeof urlOrText !== "string") return null;
  const str = urlOrText.trim();
  const idMatch = str.match(/[?&]id=([a-zA-Z0-9_-]{20,})/i);
  if (idMatch) return idMatch[1];
  const dMatch = str.match(/\/d\/([a-zA-Z0-9_-]{20,})/i);
  if (dMatch) return dMatch[1];
  const fileDMatch = str.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/i);
  if (fileDMatch) return fileDMatch[1];
  const generalMatch = str.match(/^([a-zA-Z0-9_-]{25,})$/);
  if (generalMatch) return generalMatch[1];
  return null;
}

// Formats Google Drive URLs to both direct embeddable link and full Drive view link
export function formatGoogleDrivePhotoUrl(urlOrText: any): { displayUrl: string; directDriveUrl: string; fileId: string | null } | null {
  if (!urlOrText || typeof urlOrText !== "string") return null;
  const trimmed = urlOrText.trim();
  if (!trimmed) return null;

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return {
      displayUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
      directDriveUrl: `https://drive.google.com/file/d/${fileId}/view`,
      fileId,
    };
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return {
      displayUrl: trimmed,
      directDriveUrl: trimmed,
      fileId: null,
    };
  }

  return null;
}

export function normalizeCandidateName(str?: string | null): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/^(mr\.|mrs\.|ms\.|shri|smt\.|dr\.)\s+/i, "")
    .replace(/\s*\([^)]*\)/g, "") // remove notes like (my son), (daughter), (puniyani), etc.
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function extractProfileNormalizedPhones(p: any): string[] {
  const phones = new Set<string>();
  const pushPhone = (raw?: string | null) => {
    if (!raw) return;
    const digits = String(raw).replace(/\D/g, "");
    if (digits.length >= 10) {
      phones.add(digits.slice(-10));
    }
  };
  pushPhone(p?.user?.mobile);
  if (Array.isArray(p?.phoneNumbers)) {
    for (const ph of p.phoneNumbers) {
      pushPhone(ph?.phone);
    }
  }
  return Array.from(phones);
}

// Strict candidate identity guard for row-number-based sourceId lookups.
// Ensures shifted/reused Google Sheet row numbers NEVER overwrite an unrelated member's profile.
export function doesSourceCandidateMatch(
  incoming: {
    fullName: string;
    gender: "MALE" | "FEMALE";
    mobile: string;
    allMobiles: string[];
    legacyProfileId?: string | null;
  },
  p: any
): boolean {
  if (!p) return false;

  // Never overwrite if both records have explicit but different Legacy NNVS IDs
  if (incoming.legacyProfileId && p.legacyProfileId) {
    const inLegacy = String(incoming.legacyProfileId).trim().toUpperCase();
    const pLegacy = String(p.legacyProfileId).trim().toUpperCase();
    if (inLegacy !== pLegacy) {
      return false;
    }
  }

  // Gender guard when existing user's gender is set
  if (p.user?.gender && p.user.gender !== incoming.gender) {
    return false;
  }

  // 1. Mobile match guard: at least one 10-digit incoming mobile must match existing User.mobile or ProfilePhone
  const incomingMobiles = Array.from(
    new Set(
      [incoming.mobile, ...(incoming.allMobiles || [])]
        .map((m) => String(m || "").replace(/\D/g, "").slice(-10))
        .filter((m) => m.length === 10 && !m.startsWith("9900"))
    )
  );
  const existingMobiles = extractProfileNormalizedPhones(p);
  const mobileMatches =
    incomingMobiles.length > 0 &&
    existingMobiles.length > 0 &&
    incomingMobiles.some((m) => existingMobiles.includes(m));

  // 2. Name match guard: normalized candidate name must match stored Profile or User name
  const candNorm = normalizeCandidateName(incoming.fullName);
  const pFullName = `${p.firstName || ""} ${p.lastName || ""}`.trim();
  const pNorm = normalizeCandidateName(pFullName);
  const pUserNorm = normalizeCandidateName(p.user?.fullName);

  const nameMatches =
    candNorm.length >= 3 &&
    ((pNorm.length >= 3 && candNorm === pNorm) ||
      (pUserNorm.length >= 3 && candNorm === pUserNorm));

  return mobileMatches && nameMatches;
}
