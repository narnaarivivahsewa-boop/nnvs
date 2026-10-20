import { prisma } from "@/lib/prisma";
import { BUSINESS_INFO } from "@/lib/gst";

export type SocialSlot = "MORNING" | "AFTERNOON" | "EVENING" | "MANUAL";

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
  };
  triggeredBy?: "CRON" | "ADMIN_TEST";
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
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN ||
    process.env.META_ACCESS_TOKEN ||
    "";

  const facebookPageId =
    process.env.META_PAGE_ID ||
    process.env.FACEBOOK_PAGE_ID ||
    "";

  const instagramAccountId =
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ||
    process.env.INSTAGRAM_ACCOUNT_ID ||
    "";

  const cronSecret = process.env.CRON_SECRET || "";

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://www.rishteclub.com"
      : "http://localhost:3000");

  return {
    pageAccessToken,
    facebookPageId,
    instagramAccountId,
    cronSecret,
    appUrl: appUrl.replace(/\/+$/, ""),
    isConfigured: Boolean(pageAccessToken && (facebookPageId || instagramAccountId)),
    hasFacebook: Boolean(pageAccessToken && facebookPageId),
    hasInstagram: Boolean(pageAccessToken && instagramAccountId),
  };
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

  if (slot === "MORNING") {
    return (
      `🙏 सुप्रभात • आज का पावन विचार • RishteClub Matrimony 🙏\n\n` +
      `"विवाह केवल दो व्यक्तियों का नहीं, बल्कि दो परिवारों और दो आत्माओं का पवित्र संगम है। जहाँ सम्मान और विश्वास हो, वही रिश्ता स्वर्ग बनता है।"\n\n` +
      `✨ अपनों के लिए सही रिश्ता — सरलता, गरिमा और विश्वास के साथ।\n\n` +
      `📞 WhatsApp / Call Helpline:\n` +
      `• ${helpline1}\n` +
      `• ${helpline2}\n\n` +
      `🌐 100% Verified Profiles: ${website}\n\n` +
      `#RishteClub #Suvichar #Matrimony #Shaadi #VivahSewa #GoodMorning #IndianWedding #HinduMatrimony #Rishtey #FamilyValues`
    );
  }

  if (slot === "AFTERNOON") {
    const c = data?.candidateData;
    const isFemale = c?.gender === "FEMALE";
    const title = isFemale ? "वधू (Verified Bride Candidate)" : "वर (Verified Groom Candidate)";
    const id = c?.id || "RC-Featured";
    const age = c?.age || "26";
    const height = c?.height || "5'5\"";
    const community = `${c?.caste || "Agarwal / Baniya"} (${c?.gotra || "Gotra Available"})`;
    const profession = c?.profession || "Working Professional / MNC";
    const city = c?.city || "Delhi NCR / Haryana";

    return (
      `✨ 100% VERIFIED CANDIDATE PROFILE HIGHLIGHT ✨\n` +
      `Platform: RishteClub Matrimony (Managed by NNVS Matrimony)\n\n` +
      `👤 Candidate: ${title} [ID: #${id}]\n` +
      `🎂 Age & Height: ${age} Yrs • ${height}\n` +
      `🏛️ Community & Gotra: ${community}\n` +
      `💼 Profession: ${profession}\n` +
      `📍 City / Location: ${city}\n\n` +
      `🔒 Privacy Note: Candidate profile is anonymized for privacy. Complete biodata with family background is available to verified members on RishteClub.\n\n` +
      `📞 Contact Our Matchmaker Helpline:\n` +
      `• WhatsApp: ${helpline1}\n` +
      `• Calling: ${helpline2}\n\n` +
      `🌐 View Profiles & Register: ${website}/profiles\n\n` +
      `#RishteClub #MatrimonialProfile #GroomBiodata #BrideBiodata #HinduMatrimony #DelhiNCRMatrimony #HaryanaVivah #Shaadi #Rishtey`
    );
  }

  // EVENING (Astrology)
  return (
    `✨ वैदिक ज्योतिष एवं कुंडली मिलान अंतर्दृष्टि ✨\n` +
    `RishteClub AI Kundli Milan & Vedic Insights\n\n` +
    `⭐ 36 Guna Ashtakoota Milan: विवाह से पूर्व दोनों कुंडलियों का अष्टकूट मिलान (वर्ण, वश्य, तारा, योनि, ग्रह मैत्री, गण, भकूट, नाड़ी) मानसिक, शारीरिक और पारिवारिक सामंजस्य का दर्पण है।\n\n` +
    `🌿 लाल किताब सरल समाधान: यदि नाड़ी या भकूट में मतभेद हो, तो भयभीत होने के बजाय शास्त्रीय नियमों और सरल लाल किताब उपायों से समाधान संभव है।\n\n` +
    `🔮 Free AI Kundli Milan: अपनी व अपने जीवनसाथी की जन्म तिथि डालकर तुरंत 36 गुण व मांगलिक विश्लेषण प्राप्त करें।\n\n` +
    `📞 Astrological Query Helpline:\n` +
    `• ${helpline1} | ${helpline2}\n\n` +
    `🌐 AI Kundli Milan Calculator: ${website}/astrology\n\n` +
    `#RishteClub #KundaliMilan #36Guna #VedicAstrology #ManglikDosha #HoroscopeMatching #LalKitab #IndianWedding #Shaadi`
  );
}

/**
 * Publish photo post to Facebook Page via Meta Graph API
 */
async function postToFacebookPage(
  imageUrl: string,
  caption: string,
  pageId: string,
  accessToken: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const url = `https://graph.facebook.com/v21.0/${pageId}/photos`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: imageUrl,
        caption: caption,
        access_token: accessToken,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      const errMsg = data.error?.message || `Facebook API returned HTTP ${res.status}`;
      console.error("[Meta API] Facebook Post Failed:", data.error || data);
      return { success: false, error: errMsg };
    }

    return { success: true, postId: data.post_id || data.id };
  } catch (err: any) {
    console.error("[Meta API] Facebook Error:", err);
    return { success: false, error: err.message || "Failed to post to Facebook Page" };
  }
}

/**
 * Publish photo post to Instagram Business Account via Meta Graph API Container
 */
async function postToInstagramBusiness(
  imageUrl: string,
  caption: string,
  igAccountId: string,
  accessToken: string
): Promise<{ success: boolean; mediaId?: string; error?: string }> {
  try {
    // Step 1: Create Instagram Media Container
    const containerUrl = `https://graph.facebook.com/v21.0/${igAccountId}/media`;
    const containerRes = await fetch(containerUrl, {
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
      const errMsg = containerData.error?.message || `Instagram Container creation failed (${containerRes.status})`;
      console.error("[Meta API] Instagram Container Failed:", containerData.error || containerData);
      return { success: false, error: errMsg };
    }

    const creationId = containerData.id;
    if (!creationId) {
      return { success: false, error: "No container ID returned from Instagram" };
    }

    // Short wait for container processing
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Step 2: Publish Media Container
    const publishUrl = `https://graph.facebook.com/v21.0/${igAccountId}/media_publish`;
    const publishRes = await fetch(publishUrl, {
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
      return { success: false, error: errMsg };
    }

    return { success: true, mediaId: publishData.id };
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
