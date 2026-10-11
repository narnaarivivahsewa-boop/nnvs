import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

function calculateAge(dob?: Date | string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const targetProfileId = searchParams.get("profileId");
    const format = searchParams.get("format"); // "csv" or "json"

    if (!targetProfileId) {
      return NextResponse.json(
        { success: false, message: "Target profileId is required for matchmaking." },
        { status: 400 }
      );
    }

    // 1. Fetch Target Profile
    const target = await prisma.profile.findFirst({
      where: {
        OR: [{ id: targetProfileId }, { profileId: targetProfileId }],
      },
      include: {
        user: true,
        family: true,
        education: true,
        occupation: true,
        partnerPreference: true,
      },
    });

    if (!target) {
      return NextResponse.json(
        { success: false, message: "Candidate profile not found." },
        { status: 404 }
      );
    }

    const targetGender = String(target.user?.gender || "MALE").toUpperCase();
    const oppositeGender = targetGender === "FEMALE" ? "MALE" : "FEMALE";
    const targetAge = calculateAge(target.dateOfBirth);

    // Optional Filter Overrides from Admin
    const minAge = Number(searchParams.get("minAge") || (targetAge ? Math.max(18, targetAge - 6) : 21));
    const maxAge = Number(searchParams.get("maxAge") || (targetAge ? targetAge + 6 : 38));
    const casteFilter = searchParams.get("caste")?.trim() || "";
    const religionFilter = searchParams.get("religion")?.trim() || "";

    // 2. Fetch Opposite Gender Candidates
    const candidates = await prisma.profile.findMany({
      where: {
        id: { not: target.id },
        user: {
          gender: oppositeGender as any,
        },
      },
      include: {
        user: true,
        family: true,
        education: true,
        occupation: true,
        photos: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      take: 200,
    });

    // 3. Compute Compatibility Scores
    const scoredMatches = candidates.map((cand) => {
      let score = 70; // Baseline compatibility
      const matchReasons: string[] = [];

      const candAge = calculateAge(cand.dateOfBirth);
      if (candAge !== null) {
        if (candAge >= minAge && candAge <= maxAge) {
          score += 10;
          matchReasons.push(`Age in preferred range (${candAge} yrs)`);
        } else if (Math.abs(candAge - minAge) <= 2 || Math.abs(candAge - maxAge) <= 2) {
          score += 4;
        }
      }

      // Caste alignment
      const candCaste = String(cand.caste || "").toLowerCase();
      const targetCaste = String(target.caste || "").toLowerCase();
      if (casteFilter) {
        if (candCaste.includes(casteFilter.toLowerCase())) {
          score += 10;
          matchReasons.push(`Matching community filter (${cand.caste})`);
        }
      } else if (targetCaste && candCaste && (targetCaste.includes(candCaste) || candCaste.includes(targetCaste))) {
        score += 10;
        matchReasons.push(`Same community match (${cand.caste})`);
      }

      // Religion alignment
      const candRel = String(cand.religion || "").toLowerCase();
      const targetRel = String(target.religion || "").toLowerCase();
      if (religionFilter) {
        if (candRel === religionFilter.toLowerCase()) {
          score += 5;
          matchReasons.push(`Matching religion (${cand.religion})`);
        }
      } else if (targetRel && candRel && targetRel === candRel) {
        score += 5;
        matchReasons.push(`Same religion (${cand.religion})`);
      }

      // Education & Profession
      if (cand.education?.highestQualification) {
        score += 4;
        matchReasons.push(`Qualified (${cand.education.highestQualification})`);
      }
      if (cand.occupation?.profession) {
        score += 4;
      }

      // Marital Status alignment
      if (cand.maritalStatus && target.maritalStatus) {
        if (cand.maritalStatus.toLowerCase() === target.maritalStatus.toLowerCase()) {
          score += 5;
          matchReasons.push(`Same marital status (${cand.maritalStatus})`);
        }
      }

      const finalScore = Math.min(99, Math.max(72, score));

      return {
        id: cand.id,
        profileId: cand.profileId,
        oldNnvsId: cand.oldNnvsId || cand.legacyProfileId || null,
        fullName: cand.user?.fullName || cand.firstName || "Candidate",
        gender: cand.user?.gender,
        age: candAge,
        caste: cand.caste || "General",
        religion: cand.religion || "Hindu",
        maritalStatus: cand.maritalStatus || "Never Married",
        qualification: cand.education?.highestQualification || "Graduate",
        profession: cand.occupation?.profession || "Private Sector",
        mobile: cand.user?.mobile,
        score: finalScore,
        matchReasons,
        photoUrl: cand.photos?.[0]?.imageUrl || null,
      };
    });

    // Sort descending by match score
    scoredMatches.sort((a, b) => b.score - a.score);

    // 4. Return CSV if requested
    if (format === "csv") {
      const headers = ["Score (%)", "Profile ID", "Old NNVS ID", "Name", "Gender", "Age", "Caste", "Religion", "Marital Status", "Education", "Profession", "Mobile", "Match Reasons"];
      const rows = scoredMatches.map((m) => [
        `${m.score}%`,
        `"${m.profileId}"`,
        `"${m.oldNnvsId || ""}"`,
        `"${m.fullName}"`,
        `"${m.gender || ""}"`,
        m.age || "",
        `"${m.caste || ""}"`,
        `"${m.religion || ""}"`,
        `"${m.maritalStatus || ""}"`,
        `"${m.qualification || ""}"`,
        `"${m.profession || ""}"`,
        `"${m.mobile || ""}"`,
        `"${m.matchReasons.join("; ")}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="Matches_For_${target.profileId}_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      targetCandidate: {
        profileId: target.profileId,
        fullName: target.user?.fullName || target.firstName,
        gender: targetGender,
        age: targetAge,
        caste: target.caste,
      },
      totalMatches: scoredMatches.length,
      matches: scoredMatches,
    });
  } catch (error: any) {
    console.error("ADMIN MATCHMAKING ERROR =>", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to run matchmaking." },
      { status: 500 }
    );
  }
}
