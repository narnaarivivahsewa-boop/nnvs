import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { autoGenerateAndSaveBiodataPdf } from "@/lib/pdf/biodata-generator";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { profileId } = await req.json();

    if (!profileId) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile ID is required.",
        },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.findFirst({
      where: {
        OR: [{ id: profileId }, { profileId: profileId }],
      },
    });

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile not found.",
        },
        { status: 404 }
      );
    }

    // Rule 2: Official Profile ID is assigned only upon confirmed payment or admin approval/clearance
    let officialProfileId = profile.profileId;
    if (profile.profileId.startsWith("DRAFT-") || profile.profileId === "DRAFT") {
      let candidateId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      while (await prisma.profile.findUnique({ where: { profileId: candidateId } })) {
        candidateId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      }
      officialProfileId = candidateId;
    }

    const isPaidOrExempt = profile.paymentCompleted || profile.isPaymentExempted;

    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        profileId: officialProfileId,
        approvalStatus: "APPROVED",
        paymentCompleted: true,
        isPaymentExempted: isPaidOrExempt ? profile.isPaymentExempted : true,
        paymentExemptionReason: profile.paymentExemptionReason || (isPaidOrExempt ? undefined : "Admin Manual Approval Fee Clearance"),
        isVisible: true,
        approvedAt: new Date(),
      },
    });

    // Event Hook 1: Auto-generate & persist PDF to caste folder upon admin approval
    autoGenerateAndSaveBiodataPdf(profile.id).catch((err) => {
      console.error("Auto PDF generation on approval failed:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Profile approved successfully. Biodata PDF auto-generated.",
      profile: updated,
    });
  } catch (error: any) {
    console.error("APPROVE PROFILE ERROR =>", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}