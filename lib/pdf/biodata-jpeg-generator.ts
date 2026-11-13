import fs from "fs";
import path from "path";
import { createRequire } from "module";
import React from "react";
import { ImageResponse } from "next/og";
import {
  getBiodataCategoryFolder,
  type BiodataProfileInput,
} from "./biodata-generator";
import { formatDOB } from "../utils";

const esmRequire = createRequire(import.meta.url);
const sharp = esmRequire("sharp");
const fontkit = esmRequire("fontkit");

const h = React.createElement;

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;
const PHOTO_FRAME_W = 276;
const PHOTO_FRAME_H = 332;

const HELPLINE_1 = "+91 9871592002";
const HELPLINE_2 = "+91 7015812359";
const FONT_STACK = "LiberationSans, NirmalaUI, sans-serif";

interface LoadedFontDef {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
}

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

interface CardAssets {
  satoriFonts: LoadedFontDef[];
  hasNirmala: boolean;
  devanagariBoldFont: any;
  devanagariRegFont: any;
  logoDataUri: string | null;
}

let cachedAssets: CardAssets | null = null;

function loadCardAssets(): CardAssets {
  if (cachedAssets) {
    return cachedAssets;
  }

  const satoriFonts: LoadedFontDef[] = [];

  const libRegPath = path.join(process.cwd(), "lib", "pdf", "fonts", "LiberationSans-Regular.ttf");
  const libBoldPath = path.join(process.cwd(), "lib", "pdf", "fonts", "LiberationSans-Bold.ttf");

  if (fs.existsSync(libRegPath)) {
    try {
      satoriFonts.push({
        name: "LiberationSans",
        data: toArrayBuffer(fs.readFileSync(libRegPath)),
        weight: 400,
        style: "normal",
      });
    } catch (err) {
      console.warn("[CardAssets] Failed to read LiberationSans-Regular:", err);
    }
  }

  if (fs.existsSync(libBoldPath)) {
    try {
      satoriFonts.push({
        name: "LiberationSans",
        data: toArrayBuffer(fs.readFileSync(libBoldPath)),
        weight: 700,
        style: "normal",
      });
    } catch (err) {
      console.warn("[CardAssets] Failed to read LiberationSans-Bold:", err);
    }
  }

  const nirRegPath = "C:\\Windows\\Fonts\\Nirmala.ttf";
  const nirBoldPath = "C:\\Windows\\Fonts\\NirmalaB.ttf";
  let hasNirmala = false;
  let devanagariRegFont: any = null;
  let devanagariBoldFont: any = null;

  if (fs.existsSync(nirRegPath)) {
    try {
      hasNirmala = true;
      satoriFonts.push({
        name: "NirmalaUI",
        data: toArrayBuffer(fs.readFileSync(nirRegPath)),
        weight: 400,
        style: "normal",
      });
      devanagariRegFont = fontkit.openSync(nirRegPath);
    } catch {
      devanagariRegFont = null;
    }
  }

  if (fs.existsSync(nirBoldPath)) {
    try {
      hasNirmala = true;
      satoriFonts.push({
        name: "NirmalaUI",
        data: toArrayBuffer(fs.readFileSync(nirBoldPath)),
        weight: 700,
        style: "normal",
      });
      devanagariBoldFont = fontkit.openSync(nirBoldPath);
    } catch {
      devanagariBoldFont = null;
    }
  }

  let logoDataUri: string | null = null;
  const logoPath = path.join(process.cwd(), "public", "nnvs-logo.png");
  if (fs.existsSync(logoPath)) {
    try {
      const optimized = sharp(fs.readFileSync(logoPath))
        .resize(176, 176, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toBuffer();
      // Handle synchronous or promise from sharp
      if (optimized && typeof (optimized as any).then === "function") {
        (optimized as any).then((buf: Buffer) => {
          if (cachedAssets) {
            cachedAssets.logoDataUri = `data:image/png;base64,${buf.toString("base64")}`;
          }
        });
      }
    } catch {
      logoDataUri = null;
    }
  }

  cachedAssets = {
    satoriFonts,
    hasNirmala,
    devanagariBoldFont,
    devanagariRegFont,
    logoDataUri,
  };

  return cachedAssets;
}

async function ensureLogoDataUri(assets: CardAssets): Promise<string | null> {
  if (assets.logoDataUri) return assets.logoDataUri;
  const logoPath = path.join(process.cwd(), "public", "nnvs-logo.png");
  if (!fs.existsSync(logoPath)) return null;
  try {
    const optimized = await sharp(fs.readFileSync(logoPath))
      .resize(176, 176, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();
    assets.logoDataUri = `data:image/png;base64,${optimized.toString("base64")}`;
    return assets.logoDataUri;
  } catch {
    return null;
  }
}

// =============================================================================
// DEVANAGARI TEXT RENDERER (NO TOFU SQUARES)
// =============================================================================
function buildDevanagariSvgPath(
  text: string,
  fkFont: any
): { width: number; height: number; d: string } | null {
  if (!fkFont || !text) return null;
  try {
    const run = fkFont.layout(text);
    const normScale = 100 / (fkFont.unitsPerEm || 2048);
    const ascent = (fkFont.ascent || 1050) * normScale;
    const descent = Math.abs(fkFont.descent || -320) * normScale;
    const baselineY = Math.ceil(ascent + 2);
    const viewH = Math.ceil(ascent + descent + 4);

    let cursorX = 0;
    const paths: string[] = [];

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i];
      const pos = run.positions?.[i];
      const xOffset = (pos?.xOffset || 0) * normScale;
      const yOffset = (pos?.yOffset || 0) * normScale;
      const xAdvance = (pos?.xAdvance ?? glyph.advanceWidth ?? 0) * normScale;

      if (glyph?.path) {
        const d = glyph.path
          .scale(normScale, -normScale)
          .translate(cursorX + xOffset, baselineY - yOffset)
          .toSVG();
        if (d) paths.push(d);
      }
      cursorX += xAdvance;
    }

    const totalW = Math.max(1, Math.ceil(cursorX + 2));
    return { width: totalW, height: viewH, d: paths.join("") };
  } catch {
    return null;
  }
}

function RichText({
  text,
  fontSize,
  color,
  fontWeight = 700,
  devanagariFont,
  style,
}: {
  text: string;
  fontSize: number;
  color: string;
  fontWeight?: 400 | 700;
  devanagariFont: any;
  style?: Record<string, string | number>;
}) {
  const safeText = text || "-";
  const devanagariRegex =
    /([\u0900-\u097F\u0964-\u096F\u200C\u200D]+(?:\s+[\u0900-\u097F\u0964-\u096F\u200C\u200D]+)*)/g;

  if (!devanagariFont || !/[\u0900-\u097F]/.test(safeText)) {
    return h(
      "span",
      {
        style: {
          fontFamily: FONT_STACK,
          fontSize,
          fontWeight,
          color,
          lineHeight: 1.25,
          ...style,
        },
      },
      safeText
    );
  }

  const parts = safeText.split(devanagariRegex).filter((p) => p !== "");
  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "4px",
        ...style,
      },
    },
    ...parts.map((part, idx) => {
      if (/[\u0900-\u097F]/.test(part)) {
        const svgData = buildDevanagariSvgPath(part, devanagariFont);
        if (svgData && svgData.d) {
          const w = Math.ceil((svgData.width / 100) * fontSize);
          const hPx = Math.ceil((svgData.height / 100) * fontSize);
          return h(
            "svg",
            {
              key: `d-${idx}`,
              width: w,
              height: hPx,
              viewBox: `0 0 ${svgData.width} ${svgData.height}`,
              style: { flexShrink: 0, display: "flex" },
            },
            h("path", { d: svgData.d, fill: color })
          );
        }
      }
      return h(
        "span",
        {
          key: `l-${idx}`,
          style: {
            fontFamily: FONT_STACK,
            fontSize,
            fontWeight,
            color,
            lineHeight: 1.25,
          },
        },
        part
      );
    })
  );
}

// =============================================================================
// SANITIZATION AND FORMATTING HELPERS
// =============================================================================
function cleanString(val?: string | null): string {
  if (!val) return "";
  const s = String(val).replace(/\s+/g, " ").trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  if (lower === "null" || lower === "undefined" || lower === "none" || s === "-") {
    return "";
  }
  return s;
}

function truncateText(val: string, maxLen: number): string {
  if (val.length <= maxLen) return val;
  return `${val.slice(0, maxLen - 3).trim()}...`;
}

function toTitleCase(input: string): string {
  return input
    .split(/\s+/)
    .map((w) => {
      if (!w) return "";
      if (w.length <= 3 && w === w.toUpperCase()) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

function calculateExactIstAge(dob?: Date | string | null): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;

  const bParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(birthDate);

  const bDay = parseInt(bParts.find((p) => p.type === "day")?.value || "0", 10);
  const bMonth = parseInt(bParts.find((p) => p.type === "month")?.value || "0", 10);
  const bYear = parseInt(bParts.find((p) => p.type === "year")?.value || "0", 10);

  const todayParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(new Date());

  const tDay = parseInt(todayParts.find((p) => p.type === "day")?.value || "0", 10);
  const tMonth = parseInt(todayParts.find((p) => p.type === "month")?.value || "0", 10);
  const tYear = parseInt(todayParts.find((p) => p.type === "year")?.value || "0", 10);

  let age = tYear - bYear;
  if (tMonth < bMonth || (tMonth === bMonth && tDay < bDay)) {
    age--;
  }
  return age >= 18 && age <= 90 ? age : null;
}

function formatHeightDisplay(raw?: string | null): string {
  const s = cleanString(raw);
  if (!s) return "Not Specified";

  const cmMatch = s.match(/^(\d{2,3})\s*cm$/i);
  if (cmMatch) {
    return `${cmMatch[1]} cm`;
  }

  const cleaned = s.replace(/[’′]/g, "'").replace(/[”″]/g, '"').trim();
  const ftIn = cleaned.match(
    /^0*(\d)\s*(?:ft\.?|feet|'|")?\s*[.\s-]?\s*(\d{1,2}(?:\.\d)?)?\s*(?:inch(?:es)?|in|"|'')?$/i
  );
  if (ftIn) {
    const ft = ftIn[1];
    const inch = ftIn[2] ?? "0";
    return `${ft}' ${inch}"`;
  }

  return truncateText(s, 22);
}

function formatManglikDisplay(raw?: string | null): string {
  const s = cleanString(raw);
  if (!s) return "Not Specified";
  const lower = s.toLowerCase();
  if (lower === "no" || lower === "non manglik" || lower === "non-manglik") {
    return "Non-Manglik";
  }
  if (lower === "yes" || lower === "manglik") {
    return "Manglik";
  }
  if (lower.includes("anshik") || lower.includes("partial")) {
    return "Anshik (Partial)";
  }
  return truncateText(toTitleCase(s), 28);
}

function extractValidLegacyId(profile: any): string | null {
  const candidates = [cleanString(profile.legacyProfileId), cleanString(profile.oldNnvsId)];
  for (const cand of candidates) {
    if (!cand) continue;
    const lower = cand.toLowerCase();
    if (
      lower === "direct" ||
      lower.includes("_row_") ||
      lower.includes("health_check") ||
      cand.length > 32
    ) {
      continue;
    }
    if (cand.toUpperCase() === String(profile.profileId || "").toUpperCase()) {
      continue;
    }
    return cand;
  }
  return null;
}

function extractCandidateName(profile: any): string {
  const fromFirstLast = [cleanString(profile.firstName), cleanString(profile.lastName)]
    .filter(Boolean)
    .join(" ")
    .trim();
  const rawName = fromFirstLast || cleanString(profile.user?.fullName) || "Verified Candidate";
  if (/[\u0900-\u097F]/.test(rawName)) {
    return rawName;
  }
  return toTitleCase(rawName);
}

function isPlaceholderIncome(raw: string): boolean {
  const lower = raw.trim().toLowerCase();
  return (
    !lower ||
    lower === "na" ||
    lower === "n/a" ||
    lower === "nil" ||
    lower === "none" ||
    lower === "ask" ||
    lower === "ask directly" ||
    lower === "disclosed on interest" ||
    lower === "not applicable" ||
    lower === "-"
  );
}

function formatIncomeDisplay(raw: string, hasNirmalaRupee: boolean): string {
  const s = cleanString(raw);
  if (isPlaceholderIncome(s)) return "";
  const currencyPrefix = hasNirmalaRupee ? "₹" : "Rs. ";
  if (/^\d+$/.test(s)) {
    const num = parseInt(s, 10);
    if (num >= 1000) {
      return `${currencyPrefix}${num.toLocaleString("en-IN")}`;
    }
  }
  const normalized = hasNirmalaRupee
    ? s.replace(/\bRs\.?\s*/gi, "₹")
    : s.replace(/₹\s*/g, "Rs. ");
  return normalized;
}

function extractProfessionIncome(profile: any, hasNirmalaRupee: boolean): string {
  const profRaw =
    cleanString(profile.occupation?.profession) ||
    cleanString(profile.education?.occupationField);
  const prof =
    profRaw && /^[a-z]/.test(profRaw)
      ? profRaw.charAt(0).toUpperCase() + profRaw.slice(1)
      : profRaw;
  const rawIncome = cleanString(profile.occupation?.annualIncome);
  const income = formatIncomeDisplay(rawIncome, hasNirmalaRupee);

  if (prof && income) {
    return truncateText(`${prof} • ${income}`, 96);
  }
  if (prof) return truncateText(prof, 96);
  if (income) return truncateText(`Income: ${income}`, 96);
  return "Not Specified";
}

function cleanGotraOrCasteValue(raw?: string | null): string {
  const s = cleanString(raw);
  if (!s) return "";
  const lower = s.toLowerCase();
  if (["na", "n/a", "no", "none", "nil", "not applicable", "not specified"].includes(lower)) {
    return "";
  }
  return s;
}

function extractGotra(profile: any): string {
  const gotraMatch = profile.notes?.match(/Gotra:\s*([^;\n\r]+)/i);
  const raw = gotraMatch ? cleanGotraOrCasteValue(gotraMatch[1]) : "";
  if (!raw) return "";
  return /^[a-z]/.test(raw) ? toTitleCase(raw) : raw;
}

function extractCasteGotra(profile: any): string {
  const gotra = extractGotra(profile);

  let religion = cleanGotraOrCasteValue(profile.religion);
  if (religion.toLowerCase() === "hundu" || religion.toLowerCase() === "hindi") {
    religion = "Hindu";
  } else if (religion.toUpperCase() === "HINDU") {
    religion = "Hindu";
  } else if (religion && (religion === religion.toLowerCase() || religion === religion.toUpperCase())) {
    religion = toTitleCase(religion);
  }

  let caste = cleanGotraOrCasteValue(profile.caste);
  if (caste && (caste === caste.toLowerCase() || caste === caste.toUpperCase())) {
    caste = toTitleCase(caste);
  }

  if (caste) {
    const hasGotraAlready = gotra && caste.toLowerCase().includes(gotra.toLowerCase());
    const base =
      religion && !caste.toLowerCase().includes(religion.toLowerCase())
        ? `${religion} • ${caste}`
        : caste;
    const withGotra = gotra && !hasGotraAlready ? `${base} (Gotra: ${gotra})` : base;
    return truncateText(withGotra, 72);
  }

  if (religion && gotra) {
    return truncateText(`${religion} (Gotra: ${gotra})`, 72);
  }
  if (gotra) {
    return truncateText(`Gotra: ${gotra}`, 72);
  }
  return religion ? truncateText(religion, 72) : "Hindu / Not Specified";
}

function extractNativePlace(profile: any): string {
  const raw = cleanGotraOrCasteValue(profile.birthPlace)
    .replace(/\s*,\s*/g, ", ")
    .replace(/^[,\s-]+|[,\s-]+$/g, "")
    .trim();

  if (raw) {
    const formatted =
      raw === raw.toLowerCase() || raw === raw.toUpperCase()
        ? toTitleCase(raw)
        : raw;
    return truncateText(formatted, 48);
  }

  const workCity = cleanGotraOrCasteValue(profile.occupation?.company);
  if (workCity && workCity.length <= 36) {
    return truncateText(toTitleCase(workCity), 48);
  }

  return "India";
}

function isMeaninglessNoteToken(val: string): boolean {
  const lower = val.toLowerCase().replace(/[.\s,-]+/g, " ").trim();
  return (
    !lower ||
    [
      "na",
      "n/a",
      "n a",
      "no",
      "none",
      "nil",
      "null",
      "same",
      "not applicable",
      "not available",
    ].includes(lower)
  );
}

function extractResidentialAddress(profile: any, nativePlace: string): string {
  const noteLines = (profile.notes || "")
    .split(/\r?\n/)
    .map((l: string) => l.trim())
    .filter((l: string) => l && !/^gotra\s*:/i.test(l) && !isMeaninglessNoteToken(l));

  const addr = noteLines
    .join(", ")
    .replace(/\.{2,}/g, " ")
    .replace(/\s*,\s*(?:,\s*)+/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/^[,\s.-]+|[,\s.-]+$/g, "")
    .trim();

  if (addr && !isMeaninglessNoteToken(addr)) {
    const formatted =
      !/[\u0900-\u097F]/.test(addr) && (addr === addr.toLowerCase() || addr === addr.toUpperCase())
        ? toTitleCase(addr)
        : addr;
    if (
      nativePlace &&
      nativePlace !== "India" &&
      !formatted.toLowerCase().includes(nativePlace.split(",")[0].trim().toLowerCase()) &&
      formatted.length < 85
    ) {
      return truncateText(`${formatted}, ${nativePlace}`, 135);
    }
    return truncateText(formatted, 135);
  }

  const prop = cleanGotraOrCasteValue(profile.family?.propertyDetails);
  if (nativePlace && prop && !prop.toLowerCase().includes(nativePlace.toLowerCase())) {
    return truncateText(`${nativePlace} (${toTitleCase(prop)})`, 135);
  }
  return nativePlace || "India";
}

function formatParentDetail(name?: string | null, occupation?: string | null): string {
  const rawName = cleanGotraOrCasteValue(name);
  const rawOcc = cleanGotraOrCasteValue(occupation);

  const cleanName =
    rawName && !/[\u0900-\u097F]/.test(rawName) && (rawName === rawName.toLowerCase() || rawName === rawName.toUpperCase())
      ? toTitleCase(rawName)
      : rawName;

  const cleanOcc =
    rawOcc && !/[\u0900-\u097F]/.test(rawOcc) && /^[a-z]/.test(rawOcc)
      ? rawOcc.charAt(0).toUpperCase() + rawOcc.slice(1)
      : rawOcc;

  if (cleanName && cleanOcc) {
    return truncateText(`${cleanName} (${cleanOcc})`, 86);
  }
  if (cleanName) return truncateText(cleanName, 86);
  if (cleanOcc) return truncateText(cleanOcc, 86);
  return "Not Specified";
}

function extractFamilySummary(family: any): string {
  if (!family) return "Not Specified";
  const parts: string[] = [];

  const ft = cleanGotraOrCasteValue(family.familyType);
  const fsStatus = cleanGotraOrCasteValue(family.familyStatus);
  if (ft && fsStatus) {
    parts.push(`${toTitleCase(ft)} • ${toTitleCase(fsStatus)}`);
  } else if (ft) {
    parts.push(toTitleCase(ft));
  } else if (fsStatus) {
    parts.push(toTitleCase(fsStatus));
  }

  const sibTextRaw = cleanString(family.siblingsDetails);
  let sibDisplay = "";
  if (sibTextRaw && !isMeaninglessNoteToken(sibTextRaw)) {
    const cleanedSib = sibTextRaw.replace(/\r?\n+/g, ", ").replace(/\s+/g, " ").trim();
    if (/^\d+$/.test(cleanedSib)) {
      sibDisplay = `${cleanedSib} Sibling(s)`;
    } else {
      sibDisplay = cleanedSib;
    }
  } else {
    const counts: string[] = [];
    if (typeof family.brothers === "number" && family.brothers > 0) {
      counts.push(`${family.brothers} Brother${family.brothers > 1 ? "s" : ""}`);
    }
    if (typeof family.sisters === "number" && family.sisters > 0) {
      counts.push(`${family.sisters} Sister${family.sisters > 1 ? "s" : ""}`);
    }
    if (counts.length > 0) {
      sibDisplay = counts.join(", ");
    }
  }

  if (sibDisplay) {
    parts.push(`Siblings: ${sibDisplay}`);
  }

  const prop = cleanGotraOrCasteValue(family.propertyDetails);
  if (prop && parts.join(" • ").length < 36) {
    parts.push(toTitleCase(prop));
  }

  return parts.length > 0 ? truncateText(parts.join(" • "), 96) : "Not Specified";
}

function extractIndianNumbersFromText(raw?: string | null): string[] {
  if (!raw) return [];
  const rawStr = String(raw).trim();
  const cleaned = rawStr.replace(/[\/\,;\n\+\-\(\)\&\.]/g, " ");
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  const isValid10 = (d: string) => d.length === 10 && /^[6-9]\d{9}$/.test(d);

  for (let i = 0; i < tokens.length; i++) {
    const chunk = tokens[i].replace(/\D/g, "");
    if (isValid10(chunk)) {
      if (!out.includes(chunk)) out.push(chunk);
    } else if (chunk.length === 12 && chunk.startsWith("91") && isValid10(chunk.slice(2))) {
      const n = chunk.slice(2);
      if (!out.includes(n)) out.push(n);
    } else if (chunk.length === 11 && chunk.startsWith("0") && isValid10(chunk.slice(1))) {
      const n = chunk.slice(1);
      if (!out.includes(n)) out.push(n);
    } else if (i + 1 < tokens.length) {
      const combined = (tokens[i] + tokens[i + 1]).replace(/\D/g, "");
      if (isValid10(combined)) {
        if (!out.includes(combined)) out.push(combined);
        i++;
      }
    }
  }

  if (out.length === 0) {
    const fallbackMatches = rawStr.match(/[6-9]\d{9}/g) || [];
    for (const m of fallbackMatches) {
      if (!out.includes(m)) out.push(m);
    }
  }

  return out;
}

function formatIndianPhone(tenDigits: string): string {
  const digits = tenDigits.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91 ${digits}`;
  }
  return tenDigits;
}

function extractContactInfo(profile: any): {
  primaryPhoneDisplay: string;
  alternatePhoneDisplay: string | null;
  contactPersonDisplay: string;
  emailDisplay: string | null;
} {
  const realNumbers: string[] = [];
  const pushNum = (num: string) => {
    const d = num.replace(/\D/g, "").slice(-10);
    if (d.length === 10 && /^[6-9]\d{9}$/.test(d) && !d.startsWith("9900")) {
      if (!realNumbers.includes(d)) realNumbers.push(d);
    }
  };

  for (const pp of profile.phoneNumbers || []) {
    for (const n of extractIndianNumbersFromText(pp.phone)) {
      pushNum(n);
    }
  }
  if (profile.user?.mobile) {
    for (const n of extractIndianNumbersFromText(profile.user.mobile)) {
      pushNum(n);
    }
  }
  for (const n of extractIndianNumbersFromText(profile.contactPerson)) {
    pushNum(n);
  }
  for (const n of extractIndianNumbersFromText(profile.notes)) {
    pushNum(n);
  }

  const primaryPhoneDisplay =
    realNumbers.length > 0
      ? formatIndianPhone(realNumbers[0])
      : cleanString(profile.user?.mobile) || "Available via Helpline";

  const extraNums = realNumbers.slice(1, 3).map(formatIndianPhone);
  const alternatePhoneDisplay = extraNums.length > 0 ? extraNums.join(" / ") : null;

  let rawCp = cleanGotraOrCasteValue(profile.contactPerson)
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (rawCp) {
    const strippedDigits = rawCp
      .replace(/(?:\+?91[\s-]?)?[6-9]\d{9}/g, "")
      .replace(/^[,\s.\-:;()]+|[,\s.\-:;()]+$/g, "")
      .replace(/\(\s*\)/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (strippedDigits && /[a-zA-Z\u0900-\u097F]{2,}/.test(strippedDigits)) {
      rawCp = strippedDigits;
    } else if (/^[\d\s,+\-.()]+$/.test(rawCp)) {
      rawCp = "";
    }
  }

  const contactPersonDisplay = rawCp
    ? truncateText(
        rawCp === rawCp.toLowerCase() || rawCp === rawCp.toUpperCase() ? toTitleCase(rawCp) : rawCp,
        42
      )
    : "Parents / Family";

  const rawEmail = cleanString(profile.user?.email);
  const emailLower = rawEmail.toLowerCase();
  const isSyntheticEmail =
    !rawEmail ||
    !rawEmail.includes("@") ||
    emailLower.includes("placeholder") ||
    emailLower.includes("@nnvs.") ||
    emailLower.includes("@rishteclub.local") ||
    emailLower.endsWith(".local") ||
    emailLower.includes("example.com") ||
    emailLower.startsWith("noemail") ||
    emailLower.startsWith("na@");
  const emailDisplay = !isSyntheticEmail ? truncateText(rawEmail, 38) : null;

  return {
    primaryPhoneDisplay,
    alternatePhoneDisplay,
    contactPersonDisplay,
    emailDisplay,
  };
}

function isFemaleProfile(profile: any): boolean {
  const legacy = String(profile.legacyProfileId || "").toUpperCase().trim();
  if (
    legacy.includes("-G-") ||
    legacy.startsWith("NNVS-G") ||
    legacy.startsWith("G-") ||
    legacy.startsWith("G0")
  ) {
    return true;
  }
  if (
    legacy.includes("-B-") ||
    legacy.startsWith("NNVS-B") ||
    legacy.startsWith("B-") ||
    legacy.startsWith("B0")
  ) {
    return false;
  }
  return String(profile.user?.gender || "MALE").toUpperCase().trim() === "FEMALE";
}

// =============================================================================
// PHOTO FETCHER & NORMALIZER
// =============================================================================
const REJECTED_PHOTO_KEYWORDS = [
  "placeholder",
  "default-avatar",
  "default_avatar",
  "silhouette",
  "no-photo",
  "no_photo",
  "dsc00173",
  "/images/wedding/",
];

function buildCandidatePhotoUrls(rawUrl: string): string[] {
  const trimmed = rawUrl.trim();
  if (!trimmed) return [];
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("blob:") || lower.endsWith(".svg")) return [];
  if (REJECTED_PHOTO_KEYWORDS.some((kw) => lower.includes(kw))) return [];

  if (lower.startsWith("data:image/")) {
    return [trimmed];
  }

  let resolved = trimmed;
  if (resolved.startsWith("/")) {
    resolved = `https://www.rishteclub.com${resolved}`;
  }

  try {
    const u = new URL(resolved);
    if (u.protocol !== "https:" && u.protocol !== "http:") return [];
    if (
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname === "0.0.0.0"
    ) {
      return [];
    }

    const idMatch =
      u.pathname.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]{15,})/) ||
      u.search.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);

    if (u.hostname.includes("drive.google.com") && u.pathname.includes("/folders/")) {
      return [];
    }

    if (u.hostname.includes("drive.google.com") && idMatch?.[1]) {
      return [
        `https://lh3.googleusercontent.com/d/${idMatch[1]}=w1200`,
        `https://drive.google.com/uc?export=view&id=${idMatch[1]}`,
      ];
    }

    if (u.hostname.includes("lh3.googleusercontent.com")) {
      const variants = [u.toString()];
      if (idMatch?.[1]) {
        const w1200 = `https://lh3.googleusercontent.com/d/${idMatch[1]}=w1200`;
        if (!variants.includes(w1200)) variants.push(w1200);
      }
      return variants;
    }

    if (
      u.hostname.includes("res.cloudinary.com") &&
      u.pathname.includes("/image/upload/")
    ) {
      if (!u.pathname.includes("/f_jpg") && !u.pathname.includes("/f_png")) {
        u.pathname = u.pathname.replace("/image/upload/", "/image/upload/f_jpg/");
      }
    }

    return [u.toString()];
  } catch {
    return [];
  }
}

async function fetchImageBufferWithRetry(url: string): Promise<Buffer | null> {
  if (url.startsWith("data:image/")) {
    const commaIdx = url.indexOf(",");
    if (commaIdx <= 0) return null;
    return Buffer.from(url.slice(commaIdx + 1), "base64");
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept: "image/*,*/*;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
        },
      });
      if (res.ok) {
        const ctype = (res.headers.get("content-type") || "").toLowerCase();
        if (!ctype || ctype.startsWith("image/") || ctype === "application/octet-stream") {
          const ab = await res.arrayBuffer();
          if (ab.byteLength >= 1000 && ab.byteLength <= 15 * 1024 * 1024) {
            return Buffer.from(ab);
          }
        }
        return null;
      }
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return null;
      }
    } catch {
      // Retry transient network once
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

async function normalizePhotoBuffer(rawBuf: Buffer): Promise<string | null> {
  try {
    const meta = await sharp(rawBuf).metadata();
    if (!meta.width || !meta.height || meta.width < 40 || meta.height < 40) {
      return null;
    }

    const cropped = await sharp(rawBuf)
      .rotate()
      .resize(PHOTO_FRAME_W * 2, PHOTO_FRAME_H * 2, {
        fit: "cover",
        position: "attention",
      })
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();

    return `data:image/jpeg;base64,${cropped.toString("base64")}`;
  } catch {
    return null;
  }
}

async function fetchCandidateNormalizedPhoto(profile: any): Promise<string | null> {
  const candidateRows = [...(profile.photos || [])]
    .filter((p: any) => p.status !== "REJECTED" && Boolean(p.imageUrl?.trim()))
    .sort((a: any, b: any) => {
      const rank = (s: string) => (s === "APPROVED" ? 0 : 1);
      const rDiff = rank(a.status || "") - rank(b.status || "");
      if (rDiff !== 0) return rDiff;
      return (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0);
    });

  const candidateRawUrls: string[] = candidateRows.map((p: any) => p.imageUrl);

  const otherUrlMatches = (profile.otherMatrimonyInfo || "").match(/https?:\/\/[^\s,;]+/gi) || [];
  for (const extraUrl of otherUrlMatches) {
    if (!candidateRawUrls.includes(extraUrl)) {
      candidateRawUrls.push(extraUrl);
    }
  }

  for (const rawUrl of candidateRawUrls) {
    const urlVariants = buildCandidatePhotoUrls(rawUrl);
    for (const url of urlVariants) {
      try {
        const rawBuf = await fetchImageBufferWithRetry(url);
        if (!rawBuf) continue;
        const normalized = await normalizePhotoBuffer(rawBuf);
        if (normalized) return normalized;
      } catch {
        continue;
      }
    }
  }

  return null;
}

// =============================================================================
// VECTOR SILHOUETTES & CARD ICONS
// =============================================================================
function PlaceholderPortrait({ isFemale }: { isFemale: boolean }) {
  const bg = isFemale ? "#FFF1F2" : "#F8FAFC";
  const accent = isFemale ? "#9F1239" : "#1E3A8A";
  const subAccent = isFemale ? "#D97706" : "#B45309";
  const bodyFill = isFemale ? "#BE123C" : "#334155";

  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: bg,
        padding: "22px 14px 16px 14px",
        boxSizing: "border-box",
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          backgroundColor: accent,
          color: "#FEF08A",
          borderRadius: "14px",
          padding: "4px 12px",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "1px",
        },
      },
      isFemale ? "BRIDE PROFILE" : "GROOM PROFILE"
    ),
    isFemale
      ? h(
          "svg",
          { width: 176, height: 190, viewBox: "0 0 180 200" },
          h("circle", { cx: 90, cy: 96, r: 78, fill: "#FFE4E6", stroke: "#F59E0B", strokeWidth: 2 }),
          h("path", {
            d: "M42 128 C38 72, 56 32, 90 30 C124 32, 142 72, 138 128 Z",
            fill: "#4C0519",
          }),
          h("ellipse", { cx: 90, cy: 84, rx: 28, ry: 34, fill: "#FDBA74" }),
          h("line", { x1: 90, y1: 42, x2: 90, y2: 56, stroke: subAccent, strokeWidth: 2.5 }),
          h("circle", { cx: 90, cy: 59, r: 4.5, fill: "#FBBF24", stroke: "#92400E", strokeWidth: 1 }),
          h("circle", { cx: 90, cy: 74, r: 2.5, fill: "#DC2626" }),
          h("path", {
            d: "M24 188 C28 140, 52 124, 90 124 C128 124, 152 140, 156 188 Z",
            fill: bodyFill,
          }),
          h("path", {
            d: "M68 126 Q90 144 112 126",
            stroke: "#FBBF24",
            strokeWidth: 4,
            fill: "none",
            strokeLinecap: "round",
          }),
          h("path", {
            d: "M46 136 L74 188 M134 136 L106 188",
            stroke: "#FDE047",
            strokeWidth: 2.5,
            fill: "none",
          })
        )
      : h(
          "svg",
          { width: 176, height: 190, viewBox: "0 0 180 200" },
          h("circle", { cx: 90, cy: 96, r: 78, fill: "#E2E8F0", stroke: "#D97706", strokeWidth: 2 }),
          h("ellipse", { cx: 90, cy: 82, rx: 28, ry: 34, fill: "#FDBA74" }),
          h("path", {
            d: "M61 78 C60 50, 74 42, 90 42 C108 42, 120 50, 119 78 C113 62, 102 58, 90 58 C78 58, 67 62, 61 78 Z",
            fill: "#1E293B",
          }),
          h("path", {
            d: "M22 188 C26 138, 52 122, 90 122 C128 122, 154 138, 158 188 Z",
            fill: bodyFill,
          }),
          h("path", {
            d: "M72 122 L90 138 L108 122",
            stroke: "#FBBF24",
            strokeWidth: 3.5,
            fill: "none",
          }),
          h("line", { x1: 90, y1: 138, x2: 90, y2: 186, stroke: "#FBBF24", strokeWidth: 2 }),
          h("circle", { cx: 90, cy: 152, r: 2.5, fill: "#FBBF24" }),
          h("circle", { cx: 90, cy: 168, r: 2.5, fill: "#FBBF24" })
        ),
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "rgba(159, 18, 57, 0.08)",
          border: "1.5px solid #D97706",
          borderRadius: "10px",
          padding: "5px 12px",
        },
      },
      h(
        "span",
        { style: { color: "#881337", fontSize: 13, fontWeight: 700, fontFamily: FONT_STACK } },
        "PHOTO AVAILABLE ON REQUEST"
      )
    )
  );
}

function BioFieldIcon({ type, size = "md" }: { type: string; size?: "sm" | "md" }) {
  const isEmerald = type === "phone" || type === "contactPerson";
  const color = isEmerald ? "#047857" : "#9F1239";
  let pathNode: React.ReactNode = null;
  if (type === "age") {
    pathNode = h(
      "g",
      null,
      h("circle", { cx: 12, cy: 8, r: 4, fill: color }),
      h("path", { d: "M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5", stroke: color, strokeWidth: 2.2, fill: "none", strokeLinecap: "round" })
    );
  } else if (type === "height") {
    pathNode = h(
      "g",
      null,
      h("line", { x1: 12, y1: 3, x2: 12, y2: 21, stroke: color, strokeWidth: 2.4, strokeLinecap: "round" }),
      h("path", { d: "M8 7l4-4 4 4M8 17l4 4 4-4", stroke: color, strokeWidth: 2.2, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" })
    );
  } else if (type === "dob") {
    pathNode = h(
      "g",
      null,
      h("rect", { x: 3, y: 5, width: 18, height: 16, rx: 2.5, stroke: color, strokeWidth: 2.2, fill: "none" }),
      h("line", { x1: 3, y1: 10, x2: 21, y2: 10, stroke: color, strokeWidth: 2 }),
      h("line", { x1: 8, y1: 3, x2: 8, y2: 7, stroke: color, strokeWidth: 2.2, strokeLinecap: "round" }),
      h("line", { x1: 16, y1: 3, x2: 16, y2: 7, stroke: color, strokeWidth: 2.2, strokeLinecap: "round" })
    );
  } else if (type === "education") {
    pathNode = h(
      "g",
      null,
      h("polygon", { points: "12,3 2,8.5 12,14 22,8.5", fill: color }),
      h("path", { d: "M6 11.5v5.5c0 2 2.7 3.5 6 3.5s6-1.5 6-3.5v-5.5", stroke: color, strokeWidth: 2.2, fill: "none" })
    );
  } else if (type === "profession") {
    pathNode = h(
      "g",
      null,
      h("rect", { x: 3, y: 7, width: 18, height: 13, rx: 2.5, stroke: color, strokeWidth: 2.2, fill: "none" }),
      h("path", { d: "M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", stroke: color, strokeWidth: 2.2, fill: "none" }),
      h("line", { x1: 3, y1: 12, x2: 21, y2: 12, stroke: color, strokeWidth: 1.8 })
    );
  } else if (type === "caste" || type === "gotra") {
    pathNode = h(
      "g",
      null,
      h("path", { d: "M12 3l8 5v2H4V8l8-5z", fill: color }),
      h("path", { d: "M6 10v8M10 10v8M14 10v8M18 10v8M3 20h18", stroke: color, strokeWidth: 2.2, strokeLinecap: "round" })
    );
  } else if (type === "manglik") {
    pathNode = h(
      "g",
      null,
      h("rect", { x: 4, y: 4, width: 16, height: 16, stroke: color, strokeWidth: 2.2, fill: "none" }),
      h("polygon", { points: "12,4 20,12 12,20 4,12", stroke: "#D97706", strokeWidth: 1.8, fill: "none" }),
      h("circle", { cx: 12, cy: 12, r: 2.2, fill: color })
    );
  } else if (type === "father" || type === "mother" || type === "contactPerson") {
    pathNode = h(
      "g",
      null,
      h("circle", { cx: 12, cy: 8, r: 4, fill: color }),
      h("path", { d: "M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5", stroke: color, strokeWidth: 2.2, fill: "none", strokeLinecap: "round" })
    );
  } else if (type === "family") {
    pathNode = h(
      "g",
      null,
      h("circle", { cx: 8, cy: 8, r: 3, fill: color }),
      h("circle", { cx: 16, cy: 9, r: 2.6, fill: "#D97706" }),
      h("path", { d: "M2.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5", stroke: color, strokeWidth: 2, fill: "none", strokeLinecap: "round" }),
      h("path", { d: "M12.5 19c.4-2.4 2.2-4 4.5-4s4 1.6 4.5 4", stroke: "#D97706", strokeWidth: 2, fill: "none", strokeLinecap: "round" })
    );
  } else if (type === "phone") {
    pathNode = h(
      "g",
      null,
      h("path", {
        d: "M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1l-1.9 1.9z",
        fill: color,
      })
    );
  } else if (type === "address") {
    pathNode = h(
      "g",
      null,
      h("path", { d: "M3 10.5L12 3l9 7.5", stroke: color, strokeWidth: 2.2, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }),
      h("path", { d: "M5 9.5V20h14V9.5", stroke: color, strokeWidth: 2.2, fill: "none", strokeLinejoin: "round" }),
      h("rect", { x: 9.5, y: 13.5, width: 5, height: 6.5, fill: color })
    );
  } else {
    pathNode = h(
      "g",
      null,
      h("path", {
        d: "M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 1 1 13 0c0 5.2-6.5 11-6.5 11z",
        fill: color,
      }),
      h("circle", { cx: 12, cy: 10, r: 2.5, fill: "#FFFFFF" })
    );
  }

  const boxPx = size === "sm" ? 32 : 38;
  const svgPx = size === "sm" ? 18 : 21;

  return h(
    "div",
    {
      style: {
        width: `${boxPx}px`,
        height: `${boxPx}px`,
        borderRadius: size === "sm" ? "9px" : "10px",
        backgroundColor: isEmerald ? "#D1FAE5" : "#FFF1F2",
        border: `1.5px solid ${isEmerald ? "#34D399" : "#FDBA74"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      },
    },
    h("svg", { width: svgPx, height: svgPx, viewBox: "0 0 24 24" }, pathNode)
  );
}

// =============================================================================
// MAIN BIODATA JPEG BUFFER GENERATOR (1080 x 1350)
// =============================================================================
export async function generateBiodataJpegBuffer(
  profile: BiodataProfileInput | any,
  options?: { hideContactDetails?: boolean }
): Promise<Buffer> {
  const assets = loadCardAssets();
  await ensureLogoDataUri(assets);

  const withoutContact = Boolean(options?.hideContactDetails);
  const isFemale = isFemaleProfile(profile);
  const legacyId = extractValidLegacyId(profile);
  const newId = profile.profileId || profile.id;
  const candidateName = extractCandidateName(profile);

  const categoryFolder = getBiodataCategoryFolder(profile as BiodataProfileInput);

  const age = calculateExactIstAge(profile.dateOfBirth);
  const heightText = formatHeightDisplay(profile.height);
  const rawBirthTime = cleanGotraOrCasteValue(profile.birthTime);
  const dobBase = profile.dateOfBirth ? formatDOB(profile.dateOfBirth) : "Not Specified";
  const dobDisplay =
    rawBirthTime && rawBirthTime.length <= 16 ? `${dobBase} • ${rawBirthTime}` : dobBase;

  const educationText = truncateText(
    cleanString(profile.education?.highestQualification) || "Not Specified",
    96
  );
  const professionIncomeText = extractProfessionIncome(profile, assets.hasNirmala);
  const casteGotraText = extractCasteGotra(profile);
  const manglikText = formatManglikDisplay(profile.manglik);
  const rawDiet = cleanGotraOrCasteValue(profile.diet);
  const formattedDiet =
    rawDiet && (rawDiet === rawDiet.toLowerCase() || rawDiet === rawDiet.toUpperCase())
      ? toTitleCase(rawDiet)
      : rawDiet;
  const manglikDietText = formattedDiet ? `${manglikText} • ${formattedDiet}` : manglikText;

  const nativePlace = extractNativePlace(profile);
  const residentialAddress = extractResidentialAddress(profile, nativePlace);
  const fatherDetail = formatParentDetail(
    profile.family?.fatherName,
    profile.family?.fatherOccupation
  );
  const motherDetail = formatParentDetail(
    profile.family?.motherName,
    profile.family?.motherOccupation
  );
  const familySummary = extractFamilySummary(profile.family);
  const contactInfo = extractContactInfo(profile);

  const casteGotraNativeText = (() => {
    const base = casteGotraText;
    if (
      nativePlace &&
      nativePlace !== "India" &&
      !base.toLowerCase().includes(nativePlace.split(",")[0].trim().toLowerCase())
    ) {
      return truncateText(`${base} • Native: ${nativePlace}`, 88);
    }
    return base;
  })();

  const rawMarital = cleanString(profile.maritalStatus) || "Never Married";
  const conciseMarital = truncateText(toTitleCase(rawMarital), 22);

  const photoDataUri = await fetchCandidateNormalizedPhoto(profile);

  const nameLen = candidateName.length;
  const nameFontSize = nameLen > 28 ? 28 : nameLen > 20 ? 33 : 38;

  const renderInfoTile = (
    type: string,
    label: string,
    value: string,
    opts?: { fullWidth?: boolean }
  ) => {
    const valLen = value.length;
    const valFontSize = opts?.fullWidth
      ? valLen > 95
        ? 14
        : valLen > 68
        ? 15
        : 18
      : valLen > 74
      ? 13
      : valLen > 54
      ? 14
      : valLen > 36
      ? 15
      : 17;

    return h(
      "div",
      {
        key: `${type}-${label}`,
        style: {
          ...(opts?.fullWidth ? { width: "100%" } : { flex: 1 }),
          minWidth: 0,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "11px",
          backgroundColor: "#FFFDF7",
          border: "1.6px solid #F59E0B",
          borderRadius: "12px",
          padding: "10px 14px",
          boxSizing: "border-box",
          minHeight: opts?.fullWidth ? "58px" : "66px",
        },
      },
      h(BioFieldIcon, { type, size: "sm" }),
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minWidth: 0,
          },
        },
        h(
          "span",
          {
            style: {
              fontFamily: FONT_STACK,
              fontSize: 11,
              fontWeight: 700,
              color: "#9F1239",
              letterSpacing: "0.8px",
              marginBottom: "2px",
            },
          },
          label
        ),
        h(RichText, {
          text: value,
          fontSize: valFontSize,
          color: "#0F172A",
          fontWeight: 700,
          devanagariFont: assets.devanagariBoldFont,
        })
      )
    );
  };

  const renderHeroDetailRow = (label: string, value: string, labelColor = "#9F1239") => {
    const valFontSize =
      value.length > 70 ? 13 : value.length > 52 ? 14 : value.length > 34 ? 16 : 17;
    return h(
      "div",
      {
        key: label,
        style: {
          display: "flex",
          flexDirection: "row",
          alignItems: "baseline",
          gap: "8px",
        },
      },
      h(
        "span",
        {
          style: {
            color: labelColor,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.6px",
            minWidth: "106px",
            flexShrink: 0,
          },
        },
        label
      ),
      h(RichText, {
        text: value,
        fontSize: valFontSize,
        color: "#0F172A",
        fontWeight: 700,
        devanagariFont: assets.devanagariBoldFont,
        style: { flex: 1, minWidth: 0 },
      })
    );
  };

  const cardTree = h(
    "div",
    {
      style: {
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#FFFBEB",
        border: "10px solid #881337",
        boxSizing: "border-box",
        padding: "14px 20px",
        position: "relative",
        fontFamily: FONT_STACK,
      },
    },
    h("div", {
      style: {
        position: "absolute",
        top: "5px",
        left: "5px",
        right: "5px",
        bottom: "5px",
        border: "2.5px solid #D97706",
      },
    }),

    // 1. Brand Header
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundImage: "linear-gradient(135deg, #881337 0%, #9F1239 55%, #7F1D1D 100%)",
          border: "2.5px solid #FBBF24",
          borderRadius: "16px",
          padding: "10px 18px",
          boxSizing: "border-box",
        },
      },
      h(
        "div",
        { style: { display: "flex", flexDirection: "row", alignItems: "center", gap: "14px" } },
        assets.logoDataUri
          ? h(
              "div",
              {
                style: {
                  width: "70px",
                  height: "70px",
                  borderRadius: "35px",
                  backgroundColor: "#FFFFFF",
                  border: "2.5px solid #FBBF24",
                  padding: "3px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                },
              },
              h("img", {
                src: assets.logoDataUri,
                width: 64,
                height: 64,
                style: { width: "64px", height: "64px", objectFit: "contain" },
              })
            )
          : null,
        h(
          "div",
          { style: { display: "flex", flexDirection: "column" } },
          h(
            "div",
            { style: { display: "flex", alignItems: "baseline", gap: "7px" } },
            h(
              "span",
              { style: { fontSize: 30, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.4px" } },
              "RishteClub"
            ),
            h(
              "span",
              { style: { fontSize: 30, fontWeight: 700, color: "#FDE047", letterSpacing: "-0.4px" } },
              "Matrimony"
            )
          ),
          h(
            "span",
            {
              style: {
                fontSize: 13,
                fontWeight: 700,
                color: "#FEF08A",
                letterSpacing: "1.2px",
                marginTop: "1px",
              },
            },
            "NAR NAARI VIVAH SEWA • TRUSTED FAMILY MATCHMAKING"
          ),
          h(
            "span",
            { style: { fontSize: 12, fontWeight: 400, color: "#FDE68A", marginTop: "2px" } },
            "Manually Verified Rishte • Complete Family Details • Direct Connect"
          )
        )
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#047857",
            border: "2px solid #FDE047",
            borderRadius: "12px",
            padding: "8px 14px",
            flexShrink: 0,
          },
        },
        h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "6px" } },
          h(
            "svg",
            { width: 18, height: 18, viewBox: "0 0 24 24" },
            h("circle", { cx: 12, cy: 12, r: 11, fill: "#10B981" }),
            h("path", {
              d: "M7 12.5l3 3 7-7",
              stroke: "#FFFFFF",
              strokeWidth: 2.8,
              fill: "none",
              strokeLinecap: "round",
              strokeLinejoin: "round",
            })
          ),
          h(
            "span",
            { style: { color: "#FFFFFF", fontSize: 15, fontWeight: 700, letterSpacing: "0.5px" } },
            "VERIFIED"
          )
        ),
        h(
          "span",
          { style: { color: "#FEF08A", fontSize: 11, fontWeight: 700, marginTop: "2px" } },
          "ACTIVE PROFILE"
        )
      )
    ),

    // 2. Dual ID Ribbon
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#FEF3C7",
          border: "2px solid #D97706",
          borderRadius: "12px",
          padding: "7px 14px",
          gap: "10px",
        },
      },
      h(
        "div",
        { style: { display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" } },
        h(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#881337",
              borderRadius: "8px",
              padding: "5px 11px",
            },
          },
          h("span", { style: { color: "#FEF08A", fontSize: 12, fontWeight: 700 } }, "NEW ID:"),
          h("span", { style: { color: "#FFFFFF", fontSize: 14, fontWeight: 700 } }, newId)
        ),
        h(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#FFFFFF",
              border: "1.6px solid #9F1239",
              borderRadius: "8px",
              padding: "4px 11px",
            },
          },
          h("span", { style: { color: "#9F1239", fontSize: 12, fontWeight: 700 } }, "OLD ID:"),
          h(
            "span",
            { style: { color: "#0F172A", fontSize: 14, fontWeight: 700 } },
            legacyId || "Direct"
          )
        )
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            backgroundColor: isFemale ? "#BE123C" : "#047857",
            borderRadius: "8px",
            padding: "5px 13px",
          },
        },
        h(
          "span",
          { style: { color: "#FFFFFF", fontSize: 13, fontWeight: 700, letterSpacing: "0.5px" } },
          categoryFolder.toUpperCase()
        )
      )
    ),

    // 3. Hero Showcase (Photo + Bio)
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          gap: "18px",
          backgroundColor: "#FFFFFF",
          border: "2px solid #F59E0B",
          borderRadius: "16px",
          padding: "13px 16px",
          boxSizing: "border-box",
        },
      },
      h(
        "div",
        {
          style: {
            width: `${PHOTO_FRAME_W}px`,
            height: `${PHOTO_FRAME_H}px`,
            borderRadius: "14px",
            border: "3px solid #D97706",
            backgroundColor: "#FFFBEB",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            position: "relative",
          },
        },
        photoDataUri
          ? h("img", {
              src: photoDataUri,
              width: PHOTO_FRAME_W,
              height: PHOTO_FRAME_H,
              style: {
                width: "100%",
                height: "100%",
                objectFit: "cover",
              },
            })
          : h(PlaceholderPortrait, { isFemale })
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            minWidth: 0,
            padding: "2px 0",
          },
        },
        h(
          "div",
          { style: { display: "flex", flexDirection: "column" } },
          h(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "6px",
              },
            },
            h(
              "div",
              {
                style: {
                  display: "flex",
                  backgroundColor: isFemale ? "#FFE4E6" : "#DCFCE7",
                  border: `1.5px solid ${isFemale ? "#E11D48" : "#059669"}`,
                  borderRadius: "16px",
                  padding: "3px 12px",
                },
              },
              h(
                "span",
                {
                  style: {
                    color: isFemale ? "#9F1239" : "#065F46",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.8px",
                  },
                },
                isFemale ? "MATRIMONIAL BRIDE BIODATA" : "MATRIMONIAL GROOM BIODATA"
              )
            ),
            h(
              "span",
              { style: { color: "#B45309", fontSize: 12, fontWeight: 700 } },
              "|| SHREE GANESHAYA NAMAH ||"
            )
          ),
          h(RichText, {
            text: candidateName,
            fontSize: nameFontSize,
            color: "#881337",
            fontWeight: 700,
            devanagariFont: assets.devanagariBoldFont,
            style: { marginTop: "2px", marginBottom: "8px" },
          }),
          h(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "10px",
              },
            },
            h(
              "div",
              {
                style: {
                  display: "flex",
                  backgroundColor: "#FFFBEB",
                  border: "1.5px solid #F59E0B",
                  borderRadius: "9px",
                  padding: "4px 12px",
                },
              },
              h(
                "span",
                { style: { color: "#78350F", fontSize: 15, fontWeight: 700 } },
                age ? `Age: ${age} Yrs` : "Age: Not Specified"
              )
            ),
            h(
              "div",
              {
                style: {
                  display: "flex",
                  backgroundColor: "#FFFBEB",
                  border: "1.5px solid #F59E0B",
                  borderRadius: "9px",
                  padding: "4px 12px",
                },
              },
              h(
                "span",
                { style: { color: "#78350F", fontSize: 15, fontWeight: 700 } },
                `Height: ${heightText}`
              )
            ),
            h(
              "div",
              {
                style: {
                  display: "flex",
                  backgroundColor: "#FFF1F2",
                  border: "1.5px solid #FB7185",
                  borderRadius: "9px",
                  padding: "4px 12px",
                },
              },
              h(
                "span",
                { style: { color: "#9F1239", fontSize: 15, fontWeight: 700 } },
                conciseMarital
              )
            )
          )
        ),

        h(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              backgroundColor: "#FFFBEB",
              border: "1.6px solid #FCD34D",
              borderRadius: "12px",
              padding: "11px 14px",
            },
          },
          renderHeroDetailRow("DATE OF BIRTH:", dobDisplay),
          renderHeroDetailRow("EDUCATION:", educationText, "#047857"),
          renderHeroDetailRow("PROFESSION:", professionIncomeText),
          renderHeroDetailRow("MANGLIK / DIET:", manglikDietText, "#047857")
        )
      )
    ),

    // 4. Family Details & Residential Address Block
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FFFFFF",
          border: "2px solid #F59E0B",
          borderRadius: "16px",
          padding: "11px 14px",
          gap: "8px",
          boxSizing: "border-box",
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "4px",
            borderBottom: "1.5px solid #FDE68A",
          },
        },
        h(
          "span",
          {
            style: {
              color: "#881337",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "1.2px",
            },
          },
          "FAMILY DETAILS & RESIDENTIAL ADDRESS"
        ),
        h(RichText, {
          text: `City / Native: ${nativePlace}`,
          fontSize: 13,
          color: "#B45309",
          fontWeight: 700,
          devanagariFont: assets.devanagariBoldFont,
        })
      ),
      h(
        "div",
        { style: { display: "flex", flexDirection: "row", gap: "10px" } },
        renderInfoTile("father", "FATHER'S NAME & OCCUPATION", fatherDetail),
        renderInfoTile("mother", "MOTHER'S NAME & OCCUPATION", motherDetail)
      ),
      h(
        "div",
        { style: { display: "flex", flexDirection: "row", gap: "10px" } },
        renderInfoTile("gotra", "GOTRA / SUBCASTE / NATIVE PLACE", casteGotraNativeText),
        renderInfoTile("family", "FAMILY TYPE & SIBLINGS", familySummary)
      ),
      renderInfoTile("address", "RESIDENTIAL ADDRESS / CITY", residentialAddress, {
        fullWidth: true,
      })
    ),

    // 5. Contact Details Block
    !withoutContact
      ? h(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#ECFDF5",
              border: "2.5px solid #059669",
              borderRadius: "15px",
              overflow: "hidden",
              boxSizing: "border-box",
            },
          },
          h(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#065F46",
                padding: "6px 16px",
              },
            },
            h(
              "span",
              {
                style: {
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "1px",
                },
              },
              "CANDIDATE & FAMILY DIRECT CONTACT DETAILS"
            ),
            h(
              "span",
              { style: { color: "#A7F3D0", fontSize: 12, fontWeight: 700 } },
              "Direct Family Connect • Zero Brokerage"
            )
          ),
          h(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
                padding: "10px 16px",
              },
            },
            h(
              "div",
              {
                style: {
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "12px",
                  width: "56%",
                  minWidth: 0,
                },
              },
              h(BioFieldIcon, { type: "phone", size: "md" }),
              h(
                "div",
                { style: { display: "flex", flexDirection: "column", flex: 1, minWidth: 0 } },
                h(
                  "span",
                  {
                    style: {
                      color: "#047857",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.8px",
                    },
                  },
                  "MOBILE / WHATSAPP NUMBER"
                ),
                h(
                  "span",
                  {
                    style: {
                      color: "#064E3B",
                      fontSize: 24,
                      fontWeight: 700,
                      letterSpacing: "0.3px",
                      lineHeight: 1.15,
                    },
                  },
                  contactInfo.primaryPhoneDisplay
                ),
                contactInfo.alternatePhoneDisplay
                  ? h(
                      "span",
                      {
                        style: {
                          color: "#047857",
                          fontSize: 14,
                          fontWeight: 700,
                          marginTop: "2px",
                        },
                      },
                      `Alt / WhatsApp: ${contactInfo.alternatePhoneDisplay}`
                    )
                  : null
              )
            ),
            h(
              "div",
              {
                style: {
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "12px",
                  flex: 1,
                  minWidth: 0,
                  borderLeft: "2px solid #A7F3D0",
                  paddingLeft: "14px",
                },
              },
              h(BioFieldIcon, { type: "contactPerson", size: "md" }),
              h(
                "div",
                { style: { display: "flex", flexDirection: "column", flex: 1, minWidth: 0 } },
                h(
                  "span",
                  {
                    style: {
                      color: "#047857",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.8px",
                    },
                  },
                  "CONTACT PERSON"
                ),
                h(RichText, {
                  text: contactInfo.contactPersonDisplay,
                  fontSize: contactInfo.contactPersonDisplay.length > 28 ? 14 : 16,
                  color: "#0F172A",
                  fontWeight: 700,
                  devanagariFont: assets.devanagariBoldFont,
                }),
                contactInfo.emailDisplay
                  ? h(
                      "span",
                      {
                        style: {
                          color: "#334155",
                          fontSize: 13,
                          fontWeight: 700,
                          marginTop: "2px",
                        },
                      },
                      contactInfo.emailDisplay
                    )
                  : h(
                      "span",
                      {
                        style: {
                          color: "#065F46",
                          fontSize: 12,
                          fontWeight: 400,
                          marginTop: "2px",
                        },
                      },
                      `Quote ID ${legacyId || newId} on call`
                    )
              )
            )
          )
        )
      : h(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#FFF1F2",
              border: "2px solid #FB7185",
              borderRadius: "14px",
              padding: "14px 18px",
            },
          },
          h(
            "div",
            { style: { display: "flex", flexDirection: "column" } },
            h(
              "span",
              { style: { color: "#9F1239", fontSize: 14, fontWeight: 700, letterSpacing: "0.8px" } },
              "FAMILY CONTACT DETAILS PROTECTED"
            ),
            h(
              "span",
              { style: { color: "#334155", fontSize: 15, fontWeight: 700, marginTop: "3px" } },
              `To connect with this family, message Profile ID ${legacyId || newId} on NNVS Helpline`
            )
          ),
          h(
            "span",
            { style: { color: "#881337", fontSize: 14, fontWeight: 700 } },
            "PRIVACY MODE"
          )
        ),

    // 6. Footer
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          backgroundImage: "linear-gradient(135deg, #881337 0%, #9F1239 100%)",
          border: "2.5px solid #FBBF24",
          borderRadius: "16px",
          padding: "11px 18px",
          gap: "7px",
        },
      },
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          },
        },
        h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "10px" } },
          h(
            "svg",
            { width: 20, height: 20, viewBox: "0 0 24 24" },
            h("circle", { cx: 12, cy: 12, r: 10, stroke: "#FDE047", strokeWidth: 2, fill: "none" }),
            h("ellipse", { cx: 12, cy: 12, rx: 4.5, ry: 10, stroke: "#FDE047", strokeWidth: 1.5, fill: "none" }),
            h("line", { x1: 2, y1: 12, x2: 22, y2: 12, stroke: "#FDE047", strokeWidth: 1.5 })
          ),
          h(
            "span",
            { style: { color: "#FFFFFF", fontSize: 21, fontWeight: 700 } },
            "www.rishteclub.com"
          )
        ),
        h(
          "div",
          { style: { display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" } },
          ...[HELPLINE_1, HELPLINE_2].map((num) =>
            h(
              "div",
              {
                key: num,
                style: {
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#047857",
                  border: "1.6px solid #6EE7B7",
                  borderRadius: "16px",
                  padding: "5px 13px",
                  gap: "7px",
                },
              },
              h(
                "svg",
                { width: 17, height: 17, viewBox: "0 0 24 24" },
                h("circle", { cx: 12, cy: 12, r: 11, fill: "#25D366" }),
                h("path", {
                  d: "M15.4 13.7c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.91-2.2-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z",
                  fill: "#FFFFFF",
                })
              ),
              h(
                "span",
                { style: { color: "#FFFFFF", fontSize: 16, fontWeight: 700 } },
                num
              )
            )
          )
        )
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(254, 240, 138, 0.35)",
            paddingTop: "5px",
          },
        },
        h(
          "span",
          { style: { color: "#FEF08A", fontSize: 13, fontWeight: 700 } },
          "NNVS Helpline: Register Online or Share Profile ID on WhatsApp"
        ),
        h(
          "span",
          { style: { color: "#FDE68A", fontSize: 12, fontWeight: 400 } },
          "Nar Naari Vivah Sewa • Free 36 Guna Kundali"
        )
      )
    )
  );

  const imageRes = new ImageResponse(cardTree, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: assets.satoriFonts.length > 0 ? (assets.satoriFonts as any) : undefined,
  });

  const pngBuffer = Buffer.from(await imageRes.arrayBuffer());
  const jpgBuffer = await sharp(pngBuffer)
    .flatten({ background: "#FFFBEB" })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  return jpgBuffer;
}

// =============================================================================
// OPTIONAL LOCAL SAVE HELPER
// =============================================================================
export async function saveBiodataJpegLocally(
  profile: BiodataProfileInput | any,
  jpegBuffer: Buffer,
  options?: { withoutContact?: boolean; customCategoryFolder?: string }
): Promise<{ success: boolean; filePath: string; category: string; relativePath?: string; error?: string }> {
  let category = getBiodataCategoryFolder(profile);
  if (options?.withoutContact) {
    category = `${category} without contact`;
  } else if (options?.customCategoryFolder) {
    category = options.customCategoryFolder;
  }

  try {
    const defaultDDir = "D:\\NNVS\\Website Bio PDF";
    const configuredDir = process.env.PDF_STORAGE_DIR?.trim();
    const baseDir = configuredDir
      ? configuredDir
      : fs.existsSync("D:\\")
      ? defaultDDir
      : path.join(process.cwd(), "storage", "biodatas");

    const targetDir = path.join(baseDir, category);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const candidateName = ([profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || profile.user?.fullName || "Candidate")
      .replace(/[^a-zA-Z0-9_\u0900-\u097F -]/g, "_")
      .trim();
    const code = (profile.legacyProfileId || profile.profileId || profile.id || "").replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `Biodata_${code ? `${code}_` : ""}${candidateName}.jpg`;

    const fullPath = path.join(targetDir, fileName);
    fs.writeFileSync(fullPath, jpegBuffer);

    return {
      success: true,
      filePath: fullPath,
      category,
      relativePath: path.join(category, fileName),
    };
  } catch (err: any) {
    console.error("saveBiodataJpegLocally error:", err);
    return {
      success: false,
      filePath: "",
      category,
      error: err?.message || String(err),
    };
  }
}

/**
 * Auto-generates and saves/replaces the biodata JPEG for a given profile ID
 */
export async function autoGenerateAndSaveBiodataJpeg(
  profileId: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const profile = await prisma.profile.findFirst({
      where: {
        OR: [{ id: profileId }, { profileId }],
      },
      include: {
        user: {
          select: {
            fullName: true,
            gender: true,
            mobile: true,
            email: true,
          },
        },
        photos: {
          orderBy: { isPrimary: "desc" },
        },
        family: true,
        education: true,
        occupation: true,
        partnerPreference: true,
        phoneNumbers: true,
      },
    });

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    if (!profile.paymentCompleted && !profile.isPaymentExempted) {
      return {
        success: false,
        error: `Biodata generation blocked: Profile ${profile.profileId} is unpaid.`,
      };
    }

    const jpegBuffer = await generateBiodataJpegBuffer(profile as any);
    const result = await saveBiodataJpegLocally(profile as any, jpegBuffer);
    return result;
  } catch (err: any) {
    console.error(`autoGenerateAndSaveBiodataJpeg failed for ${profileId}:`, err);
    return { success: false, error: err?.message || String(err) };
  }
}
