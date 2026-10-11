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
