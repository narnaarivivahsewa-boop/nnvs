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

    // Optional: If profileId is present, persist payment to database & activate/review profile
    let paymentRecord = null;
    if (profileId) {
      try {
        const profile = await prisma.profile.findUnique({
          where: { profileId: String(profileId) },
          include: { user: true },
        });

        if (profile) {
          const finalAmount = amount ? Number(amount) / 100 : 0;

          paymentRecord = await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
              data: {
                userId: profile.userId,
                profileId: profile.id,
                amount: finalAmount > 0 ? finalAmount : 0,
                status: "SUCCESS",
                paymentGateway: "RAZORPAY",
                transactionId: razorpay_payment_id,
                adminNotes: `Razorpay Order ID: ${razorpay_order_id}`,
                paymentDate: new Date(),
              },
            });

            await tx.profile.update({
              where: { id: profile.id },
              data: {
                paymentCompleted: true,
                isVisible: true,
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
        }
      } catch (dbError) {
        console.error("Error updating database for verified payment:", dbError);
        // Signature is valid, so we still return success with warning if DB write failed
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment verified successfully.",
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
        paymentRecordId: paymentRecord?.id || null,
        invoiceUrl: paymentRecord?.id ? `/invoice/${paymentRecord.id}` : null,
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
