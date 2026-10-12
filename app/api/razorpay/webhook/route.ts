import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

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
            await tx.payment.create({
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

            // Enforce Strict Gate: Do NOT set isVisible = true unless already approved
            await tx.profile.update({
              where: { id: matchedProfile.id },
              data: {
                paymentCompleted: true,
                approvalStatus:
                  matchedProfile.approvalStatus === "DRAFT"
                    ? "UNDER_REVIEW"
                    : matchedProfile.approvalStatus,
                isVisible: matchedProfile.approvalStatus === "APPROVED",
              },
            });
          });

          console.log(`✓ Webhook captured payment for Profile ${matchedProfile.profileId} (₹${grossAmount})`);
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
