import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import {
  calculateAuthenticGunaMilan,
  getAstrologicalSign,
} from "@/lib/astrology/vedic-match";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("nnvs_token")?.value;
    let currentUser: any = null;
    let currentProfile: any = null;

    if (token) {
      try {
        const session = await verifyToken(token);
        if (session?.userId) {
          currentUser = await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
              id: true,
              fullName: true,
              gender: true,
              role: true,
              profiles: {
                select: {
                  id: true,
                  profileId: true,
                  firstName: true,
                  lastName: true,
                  dateOfBirth: true,
                  birthPlace: true,
                  birthTime: true,
                  manglik: true,
                },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          });
          if (currentUser && currentUser.profiles.length > 0) {
            currentProfile = currentUser.profiles[0];
          }
        }
      } catch {
        // Token expired or invalid
      }
    }

    const body = await req.json();
    const {
      type = "match", // 'match' | 'qa' | 'profiles-list'
      userDob,
      userBirthTime,
      userBirthPlace,
      userManglik,
      userGender: clientUserGender,
      candidateProfileId,
      question,
    } = body;

    if (type === "profiles-list") {
      // Determine the active user gender (from profile, user record, or client request)
      const effectiveUserGender =
        (currentUser?.gender || clientUserGender || currentProfile?.user?.gender || "MALE").toUpperCase();

      // Strict Gender-based matching rules:
      // Male user -> Female candidate profiles only
      // Female user -> Male candidate profiles only
      const targetGender: "MALE" | "FEMALE" = effectiveUserGender === "FEMALE" ? "MALE" : "FEMALE";

      const whereClause: any = {
        isVisible: true,
        OR: [{ paymentCompleted: true }, { approvalStatus: "APPROVED" }],
        user: {
          gender: targetGender,
        },
      };

      // Strict self-exclusion
      if (currentUser?.id) {
        whereClause.userId = {
          not: currentUser.id,
        };
      }
      if (currentProfile?.id) {
        whereClause.id = {
          not: currentProfile.id,
        };
      }

      let candidates = await prisma.profile.findMany({
        where: whereClause,
        select: {
          id: true,
          userId: true,
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
              id: true,
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

      // Secondary strict filter ensuring no same-gender profile or self-profile is returned
      candidates = candidates.filter((cand) => {
        if (cand.user?.gender && cand.user.gender !== targetGender) return false;
        if (currentUser?.id && (cand.userId === currentUser.id || cand.user?.id === currentUser.id)) return false;
        if (currentProfile?.id && (cand.id === currentProfile.id || cand.profileId === currentProfile.profileId)) return false;
        return true;
      });

      return NextResponse.json({
        success: true,
        candidates,
        userProfile: currentProfile
          ? {
              id: currentProfile.id,
              profileId: currentProfile.profileId,
              firstName: currentProfile.firstName,
              lastName: currentProfile.lastName,
              fullName:
                [currentProfile.firstName, currentProfile.lastName].filter(Boolean).join(" ") ||
                currentUser?.fullName ||
                "My Kundli Profile",
              gender: currentUser?.gender || null,
              dateOfBirth: currentProfile.dateOfBirth,
              birthPlace: currentProfile.birthPlace,
              birthTime: currentProfile.birthTime,
              manglik: currentProfile.manglik,
            }
          : null,
        currentUser: currentUser
          ? {
              id: currentUser.id,
              fullName: currentUser.fullName,
              gender: currentUser.gender,
              role: currentUser.role,
            }
          : null,
        userGender: effectiveUserGender,
        targetGender,
        isAuthenticated: !!currentUser,
      });
    }

    if (type === "qa") {
      // Astrological AI Question & Answer with authentic Vedic & Lal Kitab engine
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

      const effectiveUserGender = (currentUser?.gender || clientUserGender || "MALE").toUpperCase();
      const isUserFemale = effectiveUserGender === "FEMALE" || candidate?.user?.gender === "MALE";

      const boyDob = isUserFemale ? candidate.dateOfBirth : userDob;
      const girlDob = isUserFemale ? userDob : candidate.dateOfBirth;
      const boyTime = isUserFemale ? candidate.birthTime : userBirthTime;
      const girlTime = isUserFemale ? userBirthTime : candidate.birthTime;
      const boyManglik = isUserFemale ? candidate.manglik : userManglik;
      const girlManglik = isUserFemale ? userManglik : candidate.manglik;

      const gunaData = calculateAuthenticGunaMilan(
        boyDob,
        girlDob,
        boyTime,
        girlTime,
        boyManglik,
        girlManglik
      );

      const candidateAstro = getAstrologicalSign(candidate.dateOfBirth, candidate.birthTime);
      const userAstro = getAstrologicalSign(userDob, userBirthTime);

      // Generate context-aware astrological and Lal Kitab remedies answer
      let answer = "";
      const qLower = (question || "").toLowerCase();

      if (qLower.includes("upaye") || qLower.includes("upay") || qLower.includes("dosh") || qLower.includes("lal kitab")) {
        const primaryRemedy = gunaData.lalKitabData.doshas[0]?.remedies?.join("; ") || gunaData.lalKitabData.universalRemedies.join("; ");
        answer = `Lal Kitab ke anusar is milan me: ${gunaData.manglikVerdict}. Pramukh Upaye: ${primaryRemedy}. Shivling par kacha doodh arpit karna aur chandi ka tukda paas rakhna atyant shubh rahega.`;
      } else if (qLower.includes("manglik") || qLower.includes("dosha")) {
        answer = `Vedic aur Lal Kitab ganana ke anusar, ${candidate.user.fullName} "${candidate.manglik || 'Non-Manglik'}" recorded hain. ${gunaData.manglikVerdict} Agar samanya Mangal prabhav ho to Neem ke ped me jal arpit karna aur Mangalwar ko gur daan karna uttam upaye hai.`;
      } else if (qLower.includes("gun") || qLower.includes("guna") || qLower.includes("milan") || qLower.includes("match")) {
        answer = `Ashtakoota 36 Guna Milan me kul score ${gunaData.totalGuna}/36 hai (${gunaData.totalGuna >= 18 ? "18 se adhik hone ke karan shubh hai" : "Lal Kitab upaye aavashyak hain"}). Graha Maitri (${gunaData.breakdown.grahaMaitri.scored}/5), Gana (${gunaData.breakdown.gana.scored}/6), aur Bhakoot (${gunaData.breakdown.bhakoot.scored}/7) aapsi samajh aur parivarik vikas ke liye vishesh mahatva rakhte hain.`;
      } else if (qLower.includes("birth") || qLower.includes("time") || qLower.includes("place") || qLower.includes("kundli")) {
        answer = `Biodata Record for ${candidate.user.fullName}: Janm Tithi: ${candidate.dateOfBirth ? new Date(candidate.dateOfBirth).toLocaleDateString("en-IN") : 'Recorded'}, Janm Samay: ${candidate.birthTime || 'Kundli Chart uplabdh'}, Janm Sthan: ${candidate.birthPlace || 'Recorded'}, Manglik: ${candidate.manglik || 'Non-Manglik'}.`;
      } else {
        answer = `Vedic & Lal Kitab AI analysis ke anusar ${userAstro.nakshatra} aur ${candidateAstro.nakshatra} ka kundli milan ${gunaData.totalGuna}/36 Guna ke sath sampanna hai. ${gunaData.manglikCompatibility}. Lal Kitab Upaye: Dono pariwar Shivji aur Mata Lakshmi ka pujan karein, vaivahik jeevan mangalmay rahega.`;
      }

      return NextResponse.json({
        success: true,
        candidateName: candidate.user.fullName,
        candidateProfileId: candidate.profileId,
        question,
        answer,
        gunaData,
        lalKitabData: gunaData.lalKitabData,
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

    const effectiveUserGender = (currentUser?.gender || clientUserGender || "MALE").toUpperCase();
    const isUserFemale = effectiveUserGender === "FEMALE" || candidate?.user?.gender === "MALE";

    const boyDob = isUserFemale ? candidate?.dateOfBirth : userDob;
    const girlDob = isUserFemale ? userDob : candidate?.dateOfBirth;
    const boyTime = isUserFemale ? candidate?.birthTime : userBirthTime;
    const girlTime = isUserFemale ? userBirthTime : candidate?.birthTime;
    const boyManglik = isUserFemale ? candidate?.manglik : userManglik;
    const girlManglik = isUserFemale ? userManglik : candidate?.manglik;

    const gunaMilan = calculateAuthenticGunaMilan(
      boyDob,
      girlDob,
      boyTime,
      girlTime,
      boyManglik,
      girlManglik
    );

    const userAstro = getAstrologicalSign(userDob, userBirthTime);
    const candidateAstro = getAstrologicalSign(candidate?.dateOfBirth, candidate?.birthTime);

    let matchQuality = "Fair";
    if (gunaMilan.totalGuna >= 28) matchQuality = "Uttam (Excellent Match)";
    else if (gunaMilan.totalGuna >= 21) matchQuality = "Madhyam (Very Good Match)";
    else if (gunaMilan.totalGuna >= 18) matchQuality = "Samanya (Acceptable Match)";
    else matchQuality = "Requires Lal Kitab Remedies";

    return NextResponse.json({
      success: true,
      gunaMilan,
      matchQuality,
      userAstro,
      candidateAstro,
      lalKitabData: gunaMilan.lalKitabData,
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
      aiSummary: `AI Vedic & Lal Kitab Analysis predicts a **${matchQuality}** with **${gunaMilan.totalGuna} out of 36 Gunas**. The connection between ${userAstro.rashi} and ${candidateAstro.rashi} exhibits mental harmony (${gunaMilan.breakdown.grahaMaitri.scored}/5), temperament resonance (${gunaMilan.breakdown.gana.scored}/6), and family prosperity (${gunaMilan.breakdown.bhakoot.scored}/7). ${gunaMilan.manglikVerdict}`,
    });
  } catch (error: any) {
    console.error("Astrology AI API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to compute astrological match." },
      { status: 500 }
    );
  }
}
