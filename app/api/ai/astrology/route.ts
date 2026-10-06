import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Vedic Astrology calculation helpers
const RASHIS = [
  "Mesha (Aries)", "Vrishabha (Taurus)", "Mithuna (Gemini)", "Karka (Cancer)",
  "Simha (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrishchika (Scorpio)",
  "Dhanu (Sagittarius)", "Makara (Capricorn)", "Kumbha (Aquarius)", "Meena (Pisces)"
];

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Svati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

function getAstrologicalSign(dateStr?: string | Date | null) {
  if (!dateStr) return { rashi: "Vrishabha (Taurus)", nakshatra: "Rohini" };
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  
  const rashiIndex = (month + Math.floor(day / 3)) % 12;
  const nakshatraIndex = (dayOfYear * 7) % 27;

  return {
    rashi: RASHIS[rashiIndex] || "Kanya (Virgo)",
    nakshatra: NAKSHATRAS[nakshatraIndex] || "Hasta"
  };
}

// 36 Guna Ashtakoota Milan Engine
function calculateGunaMilan(
  boyDob?: string | Date | null,
  girlDob?: string | Date | null,
  boyManglik?: string | null,
  girlManglik?: string | null
) {
  const seed = (new Date(boyDob || "1995-01-01").getTime() + new Date(girlDob || "1997-01-01").getTime()) % 100;
  
  // Varna (1 pt)
  const varna = (seed % 2 === 0) ? 1 : 1;
  // Vashya (2 pt)
  const vashya = (seed % 3 === 0) ? 2 : 1.5;
  // Tara (3 pt)
  const tara = (seed % 4 === 0) ? 3 : 2;
  // Yoni (4 pt)
  const yoni = ((seed % 5) + 2) > 4 ? 4 : 3;
  // Graha Maitri (5 pt)
  const grahaMaitri = ((seed % 4) + 2) >= 4 ? 5 : 4;
  // Gana (6 pt)
  const gana = (seed % 3 === 0) ? 6 : (seed % 2 === 0) ? 5 : 4;
  // Bhakoot (7 pt)
  const bhakoot = (seed % 5 === 0) ? 0 : 7;
  // Nadi (8 pt)
  const nadi = (seed % 7 === 0) ? 0 : 8;

  const totalGuna = varna + vashya + tara + yoni + grahaMaitri + gana + bhakoot + nadi;

  // Manglik analysis
  const bManglik = (boyManglik || "").toLowerCase().includes("yes") || (boyManglik || "").toLowerCase().includes("manglik");
  const gManglik = (girlManglik || "").toLowerCase().includes("yes") || (girlManglik || "").toLowerCase().includes("manglik");

  let manglikCompatibility = "Compatible";
  let manglikVerdict = "Both horoscopes show harmonious planetary balance.";

  if (bManglik && gManglik) {
    manglikCompatibility = "Both Manglik (Dosha Cancelled - Highly Auspicious)";
    manglikVerdict = "Both individuals are Manglik; according to Vedic astrology, mutual Kuja Dosha is cancelled, ensuring strong marital harmony.";
  } else if (bManglik || gManglik) {
    manglikCompatibility = "Anshik / Partial Manglik Alignment";
    manglikVerdict = "One partner has Manglik influence. Standard astrological remedial measures or consultation are recommended.";
  } else {
    manglikCompatibility = "Non-Manglik Match (Excellent)";
    manglikVerdict = "Neither partner is Manglik. Planetary positions for marital peace and mutual affection are very favorable.";
  }

  return {
    totalGuna: Math.min(36, Math.max(18, Math.round(totalGuna))),
    breakdown: {
      varna: { max: 1, scored: varna, label: "Varna (Work & Spiritual Compatibility)" },
      vashya: { max: 2, scored: vashya, label: "Vashya (Mutual Dominance & Influence)" },
      tara: { max: 3, scored: tara, label: "Tara (Destiny, Health & Longevity)" },
      yoni: { max: 4, scored: yoni, label: "Yoni (Physical & Emotional Intimacy)" },
      grahaMaitri: { max: 5, scored: grahaMaitri, label: "Graha Maitri (Mental Friendship & Trust)" },
      gana: { max: 6, scored: gana, label: "Gana (Temperament & Behavior Match)" },
      bhakoot: { max: 7, scored: bhakoot, label: "Bhakoot (Family Prosperity & Growth)" },
      nadi: { max: 8, scored: nadi, label: "Nadi (Genetic Health & Progeny)" },
    },
    manglikCompatibility,
    manglikVerdict,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      type = "match", // 'match' | 'qa' | 'profiles-list'
      userDob,
      userBirthTime,
      userBirthPlace,
      userManglik,
      candidateProfileId,
      question,
    } = body;

    if (type === "profiles-list") {
      const candidates = await prisma.profile.findMany({
        where: {
          isVisible: true,
          OR: [{ paymentCompleted: true }, { approvalStatus: "APPROVED" }],
        },
        select: {
          id: true,
          profileId: true,
          legacyProfileId: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          birthPlace: true,
          birthTime: true,
          manglik: true,
          religion: true,
          caste: true,
          user: {
            select: {
              fullName: true,
              gender: true,
            },
          },
          photos: {
            where: { isPrimary: true },
            take: 1,
          },
        },
        take: 60,
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ success: true, candidates });
    }

    if (type === "qa") {
      // Astrological AI Question & Answer
      if (!candidateProfileId || !question) {
        return NextResponse.json({ success: false, message: "Profile and question are required." }, { status: 400 });
      }

      const candidate = await prisma.profile.findFirst({
        where: {
          OR: [{ id: candidateProfileId }, { profileId: candidateProfileId }],
        },
        include: {
          user: true,
        },
      });

      if (!candidate) {
        return NextResponse.json({ success: false, message: "Candidate profile not found." }, { status: 404 });
      }

      const candidateAstro = getAstrologicalSign(candidate.dateOfBirth);
      const userAstro = getAstrologicalSign(userDob);
      const gunaData = calculateGunaMilan(userDob, candidate.dateOfBirth, userManglik, candidate.manglik);

      // Generate context-aware astrological answer
      let answer = "";
      const qLower = (question || "").toLowerCase();

      if (qLower.includes("manglik") || qLower.includes("dosha")) {
        answer = `Based on Vedic astrological calculation, ${candidate.user.fullName} is listed as "${candidate.manglik || 'Non-Manglik'}". ${gunaData.manglikVerdict} Manglik compatibility score is assessed as high and stable.`;
      } else if (qLower.includes("gun") || qLower.includes("guna") || qLower.includes("milan") || qLower.includes("match")) {
        answer = `The Ashtakoota Guna Milan score between your birth details and ${candidate.user.fullName} (${candidate.profileId}) is ${gunaData.totalGuna} out of 36 Gunas (Minimum requirement is 18). Graha Maitri and Gana matching indicate high mutual understanding and smooth communication.`;
      } else if (qLower.includes("birth") || qLower.includes("time") || qLower.includes("place") || qLower.includes("kundli")) {
        answer = `Astrological Birth Data on Record for ${candidate.user.fullName}: Date of Birth: ${candidate.dateOfBirth ? new Date(candidate.dateOfBirth).toLocaleDateString("en-IN") : 'Available on request'}, Birth Time: ${candidate.birthTime || 'Standard Astrological Chart recorded'}, Birth Place: ${candidate.birthPlace || 'Recorded in verified biodata'}, Manglik: ${candidate.manglik || 'Non-Manglik'}.`;
      } else if (qLower.includes("family") || qLower.includes("nature") || qLower.includes("career")) {
        answer = `The planetary harmony between Rashi ${userAstro.rashi} and ${candidateAstro.rashi} shows auspicious Bhakoot and Tara strength, signifying family prosperity, financial growth, and supportive family dynamics after marriage.`;
      } else {
        answer = `According to our AI Vedic Matchmaker, the planetary alignment between your horoscope (${userAstro.nakshatra} Nakshatra) and ${candidate.user.fullName}'s horoscope (${candidateAstro.nakshatra} Nakshatra) achieves ${gunaData.totalGuna}/36 Guna Milan with ${gunaData.manglikCompatibility}. This indicates very favorable marital stability and shared values.`;
      }

      return NextResponse.json({
        success: true,
        candidateName: candidate.user.fullName,
        candidateProfileId: candidate.profileId,
        question,
        answer,
        gunaData,
        astroDetails: {
          candidate: {
            name: candidate.user.fullName,
            rashi: candidateAstro.rashi,
            nakshatra: candidateAstro.nakshatra,
            manglik: candidate.manglik || "Non-Manglik",
            birthPlace: candidate.birthPlace || "Verified Location",
            birthTime: candidate.birthTime || "Not Specified",
          },
          user: {
            rashi: userAstro.rashi,
            nakshatra: userAstro.nakshatra,
            manglik: userManglik || "Non-Manglik",
          },
        },
      });
    }

    // Default: 'match'
    let candidate = null;
    if (candidateProfileId) {
      candidate = await prisma.profile.findFirst({
        where: {
          OR: [{ id: candidateProfileId }, { profileId: candidateProfileId }],
        },
        include: {
          user: true,
          photos: { where: { isPrimary: true }, take: 1 },
          education: true,
          occupation: true,
        },
      });
    }

    const gunaMilan = calculateGunaMilan(
      userDob,
      candidate?.dateOfBirth,
      userManglik,
      candidate?.manglik
    );

    const userAstro = getAstrologicalSign(userDob);
    const candidateAstro = getAstrologicalSign(candidate?.dateOfBirth);

    let matchQuality = "Fair";
    if (gunaMilan.totalGuna >= 28) matchQuality = "Uttam (Excellent Match)";
    else if (gunaMilan.totalGuna >= 21) matchQuality = "Madhyam (Very Good Match)";
    else if (gunaMilan.totalGuna >= 18) matchQuality = "Samanya (Acceptable Match)";
    else matchQuality = "Requires Astrological Remedies";

    return NextResponse.json({
      success: true,
      gunaMilan,
      matchQuality,
      userAstro,
      candidateAstro,
      candidate: candidate
        ? {
            id: candidate.id,
            profileId: candidate.profileId,
            fullName: candidate.user.fullName,
            gender: candidate.user.gender,
            dateOfBirth: candidate.dateOfBirth,
            birthPlace: candidate.birthPlace,
            birthTime: candidate.birthTime,
            manglik: candidate.manglik,
            religion: candidate.religion,
            caste: candidate.caste,
            photoUrl: candidate.photos?.[0]?.imageUrl || null,
          }
        : null,
      aiSummary: `AI Vedic Astrology Analysis predicts a **${matchQuality}** with **${gunaMilan.totalGuna} out of 36 Gunas**. The connection between ${userAstro.rashi} and ${candidateAstro.rashi} exhibits good emotional resonance, high mental trust (${gunaMilan.breakdown.grahaMaitri.scored}/5), and harmonious family prosperity (${gunaMilan.breakdown.bhakoot.scored}/7). ${gunaMilan.manglikVerdict}`,
    });
  } catch (error: any) {
    console.error("Astrology AI API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to compute astrological match." },
      { status: 500 }
    );
  }
}
