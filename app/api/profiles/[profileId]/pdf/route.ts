import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBiodataPdfBuffer, saveBiodataPdfLocally } from "@/lib/pdf/biodata-generator";
import {
  generateBiodataJpegBuffer,
  saveBiodataJpegLocally,
} from "@/lib/pdf/biodata-jpeg-generator";
import { requireAdmin } from "@/lib/admin-auth";

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
            status: true,
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

    // Strict Payment Gate: Biodata MUST ONLY be generated for profiles with confirmed payment
    // 100% Free & Unrestricted for Admin users
    let isAdmin = false;
    try {
      const auth = await requireAdmin(req);
      if (auth.authorized) {
        isAdmin = true;
      }
    } catch {
      isAdmin = false;
    }

    if (!isAdmin && !profile.paymentCompleted && !profile.isPaymentExempted) {
      return NextResponse.json(
        {
          error: "Biodata is only available for profiles with confirmed payment.",
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
    const format = (searchParams.get("format") || "jpeg").toLowerCase();

    const code = (profile.legacyProfileId || profile.profileId || "").replace(/[^a-zA-Z0-9_-]/g, "_");

    // If explicitly requested format=pdf, provide PDF
    if (format === "pdf") {
      const pdfBuffer = await generateBiodataPdfBuffer(profile as any, {
        hideContactDetails: withoutContact,
      });

      saveBiodataPdfLocally(profile as any, pdfBuffer, { withoutContact }).catch((err) => {
        console.error("[PDF Local Save Warning]:", err);
      });

      const candidateName = (
        [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
        profile.user?.fullName ||
        "Biodata"
      ).replace(/[^a-zA-Z0-9_-]/g, "_");
      const pdfFileName = `Biodata_${code ? `${code}_` : ""}${candidateName}${withoutContact ? "_NoContact" : ""}.pdf`;

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `${isInline ? "inline" : "attachment"}; filename="${pdfFileName}"`,
          "Cache-Control": withoutContact
            ? "public, max-age=3600, s-maxage=3600"
            : "private, no-cache, no-store, must-revalidate",
        },
      });
    }

    // Default: Return high-resolution JPEG Biodata
    const jpegBuffer = await generateBiodataJpegBuffer(profile as any, {
      hideContactDetails: withoutContact,
    });

    saveBiodataJpegLocally(profile as any, jpegBuffer, { withoutContact }).catch((err) => {
      console.error("[Biodata JPEG Local Save Warning]:", err);
    });

    const fileName = `RishteClub-Biodata-${code || "Profile"}${withoutContact ? "-NoContact" : ""}.jpg`;

    return new NextResponse(new Uint8Array(jpegBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `${isInline ? "inline" : "attachment"}; filename="${fileName}"`,
        "Cache-Control": withoutContact
          ? "public, max-age=3600, s-maxage=3600"
          : "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Error generating biodata:", error);
    return NextResponse.json(
      { error: "Failed to generate biodata." },
      { status: 500 }
    );
  }
}
