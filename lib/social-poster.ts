import { prisma } from "@/lib/prisma";
import { BUSINESS_INFO } from "@/lib/gst";
import { getRegistrationPricingDetails, OFFER_VALIDITY_LABEL } from "@/lib/pricing";

export type SocialCategory =
  | "PROFILE_SPOTLIGHT" // Category A: Female Bride Spotlight
  | "OFFER_99"          // Category B: ₹99 Launch Offer
  | "KUNDLI_MILAN"      // Category C: Free Kundali Milan
  | "TRUST_VERIFIED";   // Category D: Verified Profiles & Trust

export const ROTATION_SEQUENCE: readonly SocialCategory[] = [
  "PROFILE_SPOTLIGHT",
  "OFFER_99",
  "KUNDLI_MILAN",
  "TRUST_VERIFIED",
] as const;

export type SocialSlot =
  | SocialCategory
  | "MORNING"
  | "AFTERNOON"
  | "SPOTLIGHT"
  | "EVENING"
  | "MANUAL"
  | "PROMOTION"
  | "REGISTRATION"
  | "MATCHMAKING_TIPS"
  | "LAUNCH_OFFER"
  | "VERIFIED_TRUST"
  | "BRIDE_SPOTLIGHT"
  | "CATEGORY_A"
  | "CATEGORY_B"
  | "CATEGORY_C"
  | "CATEGORY_D";

export interface SocialPostParams {
  slot: SocialSlot;
  imageUrl: string;
  caption?: string;
  candidateId?: string;
  candidateData?: {
    id: string;
    gender: "MALE" | "FEMALE";
    age: string | number;
    height: string;
    caste: string;
    gotra: string;
    profession: string;
    city: string;
    education?: string;
    photoUrl?: string;
    displayName?: string;
  };
  triggeredBy?: "CRON" | "ADMIN_TEST" | "ADMIN_FORCE";
  dryRun?: boolean;
}

export interface SocialPostResult {
  success: boolean;
  slot: SocialSlot;
  imageUrl: string;
  caption: string;
  facebook?: {
    success: boolean;
    postId?: string;
    error?: string;
  };
  instagram?: {
    success: boolean;
    mediaId?: string;
    error?: string;
  };
  logId?: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  error?: string;
  dryRun?: boolean;
}

export function getMetaConfig() {
  const pageAccessToken =
    process.env.META_PAGE_ACCESS_TOKEN ||
    process.env.META_IG_ACCESS_TOKEN ||
    process.env.META_ACCESS_TOKEN ||
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN ||
    "";

  const igAccessToken =
    process.env.META_IG_ACCESS_TOKEN ||
    pageAccessToken;

  const facebookPageId =
    process.env.META_FB_PAGE_ID ||
    process.env.META_PAGE_ID ||
    process.env.FACEBOOK_PAGE_ID ||
    "1445842498610887";

  const instagramAccountId =
    process.env.META_IG_ACCOUNT_ID ||
    process.env.INSTAGRAM_ACCOUNT_ID ||
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ||
    "";

  const cronSecret = (process.env.CRON_SECRET || "").trim();
  const adminSecret = (
    process.env.ADMIN_SECRET ||
    process.env.SOCIAL_ADMIN_SECRET ||
    ""
  ).trim();

  // Always use a public HTTPS URL for Meta Graph API since Meta's servers cannot crawl localhost
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  const appUrl = configuredAppUrl && !configuredAppUrl.includes("localhost")
    ? configuredAppUrl
    : "https://www.rishteclub.com";

  return {
    pageAccessToken,
    igAccessToken,
    facebookPageId,
    instagramAccountId,
    cronSecret,
    adminSecret,
    appUrl: appUrl.replace(/\/+$/, ""),
    isConfigured: Boolean((pageAccessToken || igAccessToken) && (facebookPageId || instagramAccountId)),
    hasFacebook: Boolean(pageAccessToken && facebookPageId),
    hasInstagram: Boolean(igAccessToken && instagramAccountId),
  };
}

export function getIstHour(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hourRaw = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minuteRaw = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const hour = hourRaw === 24 ? 0 : hourRaw;
  return hour + minuteRaw / 60;
}

export function getIstDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function normalizeSlotToCategory(slot?: string | null): SocialCategory {
  const s = (slot || "").trim().toUpperCase();
  if (
    s === "PROFILE_SPOTLIGHT" ||
    s === "AFTERNOON" ||
    s === "SPOTLIGHT" ||
    s === "BRIDE_SPOTLIGHT" ||
    s === "CANDIDATE" ||
    s === "CATEGORY_A"
  ) {
    return "PROFILE_SPOTLIGHT";
  }
  if (
    s === "OFFER_99" ||
    s === "LAUNCH_OFFER" ||
    s === "PROMOTION" ||
    s === "REGISTRATION" ||
    s === "EVENING" ||
    s === "CATEGORY_B"
  ) {
    return "OFFER_99";
  }
  if (
    s === "KUNDLI_MILAN" ||
    s === "MORNING" ||
    s === "FREE_KUNDALI" ||
    s === "MATCHMAKING_TIPS" ||
    s === "CATEGORY_C"
  ) {
    return "KUNDLI_MILAN";
  }
  if (
    s === "TRUST_VERIFIED" ||
    s === "VERIFIED_TRUST" ||
    s === "TRUST" ||
    s === "MANUAL" ||
    s === "CATEGORY_D"
  ) {
    return "TRUST_VERIFIED";
  }
  return "OFFER_99";
}

export function resolveSocialSlotFromTime(
  specifiedSlot?: string | null,
  date: Date = new Date()
): SocialSlot {
  if (specifiedSlot) {
    const s = specifiedSlot.trim().toUpperCase();
    if (
      s &&
      s !== "AUTO" &&
      s !== "ROTATE" &&
      (s === "MORNING" ||
        s === "AFTERNOON" ||
        s === "SPOTLIGHT" ||
        s === "EVENING" ||
        s === "MANUAL" ||
        s === "KUNDLI_MILAN" ||
        s === "PROFILE_SPOTLIGHT" ||
        s === "PROMOTION" ||
        s === "REGISTRATION" ||
        s === "MATCHMAKING_TIPS" ||
        s === "OFFER_99" ||
        s === "LAUNCH_OFFER" ||
        s === "TRUST_VERIFIED" ||
        s === "VERIFIED_TRUST" ||
        s === "BRIDE_SPOTLIGHT" ||
        s === "CATEGORY_A" ||
        s === "CATEGORY_B" ||
        s === "CATEGORY_C" ||
        s === "CATEGORY_D")
    ) {
      return s as SocialSlot;
    }
  }

  // Dynamic 2-hour 4-way IST rotation across Category A -> B -> C -> D
  const istHour = getIstHour(date);
  const block2Hr = Math.floor(istHour / 2); // 0..11 across 24h IST
  return ROTATION_SEQUENCE[block2Hr % ROTATION_SEQUENCE.length];
}

/**
 * DB-aware 4-way rotation engine for 2-hour automated runs.
 * Rotates A (Female Bride Spotlight) -> B (₹99 Offer) -> C (Free Kundali Milan) -> D (Verified Trust)
 * and prevents repeating the most recently published category consecutively.
 */
export async function resolveNextRotatedCategory(
  date: Date = new Date()
): Promise<SocialCategory> {
  const istHour = getIstHour(date);
  const block2Hr = Math.floor(istHour / 2);
  let candidate = ROTATION_SEQUENCE[block2Hr % ROTATION_SEQUENCE.length];

  try {
    const lastSuccess = await prisma.socialPostLog.findFirst({
      where: {
        status: "SUCCESS",
        NOT: [
          { facebookPostId: { startsWith: "SIM_FB_" } },
          { instagramMediaId: { startsWith: "SIM_IG_" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: { slot: true, createdAt: true },
    });

    if (lastSuccess) {
      const lastCategory = normalizeSlotToCategory(lastSuccess.slot);
      const lastIndex = ROTATION_SEQUENCE.indexOf(lastCategory);
      if (lastCategory === candidate && lastIndex >= 0) {
        candidate = ROTATION_SEQUENCE[(lastIndex + 1) % ROTATION_SEQUENCE.length];
      }
    }
  } catch (err) {
    console.warn("[Social Rotation Warning]: Failed to check last post log, using time bucket:", err);
  }

  return candidate;
}

/**
 * Auto-generate scroll-stopping Hindi/Hinglish social captions with direct clickable CTAs,
 * WhatsApp helplines, bulleted highlights, and high-reach Indian wedding hashtags.
 */
export function generateSocialCaption(
  slot: SocialSlot,
  data?: {
    quote?: string;
    candidateData?: SocialPostParams["candidateData"];
    title?: string;
  },
  now: Date = new Date()
): string {
  const helpline1 = "+91 9871592002";
  const helpline2 = "+91 7015812359";
  const website = "https://www.rishteclub.com";
  const category = normalizeSlotToCategory(slot);
  const femalePricing = getRegistrationPricingDetails("FEMALE", now);
  const malePricing = getRegistrationPricingDetails("MALE", now);
  const isOfferActive = femalePricing.isOfferActive;

  // =========================================================================
  // CATEGORY A: FEMALE BRIDE SPOTLIGHT (Consented, Verified, With Real Photo)
  // =========================================================================
  if (category === "PROFILE_SPOTLIGHT" && data?.candidateData) {
    const c = data.candidateData;
    const id = c.id || "RC-Featured";
    const displayName = c.displayName || "Verified Bride";
    const age = c.age ? `${c.age} Yrs` : "26 Yrs";
    const height = c.height || "5'4\"";
    const education = c.education || "Graduate";
    const profession = c.profession || "Working Professional";
    const community = c.caste || "Hindu";
    const city = c.city || "Delhi NCR";

    return (
      `✨ वधू प्रोफाइल (Verified Bride Spotlight) — RishteClub Matrimony ✨\n` +
      `पारिवारिक मूल्यों और विश्वास पर आधारित 100% सत्यापित रिश्ता 💍\n\n` +
      `🆔 Profile ID: ${id}\n` +
      `👰 Candidate: ${displayName} (Verified Bride)\n` +
      `• 🎂 Age & Height: ${age} • ${height}\n` +
      `• 🎓 Education: ${education}\n` +
      `• 💼 Profession: ${profession}\n` +
      `• 🏛️ Community: ${community}\n` +
      `• 📍 Location: ${city}\n\n` +
      `🔒 Privacy Guarantee: परिवार के फ़ोन नंबर केवल सत्यापित और रजिस्टर्ड परिवारों को ही उपलब्ध कराए जाते हैं — कोई दलाल या कमीशन नहीं!\n\n` +
      `👉 पूरी प्रोफाइल देखने और संपर्क करने के लिए विजिट करें: ${website}/register\n\n` +
      `📞 WhatsApp & Matchmaking Helpline:\n` +
      `• WhatsApp / Call: ${helpline1} | ${helpline2}\n\n` +
      `#RishteClub #Matrimony #Shaadi #KundaliMilan #VerifiedMatches #BrideSpotlight #VerifiedBride #Vivah #HinduMatrimony #IndianWedding`
    );
  }

  // =========================================================================
  // CATEGORY C: FREE KUNDALI MILAN
  // =========================================================================
  if (category === "KUNDLI_MILAN") {
    return (
      `🔮 RishteClub पर पाएं 100% Free & Accurate Kundali Matching! ✨\n` +
      `शादी का सही फ़ैसला लें वैदिक ज्योतिष और सटीक 36 गुण मिलान के साथ 🙏\n\n` +
      `विवाह से पहले वर-वधू की कुंडली का सटीक अष्टकूट मिलान (वर्ण, वश्य, तारा, योनि, ग्रह मैत्री, गण, भकूट, नाड़ी) अब बिल्कुल मुफ़्त — कुछ ही सेकंड में!\n\n` +
      `⭐ Free Kundali Milan Features:\n` +
      `• ✅ 36 Guna Ashtakoot Score + सरल हिंदी व अंग्रेज़ी व्याख्या\n` +
      `• ✅ सटीक मांगलिक दोष (Manglik Dosha) जांच व वैदिक समाधान\n` +
      `• ✅ नाड़ी व भकूट दोष का शास्त्रीय विश्लेषण\n` +
      `• ✅ परिवार के साथ शेयर करने योग्य Free Instant PDF Report\n\n` +
      `👉 फ्री कुंडली मिलान के लिए क्लिक करें: ${website}/kundali\n\n` +
      `📞 WhatsApp & Astrology Helpline:\n` +
      `• WhatsApp / Call: ${helpline1} | ${helpline2}\n\n` +
      `#RishteClub #Matrimony #Shaadi #KundaliMilan #VerifiedMatches #FreeKundali #GunMilan #ManglikDosha #VedicAstrology #IndianWedding`
    );
  }

  // =========================================================================
  // CATEGORY D: VERIFIED PROFILES & TRUST
  // =========================================================================
  if (category === "TRUST_VERIFIED") {
    return (
      `🛡️ 100% Manually Verified Matches | Direct Family Connect — RishteClub Matrimony 💍\n` +
      `Managed by NNVS Matrimony — जहाँ हर रिश्ता विश्वास, सुरक्षा और सम्मान के साथ जुड़ता है 🙏\n\n` +
      `अजनबी प्रोफाइल्स और फेक कॉल्स से परेशान हैं? RishteClub पर हम हर बायोडाटा को मैनुअली वेरिफाई करते हैं ताकि आपका परिवार सुरक्षित व सही जीवनसाथी चुन सके।\n\n` +
      `⭐ क्यों चुनें RishteClub Matrimony?\n` +
      `• ✅ 100% Manually Verified & Family-Screened Biodatas\n` +
      `• ✅ Direct Family Contact — सीधे माता-पिता/परिवार से बात, Zero Brokerage\n` +
      `• ✅ Agarwal, Baniya, Brahmin, Punjabi, Khatri, Jain & All Communities\n` +
      `• ✅ Strong Photo & Contact Privacy Safeguards\n\n` +
      `👉 पूरी प्रोफाइल देखने और संपर्क करने के लिए विजिट करें: ${website}/register\n` +
      `👉 फ्री कुंडली मिलान के लिए क्लिक करें: ${website}/kundali\n\n` +
      `📞 WhatsApp & Matchmaker Support:\n` +
      `• WhatsApp / Call: ${helpline1} | ${helpline2}\n\n` +
      `#RishteClub #Matrimony #Shaadi #KundaliMilan #VerifiedMatches #DirectFamilyConnect #TrustedMatrimony #Vivah #HinduMatrimony #Rishtey`
    );
  }

  // =========================================================================
  // CATEGORY B: ₹99 LAUNCH OFFER (Default / Promotion / Offer 99)
  // =========================================================================
  if (isOfferActive) {
    return (
      `🎉 धमाकेदार लॉन्च ऑफर! Get Direct Verified Match Contacts at just ₹${femalePricing.baseFee}! 🎉\n` +
      `सीमित समय का विशेष अवसर (${OFFER_VALIDITY_LABEL}) — अब सिर्फ ₹${femalePricing.baseFee} + GST (कुल ₹${Math.round(femalePricing.totalAmount)}) में जुड़ें! 💍\n\n` +
      `⭐ इस विशेष ₹${femalePricing.baseFee} ऑफर में क्या मिलेगा?\n` +
      `• 👰 Brides (Kanya): मात्र ₹${femalePricing.baseFee} + GST (Regular ₹${femalePricing.regularBaseFee} + GST — 88% तक की बचत)\n` +
      `• 🤵 Grooms (Var): मात्र ₹${malePricing.baseFee} + GST (Regular ₹${malePricing.regularBaseFee} + GST — 88% तक की बचत)\n` +
      `• 📞 परिवारों के सीधे संपर्क नंबर (Zero Middlemen / Zero Monthly Fee)\n` +
      `• 🔮 100% Verified Profiles + Free 36 Guna Kundali Milan\n\n` +
      `👉 ऑफर का लाभ उठाने के लिए अभी रजिस्टर करें: ${website}\n\n` +
      `📞 WhatsApp Registration Support:\n` +
      `• WhatsApp / Call: ${helpline1} | ${helpline2}\n\n` +
      `#RishteClub #Matrimony #Shaadi #KundaliMilan #VerifiedMatches #LaunchOffer #Rishtey99 #IndianWedding #Vivah #Matchmaking`
    );
  }

  return (
    `💍 अपनों के लिए सही जीवनसाथी — RishteClub Matrimony 💍\n` +
    `Managed by NNVS Matrimony — पारिवारिक प्रतिष्ठा और शुद्ध भारतीय संस्कारों का संगम 🙏\n\n` +
    `⭐ Transparent Lifetime Membership:\n` +
    `• 👰 Kanya (Bride) Registration: ₹${Math.round(femalePricing.totalAmount)} (₹${femalePricing.baseFee} + GST)\n` +
    `• 🤵 Var (Groom) Registration: ₹${Math.round(malePricing.totalAmount)} (₹${malePricing.baseFee} + GST)\n` +
    `• 📞 Direct Family Contact — कोई मासिक शुल्क या ब्रोकरेज नहीं\n` +
    `• 🔮 100% Manually Verified Profiles & Free 36 Guna Kundali Milan\n\n` +
    `👉 ऑफर का लाभ उठाने के लिए अभी रजिस्टर करें: ${website}\n\n` +
    `📞 WhatsApp & Matchmaking Helpline:\n` +
    `• WhatsApp / Call: ${helpline1} | ${helpline2}\n\n` +
    `#RishteClub #Matrimony #Shaadi #KundaliMilan #VerifiedMatches #Vivah #IndianMatrimony #HinduMatrimony #Rishtey`
  );
}

const REJECTED_PHOTO_PATTERNS = [
  "placeholder",
  "default-avatar",
  "default_avatar",
  "silhouette",
  "no-photo",
  "no_photo",
  "blank",
  "dsc00173",
  "/images/wedding/",
];

function isPrivateOrLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }

  // Block IPv4 loopback, link-local (169.254/16), and RFC1918 private ranges
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Validate and normalize a candidate photo URL for public OG spotlight cards.
 * Rejects base64 data URIs, SVGs, local/private hosts, and banner/silhouette placeholders.
 */
export function normalizeSpotlightPhotoUrl(
  rawUrl?: string | null,
  appUrl: string = "https://www.rishteclub.com"
): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  let trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("data:") ||
    lower.startsWith("blob:") ||
    lower.endsWith(".svg") ||
    REJECTED_PHOTO_PATTERNS.some((pattern) => lower.includes(pattern))
  ) {
    return null;
  }

  if (trimmed.startsWith("/")) {
    trimmed = `${appUrl.replace(/\/+$/, "")}${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    if (isPrivateOrLocalHostname(parsed.hostname)) {
      return null;
    }
    // Always use HTTPS for CDN / Cloudinary / Google Drive URLs
    if (parsed.protocol === "http:") {
      parsed.protocol = "https:";
    }

    // Ensure Cloudinary delivery URLs serve Satori-compatible JPEG rather than WebP
    if (
      parsed.hostname.includes("res.cloudinary.com") &&
      parsed.pathname.includes("/image/upload/")
    ) {
      if (parsed.pathname.toLowerCase().endsWith(".webp")) {
        parsed.pathname = parsed.pathname.replace(/\.webp$/i, ".jpg");
      } else if (!parsed.pathname.includes("/f_jpg") && !parsed.pathname.includes("/f_png")) {
        parsed.pathname = parsed.pathname.replace("/image/upload/", "/image/upload/f_jpg/");
      }
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function detectRasterMimeFromBytes(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/gif" | null {
  if (bytes.length < 12) return null;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  // GIF: GIF8
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "image/gif";
  }
  return null;
}

/**
 * Fetch and verify that a remote spotlight photo resolves to a real, non-tiny raster image
 * compatible with Satori (JPEG/PNG/GIF) and returns either a data URI or verification status.
 */
export async function fetchVerifiedRasterPhoto(
  rawUrl?: string | null,
  timeoutMs: number = 8000
): Promise<{ valid: boolean; normalizedUrl?: string; dataUri?: string; bytes?: number; mime?: string; reason?: string }> {
  const normalizedUrl = normalizeSpotlightPhotoUrl(rawUrl);
  if (!normalizedUrl) {
    return { valid: false, reason: "Invalid or disallowed spotlight photo URL" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(normalizedUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "image/jpeg,image/png,image/gif;q=0.9,*/*;q=0.1",
        "User-Agent": "Mozilla/5.0 (compatible; RishteClubPoster/1.0; +https://www.rishteclub.com)",
      },
    });

    if (!res.ok) {
      return { valid: false, normalizedUrl, reason: `HTTP ${res.status}` };
    }

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    if (contentType && !contentType.startsWith("image/")) {
      return { valid: false, normalizedUrl, reason: `Non-image content-type: ${contentType}` };
    }
    if (contentType.includes("svg")) {
      return { valid: false, normalizedUrl, reason: "SVG photos are not allowed" };
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength < 2048 || buf.byteLength > 8 * 1024 * 1024) {
      return {
        valid: false,
        normalizedUrl,
        reason: `Photo byte size out of quality bounds (${buf.byteLength} bytes)`,
      };
    }

    const bytes = new Uint8Array(buf);
    const mime = detectRasterMimeFromBytes(bytes);
    if (!mime) {
      return {
        valid: false,
        normalizedUrl,
        reason: "Unsupported or non-raster image format (requires JPEG, PNG, or GIF)",
      };
    }

    const base64 = Buffer.from(bytes).toString("base64");
    return {
      valid: true,
      normalizedUrl,
      mime,
      bytes: buf.byteLength,
      dataUri: `data:${mime};base64,${base64}`,
    };
  } catch (err: any) {
    return {
      valid: false,
      normalizedUrl,
      reason: err?.message || "Failed to download photo",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function verifySpotlightPhotoReachable(
  rawUrl?: string | null,
  timeoutMs: number = 6000
): Promise<boolean> {
  const check = await fetchVerifiedRasterPhoto(rawUrl, timeoutMs);
  return check.valid;
}

function calculateExactAge(dob?: Date | string | null): string {
  if (!dob) return "26";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "26";
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 18 && age <= 75 ? String(age) : "26";
}

function toTitleWord(word: string): string {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function formatSpotlightDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  fullName?: string | null
): string {
  const cleanFirstRaw = (firstName || fullName?.trim().split(/\s+/)[0] || "Verified")
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-zA-Z\s.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const firstWord = cleanFirstRaw.split(/\s+/)[0] || "Verified";
  const formattedFirst = toTitleWord(firstWord);

  const cleanLastRaw = (lastName || fullName?.trim().split(/\s+/).slice(1).join(" ") || "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-zA-Z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const lastInitial = cleanLastRaw ? ` ${cleanLastRaw.charAt(0).toUpperCase()}.` : "";

  return `${formattedFirst}${lastInitial}`;
}

export function formatSpotlightHeight(raw?: string | null, isFemale: boolean = true): string {
  const fallback = isFemale ? "5'4\"" : "5'10\"";
  if (!raw || typeof raw !== "string") return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  // Normalize formats like 5.4", 5.6, 5ft.2inch, 5' 4" -> 5'4"
  const ftInchMatch = trimmed.match(/^(\d)\s*(?:ft\.?|'|feet)?\s*[.\s-]?\s*(\d{1,2})?\s*(?:inch(?:es)?|in|")?$/i);
  if (ftInchMatch) {
    const ft = ftInchMatch[1];
    const inches = ftInchMatch[2] ?? "0";
    return `${ft}'${inches}"`;
  }
  return trimmed.slice(0, 16);
}

export function formatSpotlightCity(raw?: string | null): string {
  if (!raw || typeof raw !== "string") return "Delhi NCR";
  let cleaned = raw
    .replace(/\b\d{6}\b/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[,\s-]+|[,\s-]+$/g, "")
    .trim();
  if (!cleaned) return "Delhi NCR";

  if (cleaned === cleaned.toUpperCase()) {
    cleaned = cleaned
      .split(/\s+/)
      .map(toTitleWord)
      .join(" ");
  }
  return cleaned.length > 42 ? `${cleaned.slice(0, 39).trim()}...` : cleaned;
}

export function formatSpotlightField(raw?: string | null, fallback: string = "Not Specified", maxLen: number = 48): string {
  if (!raw || typeof raw !== "string") return fallback;
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return fallback;
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen - 3).trim()}...` : cleaned;
}

export type SpotlightCandidateRecord = {
  id: string;
  profileId: string;
  legacyProfileId: string | null;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: Date | null;
  height: string | null;
  caste: string | null;
  religion: string | null;
  birthPlace: string | null;
  user: { fullName: string | null; gender: "MALE" | "FEMALE" | null } | null;
  education: { highestQualification: string | null } | null;
  occupation: { profession: string | null } | null;
};

export function buildSpotlightCandidateData(
  profile: SpotlightCandidateRecord,
  verifiedPhotoUrl: string
): NonNullable<SocialPostParams["candidateData"]> {
  const isFemale = profile.user?.gender === "FEMALE";
  const displayId = profile.legacyProfileId || profile.profileId;
  const age = calculateExactAge(profile.dateOfBirth);
  const displayName = formatSpotlightDisplayName(
    profile.firstName,
    profile.lastName,
    profile.user?.fullName
  );
  const cleanCity = formatSpotlightCity(profile.birthPlace);
  const cleanEducation = formatSpotlightField(profile.education?.highestQualification, "Graduate", 52);
  const cleanProfession = formatSpotlightField(profile.occupation?.profession, "Working Professional", 48);
  const cleanCaste = formatSpotlightField(profile.caste || profile.religion, "Hindu", 36);

  return {
    id: displayId,
    gender: "FEMALE",
    age,
    height: formatSpotlightHeight(profile.height, isFemale),
    caste: cleanCaste,
    gotra: "Gotra Available",
    profession: cleanProfession,
    city: cleanCity,
    education: cleanEducation,
    photoUrl: verifiedPhotoUrl,
    displayName,
  };
}

/**
 * Fetch an active, verified FEMALE profile with explicit privacy consent and an approved
 * downloadable public photo for automated Bride Spotlight postcards.
 * Never returns male profiles, non-consented profiles, or profiles without a verified photo.
 */
export async function fetchSpotlightProfile(
  options?: string | { preferredCandidateId?: string; excludeCandidateIds?: string[] }
): Promise<{
  candidateId: string;
  candidateData: NonNullable<SocialPostParams["candidateData"]>;
} | null> {
  try {
    const opts =
      typeof options === "string"
        ? { preferredCandidateId: options }
        : options || {};
    const config = getMetaConfig();
    const extraExcluded = new Set((opts.excludeCandidateIds || []).filter(Boolean));

    const strictFemaleWhere: any = {
      approvalStatus: "APPROVED",
      isVisible: true,
      consentSocialMedia: true,
      user: {
        gender: "FEMALE",
        status: "ACTIVE",
      },
      OR: [
        { legacyProfileId: null },
        { NOT: { legacyProfileId: { startsWith: "NNVS-B" } } },
      ],
      photos: {
        some: {
          status: "APPROVED",
          OR: [
            { imageUrl: { startsWith: "https://" } },
            { imageUrl: { startsWith: "http://" } },
          ],
        },
      },
    };

    const spotlightInclude = {
      user: { select: { fullName: true, gender: true } },
      photos: {
        where: {
          status: "APPROVED" as const,
          OR: [
            { imageUrl: { startsWith: "https://" } },
            { imageUrl: { startsWith: "http://" } },
          ],
        },
        orderBy: [{ isPrimary: "desc" as const }, { createdAt: "desc" as const }],
      },
      education: { select: { highestQualification: true } },
      occupation: { select: { profession: true } },
    };

    // Optional explicit candidate selection (must still pass all strict female, consent & photo rules)
    if (opts.preferredCandidateId) {
      const explicitProfile = await prisma.profile.findFirst({
        where: {
          AND: [
            strictFemaleWhere,
            {
              OR: [
                { id: opts.preferredCandidateId },
                { profileId: opts.preferredCandidateId },
                { legacyProfileId: opts.preferredCandidateId },
              ],
            },
          ],
        },
        include: spotlightInclude,
      });

      if (!explicitProfile) {
        console.warn(
          `[Spotlight Profile] Requested candidate '${opts.preferredCandidateId}' is not eligible (requires FEMALE, APPROVED, visible, consentSocialMedia=true, approved public photo).`
        );
        return null;
      }

      for (const ph of explicitProfile.photos) {
        const normalized = normalizeSpotlightPhotoUrl(ph.imageUrl, config.appUrl);
        if (normalized && (await verifySpotlightPhotoReachable(normalized))) {
          return {
            candidateId: explicitProfile.id,
            candidateData: buildSpotlightCandidateData(explicitProfile, normalized),
          };
        }
      }

      console.warn(
        `[Spotlight Profile] Requested candidate '${opts.preferredCandidateId}' has no reachable high-quality photo.`
      );
      return null;
    }

    // 1. Deduplication & fair rotation: inspect successful spotlight posts from last 60 days
    const recentLogs = await prisma.socialPostLog.findMany({
      where: {
        candidateId: { not: null },
        status: "SUCCESS",
        createdAt: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
      select: { candidateId: true, createdAt: true },
    });

    const lastPostedAtByCandidate = new Map<string, number>();
    for (const log of recentLogs) {
      if (log.candidateId && !lastPostedAtByCandidate.has(log.candidateId)) {
        lastPostedAtByCandidate.set(log.candidateId, log.createdAt.getTime());
      }
    }

    // 2. Fetch all eligible verified FEMALE profiles with consent & approved public photos
    const eligibleProfiles = await prisma.profile.findMany({
      where: strictFemaleWhere,
      include: spotlightInclude,
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    if (eligibleProfiles.length === 0) {
      console.warn(
        "[Spotlight Profile] No verified FEMALE profiles found with social consent and approved photos."
      );
      return null;
    }

    // Prioritize unposted profiles (not posted in 60-day window and not excluded),
    // then cycle fairly through least-recently-posted eligible females.
    const orderedCandidates = [...eligibleProfiles]
      .filter((p) => !extraExcluded.has(p.id))
      .sort((a, b) => {
        const aTime = lastPostedAtByCandidate.get(a.id);
        const bTime = lastPostedAtByCandidate.get(b.id);
        if (aTime === undefined && bTime !== undefined) return -1;
        if (aTime !== undefined && bTime === undefined) return 1;
        if (aTime !== undefined && bTime !== undefined) return aTime - bTime;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });

    if (orderedCandidates.length === 0) {
      console.warn(
        "[Spotlight Profile] All eligible consented female candidates were excluded from selection."
      );
      return null;
    }

    for (const profile of orderedCandidates) {
      if (profile.user?.gender !== "FEMALE") continue;
      for (const ph of profile.photos) {
        const normalized = normalizeSpotlightPhotoUrl(ph.imageUrl, config.appUrl);
        if (!normalized) continue;
        const ok = await verifySpotlightPhotoReachable(normalized);
        if (ok) {
          return {
            candidateId: profile.id,
            candidateData: buildSpotlightCandidateData(profile, normalized),
          };
        }
      }
    }

    console.warn(
      "[Spotlight Profile] Eligible consented female candidates had no downloadable raster photo."
    );
    return null;
  } catch (err) {
    console.error("[Spotlight Profile Error]:", err);
    return null;
  }
}

/**
 * Internal Meta Graph API fetch wrapper with explicit 15-second timeout to avoid Vercel hangs
 */
async function fetchMetaGraph(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Memory cache for resolved Facebook Page tokens to prevent redundant API calls
 */
let cachedFacebookPageData: { pageId: string; pageToken: string; timestamp: number } | null = null;

async function getFacebookPageAccessToken(
  rawToken: string,
  targetPageId: string
): Promise<{ pageId: string; pageToken: string }> {
  // Use cached token if resolved for the same page within the last 10 minutes
  if (
    cachedFacebookPageData &&
    cachedFacebookPageData.pageId === targetPageId &&
    Date.now() - cachedFacebookPageData.timestamp < 10 * 60 * 1000
  ) {
    return {
      pageId: cachedFacebookPageData.pageId,
      pageToken: cachedFacebookPageData.pageToken,
    };
  }

  try {
    const accRes = await fetchMetaGraph(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${rawToken}`
    );
    const accData = await accRes.json();
    if (accData?.data?.length > 0) {
      const matchedPage = accData.data.find((p: any) => p.id === targetPageId);

      if (matchedPage) {
        const resolved = {
          pageId: matchedPage.id,
          pageToken: matchedPage.access_token,
          timestamp: Date.now(),
        };
        cachedFacebookPageData = resolved;
        console.log(
          `[Meta API] Resolved Page Access Token for: "${matchedPage.name}" (ID: ${matchedPage.id})`
        );
        return { pageId: resolved.pageId, pageToken: resolved.pageToken };
      }

      console.warn(
        `[Meta API] Target Page ID "${targetPageId}" not found in /me/accounts. Available in token: ${accData.data
          .map((p: any) => `"${p.name}" (${p.id})`)
          .join(", ")}`
      );
    }

    // Try direct page token query for targetPageId in case token has direct access
    const directRes = await fetchMetaGraph(
      `https://graph.facebook.com/v21.0/${targetPageId}?fields=id,name,access_token&access_token=${rawToken}`
    );
    const directData = await directRes.json();
    if (directData?.access_token) {
      const resolved = {
        pageId: directData.id || targetPageId,
        pageToken: directData.access_token,
        timestamp: Date.now(),
      };
      cachedFacebookPageData = resolved;
      console.log(`[Meta API] Resolved Page Access Token directly for ID ${targetPageId}`);
      return { pageId: resolved.pageId, pageToken: resolved.pageToken };
    }
  } catch (err) {
    console.warn("[Meta API] Page token upfront resolution warning:", err);
  }

  return { pageId: targetPageId, pageToken: rawToken };
}

export interface FacebookPublishResult {
  success: boolean;
  postId?: string;
  permalinkUrl?: string;
  error?: string;
}

/**
 * Publish photo post to Facebook Page via Meta Graph API v21.0
 * 2-Step Timeline Feed Story Flow (Meta New Pages Experience):
 * - Step A: POST /{page-id}/photos (url, published: false, temporary: true) -> Extracts media_fbid
 * - Step B: POST /{page-id}/feed (message: caption, attached_media: [{ media_fbid }], published: true) -> Broadcasts main public Timeline Feed Story
 * - Fallback: Direct /{page-id}/photos with published: true and no_story: false if feed endpoint fails
 */
export async function publishToFacebookPage({
  imageUrl,
  caption,
  pageId,
  accessToken,
}: {
  imageUrl: string;
  caption: string;
  pageId?: string;
  accessToken?: string;
}): Promise<FacebookPublishResult> {
  try {
    const config = getMetaConfig();
    let fbPageId =
      pageId ||
      config.facebookPageId ||
      process.env.META_FB_PAGE_ID ||
      "1445842498610887";

    // Autocorrect old or mismatched IDs if passed
    if (
      fbPageId === "122125395483335905" ||
      fbPageId === "1103030792895654" ||
      fbPageId === "61595356571839"
    ) {
      fbPageId = "1445842498610887";
    }

    const rawToken =
      accessToken ||
      config.pageAccessToken ||
      process.env.META_PAGE_ACCESS_TOKEN ||
      "";

    if (!rawToken) {
      return {
        success: false,
        error:
          "Missing Facebook Page Access Token (META_PAGE_ACCESS_TOKEN). Ensure valid token is configured.",
      };
    }

    // Resolve Page Access Token from System User token upfront
    let { pageId: resolvedPageId, pageToken } =
      await getFacebookPageAccessToken(rawToken, fbPageId);
    fbPageId = resolvedPageId;

    // === STEP A: Upload Unpublished Staging Photo Asset (published: false, temporary: true) ===
    let uploadRes = await fetchMetaGraph(`https://graph.facebook.com/v21.0/${fbPageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: imageUrl,
        published: false,
        temporary: true,
        access_token: pageToken,
      }),
    });

    let uploadData = await uploadRes.json();

    // If initial upload fails with token/permission issue, refresh via /me/accounts and retry
    if (!uploadRes.ok || uploadData.error) {
      console.warn(
        "[Meta API] Photo upload warning, refreshing Page token:",
        uploadData.error?.message
      );
      try {
        const accRes = await fetchMetaGraph(
          `https://graph.facebook.com/v21.0/me/accounts?access_token=${rawToken}`
        );
        const accData = await accRes.json();
        const matchedPage = accData?.data?.find((p: any) => p.id === fbPageId);
        if (matchedPage?.access_token) {
          pageToken = matchedPage.access_token;
          cachedFacebookPageData = {
            pageId: fbPageId,
            pageToken: matchedPage.access_token,
            timestamp: Date.now(),
          };

          uploadRes = await fetchMetaGraph(`https://graph.facebook.com/v21.0/${fbPageId}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: imageUrl,
              published: false,
              temporary: true,
              access_token: pageToken,
            }),
          });
          uploadData = await uploadRes.json();
        }
      } catch (refreshErr) {
        console.error("[Meta API] Page token refresh error:", refreshErr);
      }
    }

    const photoFbid = uploadData?.id;

    // === STEP B: Broadcast as Main Timeline Feed Story (/feed) ===
    if (photoFbid) {
      const feedRes = await fetchMetaGraph(`https://graph.facebook.com/v21.0/${fbPageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: caption,
          attached_media: [{ media_fbid: photoFbid }],
          published: true,
          access_token: pageToken,
        }),
      });

      const feedData = await feedRes.json();

      if (feedRes.ok && feedData?.id) {
        const feedPostId = feedData.id;
        const storyFbid = feedPostId.includes("_") ? feedPostId.split("_")[1] : feedPostId;
        let permalinkUrl = `https://www.facebook.com/permalink.php?story_fbid=${storyFbid}&id=${fbPageId}`;

        try {
          const detailRes = await fetchMetaGraph(
            `https://graph.facebook.com/v21.0/${feedPostId}?fields=permalink_url,is_published,is_hidden,timeline_visibility&access_token=${encodeURIComponent(pageToken)}`
          );
          const detailData = await detailRes.json();
          if (detailData?.permalink_url) {
            permalinkUrl = detailData.permalink_url;
          }
        } catch {
          // Keep universal permalink.php URL fallback
        }

        console.log(
          `[Meta API] Feed Timeline Story published successfully: ${feedPostId} (${permalinkUrl})`
        );

        return {
          success: true,
          postId: feedPostId,
          permalinkUrl,
        };
      }

      console.warn(
        "[Meta API] Feed endpoint failed, falling back to direct /photos publish:",
        feedData.error?.message
      );
    }

    // === FALLBACK: Direct /{page-id}/photos with published: true and no_story: false ===
    const directRes = await fetchMetaGraph(`https://graph.facebook.com/v21.0/${fbPageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: imageUrl,
        caption: caption,
        message: caption,
        published: true,
        no_story: false,
        access_token: pageToken,
      }),
    });

    const directData = await directRes.json();
    if (!directRes.ok || directData.error) {
      const errMsg =
        directData.error?.message ||
        uploadData.error?.message ||
        `Facebook API returned HTTP ${directRes.status}`;
      console.error("[Meta API] Facebook Page Post Failed:", directData.error || directData);
      return { success: false, error: errMsg };
    }

    const postId = directData.post_id || directData.id;
    const storyFbid = postId.includes("_") ? postId.split("_")[1] : postId;
    let permalinkUrl = `https://www.facebook.com/permalink.php?story_fbid=${storyFbid}&id=${fbPageId}`;

    try {
      const detailRes = await fetchMetaGraph(
        `https://graph.facebook.com/v21.0/${postId}?fields=permalink_url&access_token=${encodeURIComponent(pageToken)}`
      );
      const detailData = await detailRes.json();
      if (detailData?.permalink_url) {
        permalinkUrl = detailData.permalink_url;
      }
    } catch {
      // Keep universal permalink.php URL fallback
    }

    return {
      success: true,
      postId,
      permalinkUrl,
    };
  } catch (err: any) {
    console.error("[Meta API] Facebook Page Error:", err);
    return {
      success: false,
      error: err.message || "Failed to post to Facebook Page",
    };
  }
}

/**
 * Backward compatible wrapper for postToFacebookPage
 */
export async function postToFacebookPage(
  imageUrl: string,
  caption: string,
  pageId: string,
  accessToken: string
): Promise<FacebookPublishResult> {
  return publishToFacebookPage({ imageUrl, caption, pageId, accessToken });
}

/**
 * Publish photo post to Instagram Business Account via Meta Graph API Container
 */
export async function postToInstagramBusiness(
  imageUrl: string,
  caption: string,
  igAccountId: string,
  accessToken: string
): Promise<{ success: boolean; mediaId?: string; creationId?: string; error?: string }> {
  try {
    // Step 1: Create Instagram Media Container
    const containerUrl = `https://graph.facebook.com/v21.0/${igAccountId}/media`;
    const containerRes = await fetchMetaGraph(containerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken,
      }),
    });

    const containerData = await containerRes.json();
    if (!containerRes.ok || containerData.error) {
      let errMsg = containerData.error?.message || `Instagram Container creation failed (${containerRes.status})`;
      if (
        containerData.error?.code === 10 ||
        containerData.error?.error_subcode === 33 ||
        errMsg.includes("instagram_content_publish") ||
        errMsg.includes("does not exist")
      ) {
        errMsg = `${errMsg} — (Action Required: In Meta Business Suite > Settings > System Users > Rishteclubposter > Assigned Assets > Instagram Accounts, ensure '@rishteclub' (${igAccountId}) is assigned with 'Create Content' permission).`;
      }
      console.error("[Meta API] Instagram Container Failed:", containerData.error || containerData);
      return { success: false, error: errMsg };
    }

    const creationId = containerData.id;
    if (!creationId) {
      return { success: false, error: "No container ID returned from Instagram" };
    }

    // Step 2: Safety delay (approx 4-5 seconds) for Instagram to fetch and process media
    await new Promise((resolve) => setTimeout(resolve, 4500));

    // Optional status verification loop
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const statusRes = await fetchMetaGraph(
          `https://graph.facebook.com/v21.0/${creationId}?fields=status_code,status&access_token=${accessToken}`
        );
        const statusData = await statusRes.json();
        if (statusData?.status_code === "FINISHED") {
          break;
        } else if (statusData?.status_code === "ERROR") {
          return {
            success: false,
            creationId,
            error: statusData.status || "Media container processing failed on Instagram",
          };
        }
      } catch (pollErr) {
        // continue to publish
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // Step 3: Trigger Publish using Graph API v21.0 media_publish
    const publishUrl = `https://graph.facebook.com/v21.0/${igAccountId}/media_publish`;
    const publishRes = await fetchMetaGraph(publishUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    });

    const publishData = await publishRes.json();
    if (!publishRes.ok || publishData.error) {
      const errMsg = publishData.error?.message || `Instagram Publish failed (${publishRes.status})`;
      console.error("[Meta API] Instagram Publish Failed:", publishData.error || publishData);
      return { success: false, creationId, error: errMsg };
    }

    return { success: true, creationId, mediaId: publishData.id };
  } catch (err: any) {
    console.error("[Meta API] Instagram Error:", err);
    return { success: false, error: err.message || "Failed to post to Instagram Business" };
  }
}

/**
 * Orchestrate Social Posting across Instagram & Facebook with Logging
 */
export async function publishToSocialChannels(
  params: SocialPostParams
): Promise<SocialPostResult> {
  const { slot, imageUrl, candidateId, triggeredBy = "CRON", dryRun = false } = params;
  const config = getMetaConfig();

  const caption = params.caption || generateSocialCaption(slot, { candidateData: params.candidateData });

  // Handle DRY RUN or Unconfigured Meta API Mode
  if (dryRun || !config.isConfigured) {
    const reason = dryRun
      ? "Simulated Dry Run (No live Meta API call performed)"
      : "Meta API credentials not configured in environment variables (META_PAGE_ACCESS_TOKEN / META_PAGE_ID / INSTAGRAM_BUSINESS_ACCOUNT_ID)";

    const simulatedPostId = `SIM_FB_${Date.now()}`;
    const simulatedMediaId = `SIM_IG_${Date.now()}`;

    // Save log entry to database
    let logRecord = null;
    try {
      logRecord = await prisma.socialPostLog.create({
        data: {
          slot,
          platform: "META_ALL",
          imageUrl,
          caption,
          status: dryRun ? "SUCCESS" : "SKIPPED",
          facebookPostId: dryRun ? simulatedPostId : null,
          instagramMediaId: dryRun ? simulatedMediaId : null,
          error: config.isConfigured ? null : reason,
          candidateId: candidateId || null,
          triggeredBy,
        },
      });
    } catch (logErr) {
      console.error("[Social Poster Log Warning]:", logErr);
    }

    return {
      success: true,
      slot,
      imageUrl,
      caption,
      status: dryRun ? "SUCCESS" : "SKIPPED",
      dryRun: true,
      facebook: {
        success: dryRun,
        postId: dryRun ? simulatedPostId : undefined,
        error: dryRun ? undefined : "Meta credentials missing",
      },
      instagram: {
        success: dryRun,
        mediaId: dryRun ? simulatedMediaId : undefined,
        error: dryRun ? undefined : "Meta credentials missing",
      },
      logId: logRecord?.id,
      error: config.isConfigured ? undefined : reason,
    };
  }

  // LIVE META GRAPH API PUBLISH
  const results: SocialPostResult = {
    success: false,
    slot,
    imageUrl,
    caption,
    status: "FAILED",
    dryRun: false,
  };

  const tasks: Promise<any>[] = [];

  // Facebook Page
  if (config.hasFacebook) {
    tasks.push(
      postToFacebookPage(imageUrl, caption, config.facebookPageId, config.pageAccessToken)
        .then((res) => {
          results.facebook = res;
        })
    );
  } else {
    results.facebook = { success: false, error: "Facebook Page ID not configured" };
  }

  // Instagram Business
  if (config.hasInstagram) {
    tasks.push(
      postToInstagramBusiness(imageUrl, caption, config.instagramAccountId, config.igAccessToken)
        .then((res) => {
          results.instagram = res;
        })
    );
  } else {
    results.instagram = { success: false, error: "Instagram Business Account ID not configured" };
  }

  await Promise.allSettled(tasks);

  const fbOk = results.facebook?.success ?? false;
  const igOk = results.instagram?.success ?? false;
  results.success = fbOk || igOk;
  results.status = results.success ? "SUCCESS" : "FAILED";

  // Record to SocialPostLog in Prisma
  try {
    const logRecord = await prisma.socialPostLog.create({
      data: {
        slot,
        platform: fbOk && igOk ? "META_ALL" : fbOk ? "FACEBOOK" : igOk ? "INSTAGRAM" : "NONE",
        imageUrl,
        caption,
        status: results.status,
        facebookPostId: results.facebook?.postId || null,
        instagramMediaId: results.instagram?.mediaId || null,
        error: [results.facebook?.error, results.instagram?.error].filter(Boolean).join(" | ") || null,
        candidateId: candidateId || null,
        triggeredBy,
      },
    });
    results.logId = logRecord.id;
  } catch (logErr) {
    console.error("[Social Poster Log Warning]:", logErr);
  }

  return results;
}
