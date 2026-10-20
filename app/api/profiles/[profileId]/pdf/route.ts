import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBiodataPdfBuffer, saveBiodataPdfLocally } from "@/lib/pdf/biodata-generator";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await context.params;

    if (!profileId) {
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
    }

    // Lookup profile by id, profileId, or legacyProfileId
    const profile = await prisma.profile.findFirst({
      where: {
        OR: [
          { id: profileId },
          { profileId: profileId },
          { legacyProfileId: profileId },
          { legacyProfileId: profileId.toUpperCase() },
        ],
      },
      include: {
        user: {
          select: {
            fullName: true,
            gender: true,
            mobile: true,
            email: true,
          },
        },
        photos: {
          orderBy: { isPrimary: "desc" },
          select: {
            imageUrl: true,
            isPrimary: true,
          },
        },
        family: true,
        education: true,
        occupation: true,
        partnerPreference: true,
        phoneNumbers: {
          select: {
            phone: true,
            isPrimary: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Strict Payment Gate: Biodata PDF MUST ONLY be generated for profiles with confirmed payment
    if (!profile.paymentCompleted && !profile.isPaymentExempted) {
      return NextResponse.json(
        {
          error: "Biodata PDF is only available for profiles with confirmed payment.",
          profileId: profile.profileId,
          paymentCompleted: false,
        },
        { status: 403 }
      );
    }

    // Check query params
    const { searchParams } = new URL(req.url);
    const isInline = searchParams.get("view") === "inline";
    const withoutContact =
      searchParams.get("withoutContact") === "true" ||
      searchParams.get("hideContact") === "true";

    // Generate PDF Buffer
    const pdfBuffer = await generateBiodataPdfBuffer(profile as any, {
      hideContactDetails: withoutContact,
    });

    // Asynchronously save copy to D:\NNVS\Website Bio PDF
    saveBiodataPdfLocally(profile as any, pdfBuffer, { withoutContact }).catch((err) => {
      console.error("[PDF Local Save Warning]:", err);
    });

    const candidateName = (
      [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
      profile.user?.fullName ||
      "Biodata"
    ).replace(/[^a-zA-Z0-9_-]/g, "_");
    const code = (profile.legacyProfileId || profile.profileId || "").replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `Biodata_${code ? `${code}_` : ""}${candidateName}${withoutContact ? "_NoContact" : ""}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${isInline ? "inline" : "attachment"}; filename="${fileName}"`,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error: any) {
    console.error("Error generating biodata PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate biodata PDF", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
