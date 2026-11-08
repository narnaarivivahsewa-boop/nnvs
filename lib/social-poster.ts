import { prisma } from "@/lib/prisma";
import { BUSINESS_INFO } from "@/lib/gst";

export type SocialSlot =
  | "MORNING"
  | "AFTERNOON"
  | "EVENING"
  | "MANUAL"
  | "KUNDLI_MILAN"
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
    process.env.META_IG_ACCESS_TOKEN ||
    process.env.META_ACCESS_TOKEN ||
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN ||
    "";

  const facebookPageId =
    process.env.META_FB_PAGE_ID ||
    process.env.META_PAGE_ID ||
    process.env.FACEBOOK_PAGE_ID ||
    "122125395483335905";

  const instagramAccountId =
    process.env.META_IG_ACCOUNT_ID ||
    process.env.INSTAGRAM_ACCOUNT_ID ||
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ||
    "";

  const cronSecret = process.env.CRON_SECRET || "";

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

  // Post 1: Free Kundali Milan Promotion (Morning Slot)
  if (slot === "MORNING" || slot === "KUNDLI_MILAN") {
    return (
      `✨ 100% Free AI Kundali Milan & 36 Guna Match Report ✨\n` +
      `Platform: RishteClub Matrimony (Powered by NNVS)\n\n` +
      `विवाह से पहले वर-वधू की कुंडली का सटीक अष्टकूट मिलान (वर्ण, वश्य, तारा, योनि, ग्रह मैत्री, गण, भकूट, नाड़ी) अब बिल्कुल निःशुल्क।\n\n` +
      `⭐ Key Highlights:\n` +
      `• 36 Guna Ashtakoot Score & Detailed Hindi Interpretation\n` +
      `• Manglik Dosha Analysis & Classical Vedic Remedies\n` +
      `• No App Download Required — Instant Mobile Verification\n` +
      `• Free Downloadable Vedic Horoscope Compatibility Certificate (PDF)\n\n` +
      `👉 Check Your Kundali Milan Instantly:\n` +
      `🌐 ${website}/kundli-milan\n\n` +
      `📞 Matchmaking & Astrological Helpline:\n` +
      `• WhatsApp / Call: ${helpline1}\n` +
      `• Calling: ${helpline2}\n\n` +
      `#KundaliMilan #FreeKundali #GunMilan #VedicAstrology #36Guna #ManglikDosha #RishteClub #HoroscopeMatching #HinduMatrimony #Shaadi #IndianWedding`
    );
  }

  // Post 2: Matrimony Registration Awareness (Afternoon Slot)
  if (slot === "AFTERNOON" || slot === "REGISTRATION") {
    const c = data?.candidateData;
    if (c) {
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
        `💍 Lifetime Membership Registration:\n` +
        `👧 Kanya (Bride): ₹471 Lifetime\n` +
        `👦 Var (Groom): ₹943 Lifetime\n` +
        `🚫 No recurring monthly fees. Direct family contact.\n\n` +
        `📞 Contact Matchmaker Helpline:\n` +
        `• WhatsApp: ${helpline1}\n` +
        `• Calling: ${helpline2}\n\n` +
        `🌐 View Profiles & Register: ${website}/register\n\n` +
        `#RishteClub #MatrimonialProfile #GroomBiodata #BrideBiodata #HinduMatrimony #DelhiNCRMatrimony #HaryanaVivah #Shaadi #Rishtey`
      );
    }

    return (
      `💍 अपनों के लिए सही रिश्ता — RishteClub Matrimony 💍\n` +
      `Managed by NNVS Matrimony (Registered Matrimonial Service)\n\n` +
      `पारिवारिक प्रतिष्ठा, सुरक्षा और शुद्ध भारतीय संस्कारों के साथ अपने बच्चों के लिए योग्य जीवनसाथी खोजें।\n\n` +
      `✨ Transparent Lifetime Membership:\n` +
      `👧 Kanya (Bride) Lifetime Registration: ₹471\n` +
      `👦 Var (Groom) Lifetime Registration: ₹943\n` +
      `🚫 No monthly recurring fees. No middlemen or agent commissions.\n\n` +
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

  // Post 3: Matchmaking / Astrological Relationship Tips (Evening Slot)
  return (
    `🌿 सुखद दांपत्य जीवन के वैदिक नियम एवं ज्योतिषीय सूत्र 🌿\n` +
    `RishteClub Matrimony • Daily Relationship & Horoscope Wisdom\n\n` +
    `"सच्चा वैवाहिक जीवन केवल ग्रहों की अनुकूलता से नहीं, बल्कि परस्पर सम्मान, धैर्य और एक-दूसरे के विचारों के आदर से सफल होता है।"\n\n` +
    `⭐ Astrological Compatibility Tips:\n` +
    `1. नाड़ी और भकूट दोष से भयभीत न हों — शास्त्रीय नियमों में नक्षत्र और चरण भेद से स्वाभाविक परिहार (Cancellation) उपलब्ध होता है।\n` +
    `2. ग्रह मैत्री और गण मिलान वैचारिक व मानसिक तालमेल का संकेत देते हैं।\n` +
    `3. दैनिक जीवन में कुलदेवता की आराधना और बुजुर्गों का आशीर्वाद सभी ग्रहों को शांत रखता है।\n\n` +
    `🔮 Free AI Kundli Milan & 36 Guna Check:\n` +
    `🌐 ${website}/kundli-milan\n\n` +
    `📞 Astrological Guidance Helpline:\n` +
    `• WhatsApp / Call: ${helpline1} | ${helpline2}\n\n` +
    `#AstrologyTips #KundaliMilan #VedicWisdom #RelationshipGoals #MarriageAdvice #LalKitab #RishteClub #FamilyValues #ShaadiKeNuskhe #HinduWedding`
  );
}

/**
 * Publish photo post to Facebook Page via Meta Graph API v21.0
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
}): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const config = getMetaConfig();
    let fbPageId = pageId || config.facebookPageId || process.env.META_FB_PAGE_ID || "1103030792895654";
    let fbToken = accessToken || config.pageAccessToken || process.env.META_PAGE_ACCESS_TOKEN || "";

    if (!fbPageId || !fbToken) {
      return {
        success: false,
        error: "Missing Facebook Page ID (META_FB_PAGE_ID) or Page Access Token (META_PAGE_ACCESS_TOKEN)",
      };
    }

    let url = `https://graph.facebook.com/v21.0/${fbPageId}/photos`;
    let res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: imageUrl,
        message: caption,
        caption: caption,
        access_token: fbToken,
      }),
    });

    let data = await res.json();

    // If initial attempt fails (e.g. user token passed or page ID mismatch), resolve via /me/accounts
    if (!res.ok || data.error) {
      console.warn("[Meta API] Direct Facebook Page Post notice:", data.error?.message);
      try {
        const accRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${fbToken}`);
        const accData = await accRes.json();
        if (accData?.data?.length > 0) {
          const matchedPage = accData.data.find((p: any) => p.id === fbPageId) || accData.data[0];
          fbPageId = matchedPage.id;
          fbToken = matchedPage.access_token;
          console.log(`[Meta API] Resolved Page: ${matchedPage.name} (ID: ${fbPageId})`);

          url = `https://graph.facebook.com/v21.0/${fbPageId}/photos`;
          res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: imageUrl,
              message: caption,
              caption: caption,
              access_token: fbToken,
            }),
          });
          data = await res.json();
        }
      } catch (resolveErr) {
        console.error("[Meta API] Page resolution error:", resolveErr);
      }
    }

    if (!res.ok || data.error) {
      const errMsg = data.error?.message || `Facebook API returned HTTP ${res.status}`;
      console.error("[Meta API] Facebook Page Post Failed:", data.error || data);
      return { success: false, error: errMsg };
    }

    const postId = data.post_id || data.id;
    return { success: true, postId };
  } catch (err: any) {
    console.error("[Meta API] Facebook Page Error:", err);
    return { success: false, error: err.message || "Failed to post to Facebook Page" };
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

    // Step 2: Safety delay (approx 4-5 seconds) for Instagram to fetch and process media
    await new Promise((resolve) => setTimeout(resolve, 4500));

    // Optional status verification loop
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const statusRes = await fetch(
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
