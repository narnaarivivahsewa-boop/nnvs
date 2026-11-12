import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { autoGenerateAndSaveBiodataPdf } from "@/lib/pdf/biodata-generator";
import { calculateGstFromGross } from "@/lib/gst";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET ||
      process.env.RAZORPAY_KEY_SECRET ||
      "nnvs_razorpay_secret_2026_webhook";

    if (!signature) {
      console.warn("Razorpay Webhook: Missing x-razorpay-signature header");
      return NextResponse.json(
        { success: false, message: "Missing webhook signature" },
        { status: 400 }
      );
    }

    // Verify HMAC-SHA256 signature with timing-safe comparison
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf8");
    const providedBuf = Buffer.from(signature, "utf8");
    if (
      expectedBuf.length !== providedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, providedBuf)
    ) {
      console.error("Razorpay Webhook: Signature mismatch.");
      return NextResponse.json(
        { success: false, message: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid webhook JSON payload" },
        { status: 400 }
      );
    }

    console.log(`Razorpay Webhook received event: ${event.event}`);

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity || event.payload?.order?.entity;
      if (!paymentEntity) {
        return NextResponse.json({ status: "ignored_no_entity" }, { status: 200 });
      }

      const razorpayPaymentId = paymentEntity.id;
      const razorpayOrderId = paymentEntity.order_id;
      const amountInPaise = Number(paymentEntity.amount || 0);
      const grossAmount = amountInPaise / 100;
      const notes = paymentEntity.notes || {};
      const profileId = notes.profileId && notes.profileId !== "N/A" ? notes.profileId : null;
      const serviceType = notes.service || "MEMBERSHIP";

      // Check if this payment is already recorded (Idempotency)
      const existingPayment = await prisma.payment.findFirst({
        where: { transactionId: razorpayPaymentId },
        select: { id: true },
      });

      if (!existingPayment) {
        let matchedProfile = null;
        if (profileId) {
          matchedProfile = await prisma.profile.findFirst({
            where: {
              OR: [{ id: profileId }, { profileId: profileId }],
            },
            select: {
              id: true,
              profileId: true,
              userId: true,
              approvedAt: true,
            },
          });
        }

        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

        if (matchedProfile) {
          const paidNow = new Date();
          const paymentId = crypto.randomUUID();
          const gstBreakdown =
            grossAmount > 0
              ? calculateGstFromGross(grossAmount, 18, false)
              : { taxableAmount: 0, gstRate: 18, totalTax: 0 };

          // Resolve Official Profile ID before batch transaction
          let officialProfileId = matchedProfile.profileId;
          if (matchedProfile.profileId.startsWith("DRAFT-") || matchedProfile.profileId === "DRAFT") {
            let candidateId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
            while (await prisma.profile.findUnique({ where: { profileId: candidateId }, select: { id: true } })) {
              candidateId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
            }
            officialProfileId = candidateId;
          }

          const promoCodeFromNotes = notes.promoCode;
          const cleanCode =
            promoCodeFromNotes && promoCodeFromNotes !== "NONE"
              ? String(promoCodeFromNotes).trim().toUpperCase()
              : null;

          const activePromo = cleanCode
            ? await prisma.promoCode.findFirst({
                where: { code: cleanCode, status: "ACTIVE" },
                select: { id: true },
              })
            : null;

          const txOps: any[] = [
            prisma.payment.create({
              data: {
                id: paymentId,
                userId: matchedProfile.userId,
                profileId: matchedProfile.id,
                amount: grossAmount,
                grossAmount: grossAmount,
                taxableAmount: gstBreakdown.taxableAmount,
                gstRate: 18,
                gstAmount: gstBreakdown.totalTax,
                invoiceNumber,
                invoiceDate: paidNow,
                invoiceUrl: `/invoice/${paymentId}`,
                status: "SUCCESS",
                paymentGateway: "RAZORPAY",
                transactionId: razorpayPaymentId,
                adminNotes: `Webhook Auto-Capture (Order: ${razorpayOrderId}, Service: ${serviceType})`,
                paymentDate: paidNow,
              },
            }),
            // Direct Live Activation Rule
            prisma.profile.update({
              where: { id: matchedProfile.id },
              data: {
                profileId: officialProfileId,
                paymentCompleted: true,
                approvalStatus: "APPROVED",
                isVisible: true,
                approvedAt: matchedProfile.approvedAt || paidNow,
              },
            }),
          ];

          if (activePromo) {
            txOps.push(
              prisma.promoCode.updateMany({
                where: { id: activePromo.id, status: "ACTIVE" },
                data: {
                  status: "USED",
                  usedAt: paidNow,
                  usedPaymentId: paymentId,
                  assignedProfileId: matchedProfile.id,
                },
              })
            );
          }

          await prisma.$transaction(txOps);

          // Update secondary Coupon table outside transaction to prevent 25P02 aborts
          if (activePromo && cleanCode) {
            try {
              await prisma.coupon.updateMany({
                where: { code: cleanCode },
                data: { isActive: false },
              });
            } catch {
              // Ignore secondary table
            }
          }

          // Automated PDF Generation for paid profile
          autoGenerateAndSaveBiodataPdf(matchedProfile.id).catch((err) => {
            console.error("[Auto PDF generation error in webhook]:", err);
          });

          console.log(`✓ Webhook captured payment for Profile ${officialProfileId} (₹${grossAmount})`);
        }
      } else {
        // If already existing payment, ensure PDF exists
        if (profileId) {
          autoGenerateAndSaveBiodataPdf(profileId).catch((err) => {
            console.error("[Auto PDF generation error for existing webhook payment]:", err);
          });
        }
      }
    }

    return NextResponse.json({ status: "success", received: true }, { status: 200 });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
    return NextResponse.json(
      { success: false, message: "Webhook handling error" },
      { status: 500 }
    );
  }
}
