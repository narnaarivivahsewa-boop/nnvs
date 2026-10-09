import { POST as createOrder } from "../app/api/create-order/route";
import { POST as verifyPayment } from "../app/api/verify-payment/route";
import { NextRequest } from "next/server";
import crypto from "crypto";

async function testApiRoutes() {
  console.log("=== TESTING API ROUTE HANDLERS ===");

  // 1. Test create-order
  const reqCreate = new NextRequest("http://localhost:3000/api/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: 47082, // ₹470.82 in paise
      currency: "INR",
      receipt: "rcpt_test_suite",
    }),
  });

  const resCreate = await createOrder(reqCreate);
  const dataCreate = await resCreate.json();

  console.log("create-order status:", resCreate.status);
  console.log("create-order response:", dataCreate);

  if (resCreate.status !== 200 || !dataCreate.order_id) {
    throw new Error("create-order route test failed");
  }

  // 2. Test verify-payment with valid signature
  const secret = process.env.RAZORPAY_KEY_SECRET || "3uv1uBm1noiZvWEBwezQv3qa";
  const dummyPaymentId = "pay_test_suite_123";
  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(`${dataCreate.order_id}|${dummyPaymentId}`)
    .digest("hex");

  const reqVerify = new NextRequest("http://localhost:3000/api/verify-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: dataCreate.order_id,
      razorpay_payment_id: dummyPaymentId,
      razorpay_signature: validSignature,
    }),
  });

  const resVerify = await verifyPayment(reqVerify);
  const dataVerify = await resVerify.json();

  console.log("verify-payment status:", resVerify.status);
  console.log("verify-payment response:", dataVerify);

  if (resVerify.status !== 200 || !dataVerify.success) {
    throw new Error("verify-payment route test failed");
  }

  console.log("✅ ALL API ROUTES WORKING PERFECTLY!");
}

testApiRoutes();
