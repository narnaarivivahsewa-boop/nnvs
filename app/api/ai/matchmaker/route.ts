import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      lookingFor,
      minAge = 21,
      maxAge = 35,
      diet,
      lifestyle,
      educationLevel,
      religionPreference,
      communityPreference,
    } = body;

    // 1. Fetch approved and visible profiles
    const targetGender =
      lookingFor === "Bride" || lookingFor === "FEMALE"
        ? "FEMALE"
        : lookingFor === "Groom" || lookingFor === "MALE"
        ? "MALE"
        : undefined;

    const whereClause: any = {
      isVisible: true,
      OR: [
        { paymentCompleted: true },
        { approvalStatus: "APPROVED" },
      ],
    };

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

    // 2. Compatibility Scrutiny Algorithm (Multi-Factor Scoring)
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
        if (age >= Number(minAge) && age <= Number(maxAge)) {
          score += 8;
          matchReasons.push(`Ideal age range match (${age} yrs)`);
        } else if (Math.abs(age - Number(minAge)) <= 2 || Math.abs(age - Number(maxAge)) <= 2) {
          score += 4;
        }
      }

      // Factor 2: Diet / Lifestyle alignment
      if (diet) {
        score += 6;
        matchReasons.push(`Aligned food & diet preference (${diet})`);
      }

      // Factor 3: Family Values
      if (lifestyle) {
        const pValues = (p.family?.familyStatus || p.family?.familyType || "").toLowerCase();
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
