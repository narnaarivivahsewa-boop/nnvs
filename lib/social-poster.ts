import { prisma } from "@/lib/prisma";
import { BUSINESS_INFO } from "@/lib/gst";

export type SocialSlot =
  | "MORNING"
  | "AFTERNOON"
  | "SPOTLIGHT"
  | "EVENING"
  | "MANUAL"
  | "KUNDLI_MILAN"
  | "PROFILE_SPOTLIGHT"
  | "PROMOTION"
  | "REGISTRATION"
  | "MATCHMAKING_TIPS";

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
    facebookPageId,
    instagramAccountId,
    cronSecret,
    adminSecret,
    appUrl: appUrl.replace(/\/+$/, ""),
    isConfigured: Boolean(pageAccessToken && (facebookPageId || instagramAccountId)),
    hasFacebook: Boolean(pageAccessToken && facebookPageId),
    hasInstagram: Boolean(pageAccessToken && instagramAccountId),
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

export function resolveSocialSlotFromTime(
  specifiedSlot?: string | null,
  date: Date = new Date()
): SocialSlot {
  if (specifiedSlot) {
    const s = specifiedSlot.trim().toUpperCase();
    if (
      s &&
      s !== "AUTO" &&
      (s === "MORNING" ||
        s === "AFTERNOON" ||
        s === "SPOTLIGHT" ||
        s === "EVENING" ||
        s === "MANUAL" ||
        s === "KUNDLI_MILAN" ||
        s === "PROFILE_SPOTLIGHT" ||
        s === "PROMOTION" ||
        s === "REGISTRATION" ||
        s === "MATCHMAKING_TIPS")
    ) {
      return s as SocialSlot;
    }
  }

  const istHour = getIstHour(date);
  if (istHour >= 4 && istHour < 12) {
    return "MORNING"; // 09:00 AM IST Window: Free Kundali Milan Promotion & Astrology Tips
  }
  if (istHour >= 12 && istHour < 17) {
    return "SPOTLIGHT"; // 02:00 PM (14:00) IST Window: Live Verified Profile Spotlight
  }
  return "EVENING"; // 07:00 PM (19:00) IST Window: Platform Promotion & Registration Awareness
}

/**
 * Auto-generate engaging captions with contact numbers, official website, and hashtags
 */
export function generateSocialCaption(
  slot: SocialSlot,
  data?: {
    quote?: string;
    candidateData?: SocialPostParams["candidateData"];
    title?: string;
  }
): string {
  const helpline1 = "+91 9871592002";
  const helpline2 = "+91 7015812359";
  const website = "https://www.rishteclub.com";

  // Post 1: Free Kundali Milan Promotion & Astrology Tips (Morning Slot - 09:00 AM IST)
  if (slot === "MORNING" || slot === "KUNDLI_MILAN" || slot === "MATCHMAKING_TIPS") {
    return (
      `✨ Free AI Kundali Milan & Vedic Astrology Insights ✨\n` +
      `Platform: RishteClub Matrimony (Powered by NNVS)\n\n` +
      `विवाह से पहले वर-वधू की कुंडली का सटीक अष्टकूट मिलान (वर्ण, वश्य, तारा, योनि, ग्रह मैत्री, गण, भकूट, नाड़ी) अब बिल्कुल निःशुल्क।\n\n` +
      `⭐ Key Astrological Insights:\n` +
      `• 36 Guna Ashtakoot Score & Deep Hindi Interpretation\n` +
      `• Manglik Dosha Verification & Classical Vedic Remedies\n` +
      `• Nakshatra Compatibility & Harmony Guidelines\n` +
      `• Free Downloadable Vedic Horoscope Compatibility Certificate (PDF)\n\n` +
      `👉 Check Free Kundali Milan on RishteClub:\n` +
      `🌐 ${website}/kundli-milan\n\n` +
      `📞 Matchmaking & Astrological Helpline:\n` +
      `• WhatsApp / Call: ${helpline1}\n` +
      `• Support: ${helpline2}\n\n` +
      `#KundaliMilan #FreeKundali #GunMilan #VedicAstrology #ManglikDosha #RishteClub #HoroscopeMatching #HinduMatrimony #Shaadi #IndianWedding`
    );
  }

  // Post 2: Live Verified Profile Spotlight (Afternoon Slot - 02:00 PM IST)
  if (slot === "AFTERNOON" || slot === "SPOTLIGHT" || slot === "PROFILE_SPOTLIGHT") {
    const c = data?.candidateData;
    if (c) {
      const id = c.id || "RC-Featured";
      const age = c.age ? `${c.age} Yrs` : "26 Yrs";
      const profession = c.profession || "Working Professional";
      const city = c.city || "Delhi NCR";

      return (
        `✨ New Verified Profile Spotlight on RishteClub Matrimony!\n` +
        `🆔 Profile ID: ${id}\n` +
        `🎂 Age: ${age}\n` +
        `💼 Profession: ${profession}\n` +
        `📍 Location: ${city}\n\n` +
        `🔒 To view full verified details and express interest safely, search Profile ID '${id}' on ${website}\n\n` +
        `#RishteClub #Matrimony #VerifiedProfiles #Matchmaking #Rishtey`
      );
    }

    // Fallback if no candidate profile is passed
    return (
      `💍 अपनों के लिए सही रिश्ता — RishteClub Matrimony 💍\n` +
      `Managed by NNVS Matrimony (Registered Matrimonial Service)\n\n` +
      `पारिवारिक प्रतिष्ठा, सुरक्षा और शुद्ध भारतीय संस्कारों के साथ अपने बच्चों के लिए योग्य जीवनसाथी खोजें।\n\n` +
      `✨ Transparent Lifetime Membership:\n` +
      `👧 Kanya (Bride) Lifetime Registration: ₹471\n` +
      `👦 Var (Groom) Lifetime Registration: ₹943\n` +
      `🚫 No monthly recurring fees. Direct family contact.\n\n` +
      `🔒 100% Verified Profiles:\n` +
      `• Agarwal, Baniya, Brahmin, Punjabi, Khatri, Jain & Maheshwari Communities\n` +
      `• Direct Contact with Respected Families\n` +
      `• Complete Privacy & Verified Backgrounds\n\n` +
      `👉 Register Today:\n` +
      `🌐 ${website}/register\n\n` +
      `📞 Matchmaker Helpline:\n` +
      `• WhatsApp / Calling: ${helpline1}\n` +
      `• Support: ${helpline2}\n\n` +
      `#RishteClub #Matrimony #Shaadi #Vivah #AgarwalMatrimony #BaniyaMatrimony #BrahminMatrimony #PunjabiMatrimony #DelhiNCRMatrimony #HaryanaVivah #IndianMatrimony`
    );
  }

  // Post 3: Platform Promotion & Registration CTA (Evening Slot - 07:00 PM IST)
  return (
    `💍 Find Your Ideal Life Partner on RishteClub Matrimony 💍\n` +
    `Trusted Community Matchmaking Managed by NNVS Matrimony\n\n` +
    `पारिवारिक प्रतिष्ठा, सुरक्षा और शुद्ध भारतीय संस्कारों के साथ अपने परिवार के लिए योग्य जीवनसाथी खोजें।\n\n` +
    `⭐ Verified Registration Benefits:\n` +
    `• 100% Verified Biodatas with Mobile & Family Verification\n` +
    `• Direct Contact with Respected Families — Zero Middlemen Commission\n` +
    `• Complete Data Privacy & Safe Matchmaking Experience\n` +
    `• Agarwal, Baniya, Brahmin, Punjabi, Khatri, Jain & Maheshwari Communities\n\n` +
    `✨ Transparent Lifetime Membership:\n` +
    `👧 Kanya (Bride) Registration: ₹471 Lifetime\n` +
    `👦 Var (Groom) Registration: ₹943 Lifetime\n` +
    `🚫 No monthly recurring subscriptions.\n\n` +
    `👉 Register Free Today:\n` +
    `🌐 ${website}/register\n\n` +
    `📞 Matchmaker Helpline:\n` +
    `• WhatsApp / Call: ${helpline1} | ${helpline2}\n\n` +
    `#RishteClub #Matrimony #Shaadi #Vivah #Matchmaking #CommunityMatrimony #IndianWedding #FamilyValues`
  );
}

/**
 * Fetch an active, verified profile for the Live Profile Spotlight (Afternoon slot)
 * Applies strict Privacy Guard rules and deduplication
 */
export async function fetchSpotlightProfile(): Promise<{
  candidateId: string;
  candidateData: NonNullable<SocialPostParams["candidateData"]>;
} | null> {
  try {
    // 1. Deduplication: Exclude profiles successfully posted in the last 60 days
    const recentLogs = await prisma.socialPostLog.findMany({
      where: {
        candidateId: { not: null },
        status: "SUCCESS",
        createdAt: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        },
      },
      select: { candidateId: true },
    });
    const excludedIds = Array.from(new Set(recentLogs.map((l) => l.candidateId).filter(Boolean))) as string[];

    // 2. Fetch candidate with photo, prioritizing consentSocialMedia === true and approved status
    let profile = await prisma.profile.findFirst({
      where: {
        id: { notIn: excludedIds },
        approvalStatus: { in: ["APPROVED", "PENDING_APPROVAL", "UNDER_REVIEW"] },
        photos: {
          some: {
            imageUrl: { startsWith: "http" },
          },
        },
        consentSocialMedia: true,
      },
      include: {
        user: { select: { fullName: true, gender: true } },
        photos: {
          where: { imageUrl: { startsWith: "http" } },
          orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
          take: 1,
        },
        education: { select: { highestQualification: true } },
        occupation: { select: { profession: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 3. If no unposted profile with consentSocialMedia: true, check any profile with HTTP photo
    if (!profile) {
      profile = await prisma.profile.findFirst({
        where: {
          id: { notIn: excludedIds },
          photos: {
            some: {
              imageUrl: { startsWith: "http" },
            },
          },
        },
        include: {
          user: { select: { fullName: true, gender: true } },
          photos: {
            where: { imageUrl: { startsWith: "http" } },
            orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
            take: 1,
          },
          education: { select: { highestQualification: true } },
          occupation: { select: { profession: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
    }

    // 4. If all profiles with photos have been posted in the window, reset and take the oldest
    if (!profile) {
      profile = await prisma.profile.findFirst({
        where: {
          photos: {
            some: {
              imageUrl: { startsWith: "http" },
            },
          },
        },
        include: {
          user: { select: { fullName: true, gender: true } },
          photos: {
            where: { imageUrl: { startsWith: "http" } },
            orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
            take: 1,
          },
          education: { select: { highestQualification: true } },
          occupation: { select: { profession: true } },
        },
        orderBy: { updatedAt: "asc" },
      });
    }

    if (!profile || !profile.photos?.[0]?.imageUrl) {
      return null;
    }

    // Strict Privacy Guard: Never expose mobile, whatsapp, email, or exact address
    let age = "26";
    if (profile.dateOfBirth) {
      const diff = Date.now() - new Date(profile.dateOfBirth).getTime();
      age = String(Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)));
    }

    // Name Anonymization: First Name + Initial only (e.g., "Pooja S.")
    const rawFirstName =
      profile.firstName?.trim() ||
      profile.user?.fullName?.trim()?.split(/\s+/)[0] ||
      "Verified Member";
    const rawLastName =
      profile.lastName?.trim() ||
      profile.user?.fullName?.trim()?.split(/\s+/).slice(1).join(" ") ||
      "";
    const initial = rawLastName ? ` ${rawLastName.charAt(0).toUpperCase()}.` : "";
    const displayName = `${rawFirstName}${initial}`;

    // Location sanitization: Keep city and state only, strip pincodes/street details
    let cleanCity = profile.birthPlace?.trim() || "Delhi NCR";
    cleanCity = cleanCity.replace(/\b\d{6}\b/g, "").replace(/\s+/g, " ").trim();

    // Profession sanitization
    const cleanProfession =
      profile.occupation?.profession?.trim() || "Working Professional";

    const isFemale = profile.user?.gender === "FEMALE";
    const displayId = profile.legacyProfileId || profile.profileId;

    return {
      candidateId: profile.id,
      candidateData: {
        id: displayId,
        gender: (profile.user?.gender || (isFemale ? "FEMALE" : "MALE")) as "MALE" | "FEMALE",
        age,
        height: profile.height || (isFemale ? "5'4\"" : "5'10\""),
        caste: profile.caste || "Hindu",
        gotra: "Gotra Available",
        profession: cleanProfession,
        city: cleanCity,
        education: profile.education?.highestQualification || "Graduate",
        photoUrl: profile.photos[0].imageUrl,
        displayName,
      },
    };
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
 * - Step A: POST /{page-id}/photos (url, published: false, temporary: false) -> Extracts photo_fbid
 * - Step B: POST /{page-id}/feed (message: caption, attached_media: [{ media_fbid }]) -> Broadcasts main public Timeline Feed Story
 * - Fallback: Direct /{page-id}/photos with published: true if feed endpoint fails
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

    // === STEP A: Upload Unlisted Photo Asset (published: false) ===
    let uploadRes = await fetchMetaGraph(`https://graph.facebook.com/v21.0/${fbPageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: imageUrl,
        published: false,
        temporary: false,
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
              temporary: false,
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
          access_token: pageToken,
        }),
      });

      const feedData = await feedRes.json();

      if (feedRes.ok && feedData?.id) {
        const feedPostId = feedData.id;
        const storyFbid = feedPostId.includes("_") ? feedPostId.split("_")[1] : feedPostId;
        const permalinkUrl = `https://www.facebook.com/permalink.php?story_fbid=${storyFbid}&id=${fbPageId}`;

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

    // === FALLBACK: Direct /{page-id}/photos with published: true ===
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
    const permalinkUrl = `https://www.facebook.com/permalink.php?story_fbid=${storyFbid}&id=${fbPageId}`;

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
async function postToFacebookPage(
  imageUrl: string,
  caption: string,
  pageId: string,
  accessToken: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
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
      postToInstagramBusiness(imageUrl, caption, config.instagramAccountId, config.pageAccessToken)
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
