import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { calculateAuthenticGunaMilan } from "@/lib/astrology/vedic-match";
import * as XLSX from "xlsx";

function calculateAge(dob?: Date | string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

function parseHeightToInches(h?: string | number | null): number | null {
  if (!h) return null;
  const str = String(h).trim().toLowerCase();
  const cmMatch = str.match(/(\d+)\s*cm/);
  if (cmMatch) return Math.round(parseInt(cmMatch[1], 10) / 2.54);
  const ftInMatch = str.match(/(\d+)\s*(?:ft|'|foot|feet)?\s*(\d+)?(?:\s*(?:in|''|"|inch|inches))?/);
  if (ftInMatch) {
    const feet = parseInt(ftInMatch[1], 10);
    const inches = ftInMatch[2] ? parseInt(ftInMatch[2], 10) : 0;
    if (feet >= 3 && feet <= 7) {
      return feet * 12 + inches;
    }
  }
  return null;
}

function extractGotra(notes?: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/Gotra:\s*([^;\n]+)/i);
  return match ? match[1].trim() : null;
}

function computeGunaMilan(p1: any, p2: any) {
  const p1Gender = String(p1.user?.gender || "").toUpperCase();
  const boy = p1Gender === "MALE" ? p1 : p2;
  const girl = p1Gender === "MALE" ? p2 : p1;

  try {
    return calculateAuthenticGunaMilan(
      boy.dateOfBirth,
      girl.dateOfBirth,
      boy.birthTime,
      girl.birthTime,
      boy.manglik,
      girl.manglik
    );
  } catch (e) {
    console.warn("Guna milan calculation error:", e);
    return null;
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await context.params;

    // 1. Lookup Target Profile
    const targetProfile = await prisma.profile.findFirst({
      where: {
        OR: [{ id }, { profileId: id }, { legacyProfileId: id }],
      },
      include: {
        user: true,
        photos: { orderBy: { isPrimary: "desc" } },
        family: true,
        education: true,
        occupation: true,
        partnerPreference: true,
        phoneNumbers: true,
      },
    });

    if (!targetProfile) {
      return NextResponse.json({ success: false, message: "Target profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const compareWithId = searchParams.get("compareWithId");

    // If direct Kundali Milan requested for a specific second profile
    if (compareWithId) {
      const secondProfile = await prisma.profile.findFirst({
        where: {
          OR: [{ id: compareWithId }, { profileId: compareWithId }, { legacyProfileId: compareWithId }],
        },
        include: {
          user: true,
          photos: { orderBy: { isPrimary: "desc" } },
          family: true,
          education: true,
          occupation: true,
          partnerPreference: true,
          phoneNumbers: true,
        },
      });

      if (!secondProfile) {
        return NextResponse.json({ success: false, message: "Comparison profile not found" }, { status: 404 });
      }

      const gunaMilan = computeGunaMilan(targetProfile, secondProfile);
      const targetGotra = extractGotra(targetProfile.notes);
      const secondGotra = extractGotra(secondProfile.notes);
      const isSameGotra = Boolean(
        targetGotra &&
        secondGotra &&
        targetGotra.toLowerCase() === secondGotra.toLowerCase()
      );

      return NextResponse.json({
        success: true,
        profile1: targetProfile,
        profile2: secondProfile,
        gunaMilan,
        gotraDetails: {
          profile1Gotra: targetGotra || "Not specified",
          profile2Gotra: secondGotra || "Not specified",
          isSameGotra,
          gotraStatus: isSameGotra
            ? "Caution: Same Gotra (Sagotra) detected. Verify family kula tradition."
            : "Compatible (Different Gotra)",
        },
      });
    }

    // 2. Identify Target Gender & Opposite Gender
    const targetGender = String(targetProfile.user?.gender || "").toUpperCase();
    const oppositeGender = targetGender === "FEMALE" ? "MALE" : "FEMALE";

    // Extract filters from query parameters
    const casteFilter = searchParams.get("caste")?.trim() || "";
    const gotraFilter = searchParams.get("gotra")?.trim() || "";
    const excludeSameGotra = searchParams.get("excludeSameGotra") === "true";
    const manglikFilter = searchParams.get("manglik")?.trim() || "ALL";
    const maritalStatusFilter = searchParams.get("maritalStatus")?.trim() || "ALL";
    const minAgeFilter = searchParams.get("minAge") ? parseInt(searchParams.get("minAge")!, 10) : null;
    const maxAgeFilter = searchParams.get("maxAge") ? parseInt(searchParams.get("maxAge")!, 10) : null;
    const minHeightInches = searchParams.get("minHeight") ? parseHeightToInches(searchParams.get("minHeight")) : null;
    const maxHeightInches = searchParams.get("maxHeight") ? parseHeightToInches(searchParams.get("maxHeight")) : null;
    const searchKeyword = searchParams.get("search")?.trim().toLowerCase() || "";
    const exportFormat = searchParams.get("export");

    const targetGotra = extractGotra(targetProfile.notes);

    // 3. Fetch all opposite-gender candidate profiles
    const candidates = await prisma.profile.findMany({
      where: {
        id: { not: targetProfile.id },
        user: {
          gender: oppositeGender as any,
          status: "ACTIVE",
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            gender: true,
            mobile: true,
            email: true,
          },
        },
        photos: {
          orderBy: { isPrimary: "desc" },
          select: { imageUrl: true, isPrimary: true },
        },
        family: true,
        education: true,
        occupation: true,
        partnerPreference: true,
        phoneNumbers: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 4. Apply in-memory filtering & Kundali scoring
    const matchedList = candidates
      .map((cand) => {
        const candAge = calculateAge(cand.dateOfBirth);
        const candHeightInches = parseHeightToInches(cand.height);
        const candGotra = extractGotra(cand.notes);
        const isSameGotra = Boolean(
          targetGotra &&
          candGotra &&
          targetGotra.toLowerCase() === candGotra.toLowerCase()
        );

        // Compute quick Guna Milan
        const gunaResult = computeGunaMilan(targetProfile, cand);

        return {
          ...cand,
          calculatedAge: candAge,
          heightInches: candHeightInches,
          gotra: candGotra,
          isSameGotra,
          gunaScore: gunaResult?.totalGuna ?? null,
          gunaVerdict: gunaResult?.totalGuna
            ? gunaResult.totalGuna >= 28
              ? "Uttam (28+ Gunas)"
              : gunaResult.totalGuna >= 18
              ? "Madhyam / Shubh (18-27 Gunas)"
              : "Requires Remedies (<18 Gunas)"
            : "Dob / Astro Details Missing",
          manglikCompatibility: gunaResult?.manglikCompatibility || cand.manglik || "Unknown",
        };
      })
      .filter((cand) => {
        // Age Filter
        if (minAgeFilter !== null && (cand.calculatedAge === null || cand.calculatedAge < minAgeFilter)) {
          return false;
        }
        if (maxAgeFilter !== null && (cand.calculatedAge === null || cand.calculatedAge > maxAgeFilter)) {
          return false;
        }

        // Height Filter
        if (minHeightInches !== null && (cand.heightInches === null || cand.heightInches < minHeightInches)) {
          return false;
        }
        if (maxHeightInches !== null && (cand.heightInches === null || cand.heightInches > maxHeightInches)) {
          return false;
        }

        // Caste Filter
        if (casteFilter && casteFilter !== "ALL") {
          const cLower = (cand.caste || "").toLowerCase();
          if (!cLower.includes(casteFilter.toLowerCase())) return false;
        }

        // Gotra Filter
        if (gotraFilter) {
          const gLower = (cand.gotra || "").toLowerCase();
          if (!gLower.includes(gotraFilter.toLowerCase())) return false;
        }

        // Exclude Same Gotra if requested
        if (excludeSameGotra && cand.isSameGotra) {
          return false;
        }

        // Manglik Filter
        if (manglikFilter && manglikFilter !== "ALL") {
          const mLower = (cand.manglik || "").toLowerCase();
          if (manglikFilter === "NON_MANGLIK" && (mLower.includes("yes") || mLower.includes("manglik"))) {
            return false;
          }
          if (manglikFilter === "MANGLIK" && !mLower.includes("yes") && !mLower.includes("manglik")) {
            return false;
          }
        }

        // Marital Status Filter
        if (maritalStatusFilter && maritalStatusFilter !== "ALL") {
          if ((cand.maritalStatus || "").toLowerCase() !== maritalStatusFilter.toLowerCase()) {
            return false;
          }
        }

        // Keyword Search Filter
        if (searchKeyword) {
          const fullText = [
            cand.user?.fullName,
            cand.profileId,
            cand.legacyProfileId,
            cand.caste,
            cand.gotra,
            cand.birthPlace,
            cand.occupation?.profession,
            cand.education?.highestQualification,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (!fullText.includes(searchKeyword)) {
            return false;
          }
        }

        return true;
      });

    // 5. Sort matches (Highest Guna Score first, then most complete)
    matchedList.sort((a, b) => {
      const aScore = a.gunaScore ?? -1;
      const bScore = b.gunaScore ?? -1;
      return bScore - aScore;
    });

    // 6. If Excel Export Requested: generate consolidated spreadsheet
    if (exportFormat === "excel") {
      const rows = matchedList.map((m, idx) => ({
        "Sr No": idx + 1,
        "Profile ID": m.profileId,
        "Old NNVS ID": m.legacyProfileId || "-",
        "Full Name": m.user?.fullName || "-",
        "Gender": m.user?.gender || "-",
        "Age": m.calculatedAge ? `${m.calculatedAge} Yrs` : "-",
        "Height": m.height || "-",
        "Caste": m.caste || "-",
        "Gotra": m.gotra || "-",
        "Same Gotra Warning": m.isSameGotra ? "SAGOTRA (Same Gotra)" : "Compatible",
        "Manglik Status": m.manglik || "Non-Manglik",
        "36 Guna Score": m.gunaScore !== null ? `${m.gunaScore} / 36` : "Astro N/A",
        "Guna Verdict": m.gunaVerdict,
        "Manglik Compatibility": m.manglikCompatibility,
        "City / State": `${m.birthPlace || ""}`.trim() || "-",
        "Education": m.education?.highestQualification || "-",
        "Profession": m.occupation?.profession || "-",
        "Annual Income": m.occupation?.annualIncome || "-",
        "Father Name": m.family?.fatherName || "-",
        "Registered Mobile": m.user?.mobile || "-",
        "Secondary Phone": m.phoneNumbers?.[0]?.phone || "-",
        "Biodata PDF URL": `https://rishteclub.com/api/profiles/${m.id}/pdf`,
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Matching Candidates");

      const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      const targetName = (targetProfile.user?.fullName || targetProfile.profileId).replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `Matching_Candidates_for_${targetName}_${new Date().toISOString().slice(0, 10)}.xlsx`;

      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      targetProfile: {
        id: targetProfile.id,
        profileId: targetProfile.profileId,
        legacyProfileId: targetProfile.legacyProfileId,
        fullName: targetProfile.user?.fullName,
        gender: targetProfile.user?.gender,
        dateOfBirth: targetProfile.dateOfBirth,
        age: calculateAge(targetProfile.dateOfBirth),
        height: targetProfile.height,
        caste: targetProfile.caste,
        gotra: targetGotra,
        manglik: targetProfile.manglik,
      },
      oppositeGender,
      totalMatches: matchedList.length,
      matches: matchedList,
    });
  } catch (error: any) {
    console.error("ADMIN PROFILE MATCH API ERROR =>", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST endpoint for Instant Two-Profile Kundali Milan by IDs
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await context.params;
    const body = await req.json();
    const candidate2Id = body.candidateId || body.profile2Id;

    if (!candidate2Id) {
      return NextResponse.json({ success: false, message: "candidateId is required for Kundali Milan" }, { status: 400 });
    }

    const [p1, p2] = await Promise.all([
      prisma.profile.findFirst({
        where: { OR: [{ id }, { profileId: id }, { legacyProfileId: id }] },
        include: { user: true, family: true, education: true, occupation: true, photos: true },
      }),
      prisma.profile.findFirst({
        where: { OR: [{ id: candidate2Id }, { profileId: candidate2Id }, { legacyProfileId: candidate2Id }] },
        include: { user: true, family: true, education: true, occupation: true, photos: true },
      }),
    ]);

    if (!p1 || !p2) {
      return NextResponse.json({ success: false, message: "One or both profiles could not be found" }, { status: 404 });
    }

    const gunaData = computeGunaMilan(p1, p2);
    const p1Gotra = extractGotra(p1.notes);
    const p2Gotra = extractGotra(p2.notes);
    const isSameGotra = Boolean(p1Gotra && p2Gotra && p1Gotra.toLowerCase() === p2Gotra.toLowerCase());

    return NextResponse.json({
      success: true,
      profile1: {
        id: p1.id,
        profileId: p1.profileId,
        legacyProfileId: p1.legacyProfileId,
        fullName: p1.user?.fullName,
        gender: p1.user?.gender,
        dateOfBirth: p1.dateOfBirth,
        birthTime: p1.birthTime,
        birthPlace: p1.birthPlace,
        caste: p1.caste,
        gotra: p1Gotra,
        manglik: p1.manglik,
      },
      profile2: {
        id: p2.id,
        profileId: p2.profileId,
        legacyProfileId: p2.legacyProfileId,
        fullName: p2.user?.fullName,
        gender: p2.user?.gender,
        dateOfBirth: p2.dateOfBirth,
        birthTime: p2.birthTime,
        birthPlace: p2.birthPlace,
        caste: p2.caste,
        gotra: p2Gotra,
        manglik: p2.manglik,
      },
      gunaMilan: gunaData,
      isSameGotra,
      gotraMessage: isSameGotra
        ? "Caution: Both candidates share the same Gotra. Traditional Hindu Kula rules advise special elder consultation."
        : "Favorable: Both candidates have different Gotras.",
    });
  } catch (err: any) {
    console.error("ADMIN KUNDALI MATCH ERROR =>", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
