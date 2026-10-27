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
    const body = await req.json();
    const { profileId, mobile, candidateName, channel, action } = body;

    if (!mobile && !profileId) {
      return NextResponse.json(
        { success: false, message: "Profile ID or mobile is required" },
        { status: 400 }
      );
    }

    const cleanMobile = String(mobile || "").replace(/\D/g, "").slice(-10);

    // If action is to reset password to temporary default
    if (action === "RESET_DEFAULT_PASSWORD") {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { mobile: cleanMobile },
            { profiles: { some: { profileId } } },
          ],
        },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      const tempPasswordHash = await bcrypt.hash("NNVS@RC2026", 10);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: tempPasswordHash,
          mustChangePassword: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: auth.user.userId,
          action: "RESET_MEMBER_PASSWORD",
          module: "USER_ADOPTION",
          details: `Reset password for member ${candidateName || user.fullName} (${cleanMobile}) to temporary default NNVS@RC2026 with mustChangePassword flag.`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Password reset to default (NNVS@RC2026). Candidate will be prompted to change password on login.",
      });
    }

    // Record Reminder in AuditLog
    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: channel === "WHATSAPP" ? "SEND_WHATSAPP_REMINDER" : "SEND_SMS_REMINDER",
        module: "USER_ADOPTION",
        details: `Sent ${channel || "WhatsApp"} adoption reminder to candidate ${candidateName || "Member"} (${cleanMobile}) for Profile ${profileId || "N/A"}.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Follow-up ${channel || "reminder"} logged successfully.`,
    });
  } catch (error: any) {
    console.error("Reminder Action Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to process reminder action" },
      { status: 500 }
    );
  }
}
