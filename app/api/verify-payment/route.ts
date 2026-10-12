import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";

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
    } catch (err: any) {
      console.error("Signature verification error:", err);
      return NextResponse.json(
        {
          success: false,
          message: err?.message || "Signature verification failed due to internal error.",
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

    const grossAmount = amount ? Number(amount) / 100 : 0;
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Check if already captured by webhook
    let existingPayment = await prisma.payment.findFirst({
      where: { transactionId: razorpay_payment_id },
    });

    let paymentRecordId = existingPayment?.id || null;

    if (profileId) {
      try {
        const profile = await prisma.profile.findFirst({
          where: {
            OR: [{ id: String(profileId) }, { profileId: String(profileId) }],
          },
          include: { user: true },
        });

        if (profile) {
          if (!existingPayment) {
            const result = await prisma.$transaction(async (tx) => {
              const payment = await tx.payment.create({
                data: {
                  userId: profile.userId,
                  profileId: profile.id,
                  amount: grossAmount > 0 ? grossAmount : 0,
                  grossAmount: grossAmount > 0 ? grossAmount : 0,
                  invoiceNumber,
                  status: "SUCCESS",
                  paymentGateway: "RAZORPAY",
                  transactionId: razorpay_payment_id,
                  adminNotes: `Razorpay Order ID: ${razorpay_order_id}`,
                  paymentDate: new Date(),
                },
              });

              // Strict Gate: A profile must strictly remain inactive (isVisible: false)
              // until an Admin officially approves it.
              const willBeVisible = profile.approvalStatus === "APPROVED";

              await tx.profile.update({
                where: { id: profile.id },
                data: {
                  paymentCompleted: true,
                  isVisible: willBeVisible,
                  approvalStatus:
                    profile.approvalStatus === "DRAFT"
                      ? "UNDER_REVIEW"
                      : profile.approvalStatus,
                },
              });

              if (promoCode) {
                const promo = await tx.promoCode.findUnique({
                  where: { code: String(promoCode).trim().toUpperCase() },
                });
                if (promo && promo.status === "ACTIVE") {
                  await tx.promoCode.update({
                    where: { id: promo.id },
                    data: {
                      status: "USED",
                      usedAt: new Date(),
                      usedPaymentId: payment.id,
                    },
                  });
                }
              }

              return payment;
            });
            paymentRecordId = result.id;
          } else {
            paymentRecordId = existingPayment.id;
          }
        }
      } catch (dbError) {
        console.error("Error updating database for verified payment:", dbError);
      }
    } else if (service === "ASTROLOGY" || body.type === "ASTROLOGY") {
      // Record standalone astrology payment
      try {
        if (!existingPayment) {
          const systemUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
          const payment = await prisma.payment.create({
            data: {
              userId: systemUser?.id || "astrology-guest",
              amount: grossAmount > 0 ? grossAmount : 116.82,
              grossAmount: grossAmount > 0 ? grossAmount : 116.82,
              invoiceNumber,
              status: "SUCCESS",
              paymentGateway: "RAZORPAY",
              transactionId: razorpay_payment_id,
              adminNotes: `Astrology Lal Kitab Remedies (Order: ${razorpay_order_id})`,
              paymentDate: new Date(),
            },
          });
          paymentRecordId = payment.id;
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
  } catch (error: any) {
    console.error("PAYMENT VERIFICATION ROUTE ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal server error while verifying payment.",
      },
      { status: 500 }
    );
  }
}
