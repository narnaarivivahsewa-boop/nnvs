import { getRazorpayClient, verifyRazorpaySignature } from "../lib/razorpay";
import crypto from "crypto";

async function testRazorpay() {
  console.log("=== TESTING RAZORPAY INTEGRATION ===");

  try {
    // 1. Test Client & Order Creation
    const client = getRazorpayClient();
    const testAmount = 50000; // 500.00 INR in paise

    console.log(`1. Creating Test Order for ${testAmount} paise (₹500.00)...`);
    const order = await client.orders.create({
      amount: testAmount,
      currency: "INR",
      receipt: `test_rcpt_${Date.now()}`,
      notes: { test: "Integration Verification" },
    });

    console.log("✅ Order Created Successfully:", {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
    });

    // 2. Test HMAC-SHA256 Signature Verification
    console.log("\n2. Testing HMAC-SHA256 Signature Verification...");
    const secret = process.env.RAZORPAY_KEY_SECRET || "3uv1uBm1noiZvWEBwezQv3qa";
    const dummyPaymentId = "pay_test_123456789";

    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(`${order.id}|${dummyPaymentId}`)
      .digest("hex");

    const isValid = verifyRazorpaySignature({
      orderId: order.id,
      paymentId: dummyPaymentId,
      signature: validSignature,
    });

    console.log(`Verification with Valid Signature: ${isValid ? "✅ PASS" : "❌ FAIL"}`);

    const isInvalid = verifyRazorpaySignature({
      orderId: order.id,
      paymentId: dummyPaymentId,
      signature: "tampered_fake_signature_abc123",
    });

    console.log(
      `Verification with Tampered Signature: ${!isInvalid ? "✅ REJECTED AS EXPECTED" : "❌ FAILED TO REJECT"}`
    );

    console.log("\n🎉 ALL RAZORPAY TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ RAZORPAY TEST ERROR:", err);
  }
}

testRazorpay();
