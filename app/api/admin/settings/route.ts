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
  } catch (error) {
    console.error("ADMIN GET SETTINGS ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch settings" },
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
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const { registrationFee, gstPercentage, qrCodeUrl, qrUpiId, registrationEnabled, autoApproveProfiles, maintenanceMode } = body;

    let parsedFee: number | undefined = undefined;
    if (registrationFee !== undefined) {
      const feeNum = parseFloat(String(registrationFee));
      if (!Number.isFinite(feeNum) || feeNum < 0) {
        return NextResponse.json(
          { success: false, message: "Invalid registration fee amount." },
          { status: 400 }
        );
      }
      parsedFee = feeNum;
    }

    let parsedGst: number | undefined = undefined;
    if (gstPercentage !== undefined) {
      const gstNum = parseFloat(String(gstPercentage));
      if (!Number.isFinite(gstNum) || gstNum < 0 || gstNum > 100) {
        return NextResponse.json(
          { success: false, message: "Invalid GST percentage (must be 0 to 100)." },
          { status: 400 }
        );
      }
      parsedGst = gstNum;
    }

    let setting = await prisma.adminSetting.findFirst();

    if (!setting) {
      setting = await prisma.adminSetting.create({
        data: {
          registrationFee: parsedFee ?? 1100.0,
          gstPercentage: parsedGst ?? 18.0,
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
          ...(parsedFee !== undefined ? { registrationFee: parsedFee } : {}),
          ...(parsedGst !== undefined ? { gstPercentage: parsedGst } : {}),
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
  } catch (error) {
    console.error("ADMIN SAVE SETTINGS ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save settings" },
      { status: 500 }
    );
  }
}
