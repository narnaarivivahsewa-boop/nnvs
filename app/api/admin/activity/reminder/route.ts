import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const { profileId, mobile, candidateName, channel, action } = body;

    if (!mobile && !profileId) {
      return NextResponse.json(
        { success: false, message: "Profile ID or mobile is required" },
        { status: 400 }
      );
    }

    const cleanMobile = String(mobile || "").replace(/\D/g, "").slice(-10);

    // Ensure admin userId exists in User table before referencing AuditLog FK
    let validAdminUserId: string | null = null;
    if (auth.user?.userId) {
      const adminRow = await prisma.user.findUnique({
        where: { id: auth.user.userId },
        select: { id: true },
      });
      validAdminUserId = adminRow?.id || null;
    }

    // If action is to reset password to temporary default
    if (action === "RESET_DEFAULT_PASSWORD") {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            ...(cleanMobile ? [{ mobile: cleanMobile }] : []),
            ...(profileId ? [{ profiles: { some: { profileId } } }] : []),
          ],
        },
        select: { id: true, fullName: true },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      const tempPasswordHash = await bcrypt.hash("NNVS@RC2026", 10);
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            password: tempPasswordHash,
            mustChangePassword: true,
          },
        }),
        prisma.auditLog.create({
          data: {
            userId: validAdminUserId,
            action: "RESET_MEMBER_PASSWORD",
            module: "USER_ADOPTION",
            details: `Reset password for member ${candidateName || user.fullName} (${cleanMobile}) to temporary default NNVS@RC2026 with mustChangePassword flag.`,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: "Password reset to default (NNVS@RC2026). Candidate will be prompted to change password on login.",
      });
    }

    // Record Reminder in AuditLog
    await prisma.auditLog.create({
      data: {
        userId: validAdminUserId,
        action: channel === "WHATSAPP" ? "SEND_WHATSAPP_REMINDER" : "SEND_SMS_REMINDER",
        module: "USER_ADOPTION",
        details: `Sent ${channel || "WhatsApp"} adoption reminder to candidate ${candidateName || "Member"} (${cleanMobile}) for Profile ${profileId || "N/A"}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Follow-up ${channel || "reminder"} logged successfully.`,
    });
  } catch (error) {
    console.error("Reminder Action Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process reminder action" },
      { status: 500 }
    );
  }
}
