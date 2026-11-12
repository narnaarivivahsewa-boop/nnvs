import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { verifyRequestSession } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { autoGenerateAndSaveBiodataPdf } from "@/lib/pdf/biodata-generator";
import { calculateGstFromGross } from "@/lib/gst";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      profileId,
      promoCode,
      amount,
      service,
    } = body;

    // Validate required Razorpay signature verification parameters
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing required parameters. razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
        },
        { status: 400 }
      );
    }

    // Verify HMAC-SHA256 signature
    let isValid = false;
    try {
      isValid = verifyRazorpaySignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });
    } catch (err) {
      console.error("Signature verification error:", err);
      return NextResponse.json(
        {
          success: false,
          message: "Signature verification failed due to internal configuration error.",
        },
        { status: 500 }
      );
    }

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment signature mismatch. Verification failed.",
        },
        { status: 400 }
      );
    }

    const grossAmount = amount ? Math.round(Number(amount)) / 100 : 0;
    const now = new Date();
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Check if already captured by webhook
    const existingPayment = await prisma.payment.findFirst({
      where: { transactionId: razorpay_payment_id },
      select: { id: true },
    });

    let paymentRecordId = existingPayment?.id || null;

    if (profileId) {
      try {
        const profile = await prisma.profile.findFirst({
          where: {
            OR: [{ id: String(profileId) }, { profileId: String(profileId) }],
          },
          select: {
            id: true,
            profileId: true,
            userId: true,
            approvedAt: true,
          },
        });

        if (profile) {
          if (!existingPayment) {
            const paidGross = grossAmount > 0 ? grossAmount : 0;
            const paymentId = crypto.randomUUID();
            const gstBreakdown =
              paidGross > 0
                ? calculateGstFromGross(paidGross, 18, false)
                : { taxableAmount: 0, gstRate: 18, totalTax: 0 };

            // Rule 2: Official Profile ID is assigned before batch transaction
            let officialProfileId = profile.profileId;
            if (profile.profileId.startsWith("DRAFT-") || profile.profileId === "DRAFT") {
              let candidateId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
              while (await prisma.profile.findUnique({ where: { profileId: candidateId }, select: { id: true } })) {
                candidateId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
              }
              officialProfileId = candidateId;
            }

            const cleanPromoCode = promoCode ? String(promoCode).trim().toUpperCase() : null;
            const activePromo = cleanPromoCode
              ? await prisma.promoCode.findFirst({
                  where: { code: cleanPromoCode, status: "ACTIVE" },
                  select: { id: true },
                })
              : null;

            const txOps: any[] = [
              prisma.payment.create({
                data: {
                  id: paymentId,
                  userId: profile.userId,
                  profileId: profile.id,
                  amount: paidGross,
                  grossAmount: paidGross,
                  taxableAmount: gstBreakdown.taxableAmount,
                  gstRate: 18,
                  gstAmount: gstBreakdown.totalTax,
                  invoiceNumber,
                  invoiceDate: now,
                  invoiceUrl: `/invoice/${paymentId}`,
                  status: "SUCCESS",
                  paymentGateway: "RAZORPAY",
                  transactionId: razorpay_payment_id,
                  adminNotes: `Razorpay Order ID: ${razorpay_order_id}`,
                  paymentDate: now,
                },
              }),
              // Direct Live Activation Rule
              prisma.profile.update({
                where: { id: profile.id },
                data: {
                  profileId: officialProfileId,
                  paymentCompleted: true,
                  isVisible: true,
                  approvalStatus: "APPROVED",
                  approvedAt: profile.approvedAt || now,
                },
              }),
            ];

            if (activePromo) {
              txOps.push(
                prisma.promoCode.updateMany({
                  where: { id: activePromo.id, status: "ACTIVE" },
                  data: {
                    status: "USED",
                    usedAt: now,
                    usedPaymentId: paymentId,
                    assignedProfileId: profile.id,
                  },
                })
              );
            }

            const [payment] = await prisma.$transaction(txOps);
            paymentRecordId = payment.id;

            // Update secondary Coupon table outside transaction to avoid 25P02 aborts
            if (activePromo && cleanPromoCode) {
              try {
                await prisma.coupon.updateMany({
                  where: { code: cleanPromoCode },
                  data: { isActive: false },
                });
              } catch {
                // Ignore secondary table update if not present
              }
            }

            // Automated PDF Generation for paid profile
            autoGenerateAndSaveBiodataPdf(profile.id).catch((err) => {
              console.error("[Auto PDF generation error in verify-payment]:", err);
            });
          } else {
            paymentRecordId = existingPayment.id;
            autoGenerateAndSaveBiodataPdf(profile.id).catch((err) => {
              console.error("[Auto PDF generation error for existing payment]:", err);
            });
          }
        }
      } catch (dbError) {
        console.error("Error updating database for verified payment:", dbError);
        return NextResponse.json(
          {
            success: false,
            message: "Payment signature verified, but recording payment failed. Please contact support with your Payment ID.",
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
          },
          { status: 500 }
        );
      }
    } else if (service === "ASTROLOGY" || body.type === "ASTROLOGY") {
      // Record standalone astrology payment
      try {
        if (!existingPayment) {
          const { session } = await verifyRequestSession(req);
          let resolvedUserId: string | null = null;
          if (session?.userId) {
            const sessionUser = await prisma.user.findUnique({
              where: { id: session.userId },
              select: { id: true },
            });
            resolvedUserId = sessionUser?.id || null;
          }
          if (!resolvedUserId) {
            const systemUser = await prisma.user.findFirst({
              where: { role: "ADMIN" },
              select: { id: true },
            });
            resolvedUserId = systemUser?.id || null;
          }

          if (resolvedUserId) {
            const astroGross = grossAmount > 0 ? grossAmount : 116.82;
            const astroGst = calculateGstFromGross(astroGross, 18, false);
            const paymentId = crypto.randomUUID();
            const payment = await prisma.payment.create({
              data: {
                id: paymentId,
                userId: resolvedUserId,
                amount: astroGross,
                grossAmount: astroGross,
                taxableAmount: astroGst.taxableAmount,
                gstRate: 18,
                gstAmount: astroGst.totalTax,
                invoiceNumber,
                invoiceDate: now,
                invoiceUrl: `/invoice/${paymentId}`,
                status: "SUCCESS",
                paymentGateway: "RAZORPAY",
                transactionId: razorpay_payment_id,
                adminNotes: `Astrology Lal Kitab Remedies (Order: ${razorpay_order_id})`,
                paymentDate: now,
              },
            });
            paymentRecordId = payment.id;
          } else {
            console.warn("Astrology payment verified but no DB user available for Payment.userId FK.");
          }
        } else {
          paymentRecordId = existingPayment.id;
        }
      } catch (e) {
        console.error("Astrology payment recording error:", e);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment verified successfully.",
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
        paymentRecordId: paymentRecordId,
        invoiceUrl: paymentRecordId ? `/invoice/${paymentRecordId}` : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PAYMENT VERIFICATION ROUTE ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error while verifying payment.",
      },
      { status: 500 }
    );
  }
}
