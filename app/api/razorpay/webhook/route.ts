import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { autoGenerateAndSaveBiodataPdf } from "@/lib/pdf/biodata-generator";

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

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Razorpay Webhook: Signature mismatch.");
      return NextResponse.json(
        { success: false, message: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
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
      });

      if (!existingPayment) {
        let matchedProfile = null;
        if (profileId) {
          matchedProfile = await prisma.profile.findFirst({
            where: {
              OR: [{ id: profileId }, { profileId: profileId }],
            },
            include: { user: true },
          });
        }

        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

        if (matchedProfile) {
          await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
              data: {
                userId: matchedProfile.userId,
                profileId: matchedProfile.id,
                amount: grossAmount,
                grossAmount: grossAmount,
                invoiceNumber,
                status: "SUCCESS",
                paymentGateway: "RAZORPAY",
                transactionId: razorpayPaymentId,
                adminNotes: `Webhook Auto-Capture (Order: ${razorpayOrderId}, Service: ${serviceType})`,
                paymentDate: new Date(),
              },
            });

            // Rule 2: Official Profile ID is assigned only upon confirmed payment
            let officialProfileId = matchedProfile.profileId;
            if (matchedProfile.profileId.startsWith("DRAFT-") || matchedProfile.profileId === "DRAFT") {
              let candidateId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
              while (await tx.profile.findUnique({ where: { profileId: candidateId } })) {
                candidateId = `RC${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
              }
              officialProfileId = candidateId;
            }

            // Direct Live Activation Rule:
            // When payment is verified for OTP-registered user, make profile directly LIVE
            await tx.profile.update({
              where: { id: matchedProfile.id },
              data: {
                profileId: officialProfileId,
                paymentCompleted: true,
                approvalStatus: "APPROVED",
                isVisible: true,
                approvedAt: matchedProfile.approvedAt || new Date(),
              },
            });

            // Burn promo code if present in notes
            const promoCodeFromNotes = notes.promoCode;
            if (promoCodeFromNotes && promoCodeFromNotes !== "NONE") {
              const cleanCode = String(promoCodeFromNotes).trim().toUpperCase();
              const promo = await tx.promoCode.findUnique({
                where: { code: cleanCode },
              });
              if (promo && promo.status === "ACTIVE") {
                await tx.promoCode.update({
                  where: { id: promo.id },
                  data: {
                    status: "USED",
                    usedAt: new Date(),
                    usedPaymentId: payment.id,
                    assignedProfileId: matchedProfile.id,
                  },
                });

                try {
                  await tx.coupon.updateMany({
                    where: { code: cleanCode },
                    data: { isActive: false },
                  });
                } catch {
                  // Ignore secondary table
                }
              }
            }
          });

          // Automated PDF Generation for paid profile
          autoGenerateAndSaveBiodataPdf(matchedProfile.id).catch((err) => {
            console.error("[Auto PDF generation error in webhook]:", err);
          });

          console.log(`✓ Webhook captured payment for Profile ${matchedProfile.profileId} (₹${grossAmount})`);
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
  } catch (error: any) {
    console.error("Razorpay Webhook Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Webhook handling error" },
      { status: 500 }
    );
  }
}
