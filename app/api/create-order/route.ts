import { NextRequest, NextResponse } from "next/server";
import { getRazorpayClient, getRazorpayCredentials } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body provided." },
        { status: 400 }
      );
    }

    const { service, profileId, gender: clientGender, currency = "INR", receipt, notes = {} } = body;

    // ==========================================
    // STRICT SERVER-SIDE PRICING CALCULATION
    // ==========================================
    let baseAmountRupees = 799; // Default Male
    let serviceName = "Matrimony Male Membership Registration";

    if (service === "ASTROLOGY" || notes?.service === "ASTROLOGY") {
      baseAmountRupees = 99;
      serviceName = "AI Vedic Astrological Remedies & Suggestion";
    } else if (profileId) {
      // Lookup profile and user to determine true gender
      const profile = await prisma.profile.findFirst({
        where: {
          OR: [{ id: profileId }, { profileId: profileId }],
        },
        include: { user: true },
      });

      const gender = (profile?.user?.gender || clientGender || "MALE").toUpperCase();
      if (gender === "FEMALE") {
        baseAmountRupees = 399;
        serviceName = "Matrimony Female Membership Registration";
      } else {
        baseAmountRupees = 799;
        serviceName = "Matrimony Male Membership Registration";
      }
    } else if (clientGender && String(clientGender).toUpperCase() === "FEMALE") {
      baseAmountRupees = 399;
      serviceName = "Matrimony Female Membership Registration";
    } else {
      baseAmountRupees = 799;
      serviceName = "Matrimony Male Membership Registration";
    }

    // 18% GST (9% CGST + 9% SGST)
    const gstAmountRupees = Math.round(baseAmountRupees * 0.18 * 100) / 100;
    const grossAmountRupees = Math.round((baseAmountRupees + gstAmountRupees) * 100) / 100;
    const amountInPaise = Math.round(grossAmountRupees * 100);

    let credentials;
    try {
      credentials = getRazorpayCredentials();
    } catch (authError: any) {
      return NextResponse.json(
        {
          success: false,
          message: authError?.message || "Razorpay credentials unauthorized.",
        },
        { status: 401 }
      );
    }

    const razorpay = getRazorpayClient();

    const orderOptions = {
      amount: amountInPaise, // strictly server-calculated paise
      currency: String(currency).toUpperCase(),
      receipt: receipt || `rcpt_${profileId || "ast"}_${Date.now()}`,
      notes: {
        ...notes,
        service: service === "ASTROLOGY" ? "ASTROLOGY" : "MEMBERSHIP",
        serviceName,
        baseAmount: String(baseAmountRupees),
        gstAmount: String(gstAmountRupees),
        grossAmount: String(grossAmountRupees),
        profileId: profileId || "N/A",
        source: "RishteClub Server-Enforced Checkout",
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    return NextResponse.json(
      {
        success: true,
        order_id: order.id,
        id: order.id,
        amount: order.amount,
        amountInRupees: grossAmountRupees,
        baseAmountRupees,
        gstAmountRupees,
        currency: order.currency,
        receipt: order.receipt,
        key_id: credentials.keyId,
        serviceName,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("RAZORPAY ORDER CREATION ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || error?.error?.description || "Failed to create Razorpay order.",
        error: error?.error || undefined,
      },
      { status: error?.statusCode || 500 }
    );
  }
}
