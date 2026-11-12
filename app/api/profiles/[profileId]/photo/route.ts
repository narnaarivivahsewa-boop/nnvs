import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRequestSession } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await context.params;
    const rawId = decodeURIComponent(String(profileId || "")).trim();

    if (!rawId) {
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
    }

    const { session } = await verifyRequestSession(req);

    const profile = await prisma.profile.findFirst({
      where: {
        OR: [{ id: rawId }, { profileId: rawId }],
      },
      select: {
        id: true,
        userId: true,
        isVisible: true,
        approvalStatus: true,
        photos: {
          select: { imageUrl: true, isPrimary: true },
          orderBy: { isPrimary: "desc" },
          take: 1,
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const isOwner = Boolean(session && session.userId === profile.userId);
    const isAdmin = session?.role === "ADMIN";
    const isPubliclyVisible =
      profile.isVisible && profile.approvalStatus === "APPROVED";

    if (!isOwner && !isAdmin && !isPubliclyVisible) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawUrl = profile.photos?.[0]?.imageUrl?.trim();
    if (!rawUrl) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    const dataMatch = rawUrl.match(/^data:([^;]+);base64,([\s\S]+)$/);
    if (dataMatch) {
      const mimeType = dataMatch[1] || "image/jpeg";
      const base64Data = dataMatch[2];
      const buffer = Buffer.from(base64Data, "base64");

      const headers: Record<string, string> = {
        "Content-Type": mimeType,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": isPubliclyVisible
          ? "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400"
          : "private, max-age=300",
      };
      if (!isPubliclyVisible) {
        headers.Vary = "Cookie, Authorization";
      }

      return new NextResponse(buffer, {
        status: 200,
        headers,
      });
    }

    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      return NextResponse.redirect(rawUrl, {
        status: 307,
        headers: isPubliclyVisible
          ? { "Cache-Control": "public, max-age=3600, s-maxage=86400" }
          : { "Cache-Control": "private, no-store" },
      });
    }

    if (rawUrl.startsWith("/")) {
      return NextResponse.redirect(new URL(rawUrl, req.url), { status: 307 });
    }

    return NextResponse.json({ error: "Unsupported photo format" }, { status: 404 });
  } catch (error) {
    console.error("PROFILE PHOTO GET ERROR =>", error);
    return NextResponse.json(
      { error: "Failed to load profile photo" },
      { status: 500 }
    );
  }
}

