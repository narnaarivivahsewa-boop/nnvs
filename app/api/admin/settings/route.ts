import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { BUSINESS_INFO } from "@/lib/gst";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    let setting = await prisma.adminSetting.findFirst();

    if (!setting) {
      setting = await prisma.adminSetting.create({
        data: {
          registrationEnabled: true,
          autoApproveProfiles: false,
          maintenanceMode: false,
          gstPercentage: 18.0,
          registrationFee: 1100.0,
          qrCodeUrl: BUSINESS_INFO.qrCodeUrl,
          qrUpiId: BUSINESS_INFO.upiId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: setting,
    });
  } catch (error: any) {
    console.error("ADMIN GET SETTINGS ERROR:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body = await req.json();
    const { registrationFee, gstPercentage, qrCodeUrl, qrUpiId, registrationEnabled, autoApproveProfiles, maintenanceMode } = body;

    let setting = await prisma.adminSetting.findFirst();

    if (!setting) {
      setting = await prisma.adminSetting.create({
        data: {
          registrationFee: registrationFee ? parseFloat(registrationFee) : 1100.0,
          gstPercentage: gstPercentage ? parseFloat(gstPercentage) : 18.0,
          qrCodeUrl: qrCodeUrl || BUSINESS_INFO.qrCodeUrl,
          qrUpiId: qrUpiId || BUSINESS_INFO.upiId,
          registrationEnabled: registrationEnabled ?? true,
          autoApproveProfiles: autoApproveProfiles ?? false,
          maintenanceMode: maintenanceMode ?? false,
        },
      });
    } else {
      setting = await prisma.adminSetting.update({
        where: { id: setting.id },
        data: {
          ...(registrationFee !== undefined ? { registrationFee: parseFloat(registrationFee) } : {}),
          ...(gstPercentage !== undefined ? { gstPercentage: parseFloat(gstPercentage) } : {}),
          ...(qrCodeUrl !== undefined ? { qrCodeUrl: String(qrCodeUrl) } : {}),
          ...(qrUpiId !== undefined ? { qrUpiId: String(qrUpiId) } : {}),
          ...(registrationEnabled !== undefined ? { registrationEnabled: Boolean(registrationEnabled) } : {}),
          ...(autoApproveProfiles !== undefined ? { autoApproveProfiles: Boolean(autoApproveProfiles) } : {}),
          ...(maintenanceMode !== undefined ? { maintenanceMode: Boolean(maintenanceMode) } : {}),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: setting,
    });
  } catch (error: any) {
    console.error("ADMIN SAVE SETTINGS ERROR:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
