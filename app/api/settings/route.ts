import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BUSINESS_INFO } from "@/lib/gst";

export async function GET() {
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

    const registrationFee = Number(setting.registrationFee || 1100.0);
    const gstPercentage = Number(setting.gstPercentage || 18.0);
    const qrCodeUrl = setting.qrCodeUrl || BUSINESS_INFO.qrCodeUrl;
    const qrUpiId = setting.qrUpiId || BUSINESS_INFO.upiId;

    return NextResponse.json({
      success: true,
      settings: {
        registrationFee,
        gstPercentage,
        qrCodeUrl,
        qrUpiId,
        whatsappNumber: BUSINESS_INFO.primaryWhatsApp,
        tradeName: BUSINESS_INFO.tradeName,
        gstin: BUSINESS_INFO.gstin,
        proprietor: BUSINESS_INFO.proprietor,
      },
    });
  } catch (error: any) {
    console.error("GET SETTINGS ERROR:", error);
    return NextResponse.json({
      success: true,
      settings: {
        registrationFee: 1100.0,
        gstPercentage: 18.0,
        qrCodeUrl: BUSINESS_INFO.qrCodeUrl,
        qrUpiId: BUSINESS_INFO.upiId,
        whatsappNumber: BUSINESS_INFO.primaryWhatsApp,
        tradeName: BUSINESS_INFO.tradeName,
        gstin: BUSINESS_INFO.gstin,
        proprietor: BUSINESS_INFO.proprietor,
      },
    });
  }
}
