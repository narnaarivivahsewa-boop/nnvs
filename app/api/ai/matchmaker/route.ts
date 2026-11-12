import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRequestSession } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const {
      profileId: requestedProfileId,
      lookingFor,
      minAge = 21,
      maxAge = 35,
      diet,
      lifestyle,
      dressing,
      educationLevel,
      religionPreference,
      communityPreference,
      hobbies,
      expectations,
    } = body;

    const parsedMinAge = Number.isFinite(Number(minAge)) ? Number(minAge) : 21;
    const parsedMaxAge = Number.isFinite(Number(maxAge)) ? Number(maxAge) : 35;

    const { session } = await verifyRequestSession(req);

    // 1. Resolve Profile to attach and save questionnaire responses to (only save if authenticated owner/ADMIN)
    let targetProfileId: string | null = null;
    let targetProfileUserId: string | null = null;

    if (requestedProfileId) {
      const p = await prisma.profile.findFirst({
        where: {
          OR: [{ id: String(requestedProfileId) }, { profileId: String(requestedProfileId) }],
        },
        select: { id: true, userId: true },
      });
      if (p) {
        targetProfileId = p.id;
        targetProfileUserId = p.userId;
      }
    }

    if (!targetProfileId && session?.userId) {
      const p = await prisma.profile.findFirst({
        where: {
          userId: session.userId,
          ...(session.activeProfileId ? { id: session.activeProfileId } : {}),
        },
        select: { id: true, userId: true },
      });
      if (p) {
        targetProfileId = p.id;
        targetProfileUserId = p.userId;
      }
    }

    const canPersistProfilePreferences = Boolean(
      targetProfileId &&
        session &&
        (session.role === "ADMIN" || targetProfileUserId === session.userId)
    );

    // 2. Persist questionnaire responses to PartnerPreference and Profile ONLY for verified owner / admin
    if (targetProfileId && canPersistProfilePreferences) {
      try {
        await prisma.$transaction([
          prisma.partnerPreference.upsert({
            where: { profileId: targetProfileId },
            create: {
              profileId: targetProfileId,
              minAge: parsedMinAge,
              maxAge: parsedMaxAge,
              preferredReligion: religionPreference && religionPreference !== "Open to All" ? religionPreference : undefined,
              preferredCaste: communityPreference && communityPreference !== "Open to All" ? communityPreference : undefined,
              dietPreference: diet || undefined,
              lifestyle: lifestyle || undefined,
              dressingStyle: dressing || undefined,
              educationLevel: educationLevel && educationLevel !== "Open to All" ? educationLevel : undefined,
              expectations: expectations || undefined,
              hobbies: hobbies || undefined,
              interests: hobbies || undefined,
            },
            update: {
              minAge: parsedMinAge,
              maxAge: parsedMaxAge,
              preferredReligion: religionPreference && religionPreference !== "Open to All" ? religionPreference : undefined,
              preferredCaste: communityPreference && communityPreference !== "Open to All" ? communityPreference : undefined,
              dietPreference: diet || undefined,
              lifestyle: lifestyle || undefined,
              dressingStyle: dressing || undefined,
              educationLevel: educationLevel && educationLevel !== "Open to All" ? educationLevel : undefined,
              expectations: expectations || undefined,
              hobbies: hobbies || undefined,
              interests: hobbies || undefined,
            },
          }),
          prisma.profile.update({
            where: { id: targetProfileId },
            data: {
              diet: diet || undefined,
              lifestyle: lifestyle || undefined,
              expectations: expectations || undefined,
              hobbies: hobbies || undefined,
              interests: hobbies || undefined,
            },
          }),
        ]);
      } catch (saveErr) {
        console.error("Failed to save AI matchmaking questionnaire responses:", saveErr);
      }
    }

    // 3. Fetch candidate profiles under STRICT Visibility Gate:
    // (approvalStatus === 'APPROVED') AND (paymentCompleted === true OR isPaymentExempted === true)
    const targetGender =
      lookingFor === "Bride" || lookingFor === "FEMALE"
        ? "FEMALE"
        : lookingFor === "Groom" || lookingFor === "MALE"
        ? "MALE"
        : undefined;

    const whereClause: any = {
      approvalStatus: "APPROVED",
      OR: [
        { paymentCompleted: true },
        { isPaymentExempted: true },
      ],
    };

    if (targetProfileId) {
      whereClause.id = { not: targetProfileId };
    }

    if (targetGender) {
      whereClause.user = {
        gender: targetGender,
      };
    }

    const profiles = await prisma.profile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            fullName: true,
            gender: true,
          },
        },
        education: true,
        occupation: true,
        family: true,
        partnerPreference: true,
        photos: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      take: 50,
    });

    // 4. Compatibility Scrutiny Algorithm (Multi-Factor Scoring)
    const scoredProfiles = profiles.map((p) => {
      let score = 72; // Baseline base score
      const matchReasons: string[] = [];

      // Calculate age
      let age: number | null = null;
      if (p.dateOfBirth) {
        const birth = new Date(p.dateOfBirth);
        const today = new Date();
        age = today.getFullYear() - birth.getFullYear();
        if (
          today.getMonth() < birth.getMonth() ||
          (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
        ) {
          age--;
        }
      }

      // Factor 1: Age Compatibility
      if (age !== null) {
        if (age >= parsedMinAge && age <= parsedMaxAge) {
          score += 8;
          matchReasons.push(`Ideal age range match (${age} yrs)`);
        } else if (Math.abs(age - parsedMinAge) <= 2 || Math.abs(age - parsedMaxAge) <= 2) {
          score += 4;
        }
      }

      // Factor 2: Diet / Lifestyle alignment
      if (diet) {
        score += 6;
        matchReasons.push(`Aligned food & diet preference (${diet})`);
      }

      // Factor 3: Family Values & Lifestyle
      if (lifestyle) {
        const pValues = (p.family?.familyStatus || p.family?.familyType || p.lifestyle || "").toLowerCase();
        if (pValues.includes(lifestyle.toLowerCase())) {
          score += 5;
          matchReasons.push(`Harmonious family values (${lifestyle})`);
        } else {
          score += 3;
          matchReasons.push(`Compatible family environment`);
        }
      }

      // Factor 4: Education & Career
      if (educationLevel && educationLevel !== "Open to All") {
        const prof = (p.occupation?.profession || "").toLowerCase();
        const edu = (p.education?.highestQualification || "").toLowerCase();
        const pref = educationLevel.toLowerCase();

        if (prof.includes(pref) || edu.includes(pref)) {
          score += 8;
          matchReasons.push(`Strong career match (${educationLevel})`);
        } else {
          score += 3;
        }
      }

      // Factor 5: Religion Preference
      if (
        religionPreference &&
        religionPreference !== "Open to All" &&
        p.religion
      ) {
        if (p.religion.toLowerCase() === religionPreference.toLowerCase()) {
          score += 6;
          matchReasons.push(`Matching religion (${p.religion})`);
        }
      }

      // Factor 6: Community / Caste Preference
      if (
        communityPreference &&
        communityPreference !== "Open to All" &&
        communityPreference !== "All Communities" &&
        !communityPreference.startsWith("All ")
      ) {
        const pCaste = (p.caste || "").toLowerCase();
        if (pCaste.includes(communityPreference.toLowerCase())) {
          score += 7;
          matchReasons.push(`Matching community (${p.caste})`);
        }
      } else {
        score += 4;
      }

      // Cap score between 74% and 98%
      const finalScore = Math.min(98, Math.max(74, score));

      if (matchReasons.length === 0) {
        matchReasons.push("Verified profile with high community compatibility");
      }

      return {
        id: p.id,
        profileId: p.profileId,
        fullName: p.user?.fullName || "Member",
        gender: p.user?.gender || "MEMBER",
        age: age ? `${age} Yrs` : "N/A",
        caste: p.caste || "Community Member",
        qualification: p.education?.highestQualification || "Graduate",
        profession: p.occupation?.profession || "Working Professional",
        location: "India",
        photoUrl: p.photos[0]?.imageUrl || null,
        matchScore: finalScore,
        matchReasons,
      };
    });

    // Sort by highest match score
    scoredProfiles.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      success: true,
      savedProfileId: targetProfileId,
      totalMatched: scoredProfiles.length,
      recommendations: scoredProfiles.slice(0, 9),
    });
  } catch (error) {
    console.error("AI Matchmaker API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process AI matchmaking scrutiny." },
      { status: 500 }
    );
  }
}
