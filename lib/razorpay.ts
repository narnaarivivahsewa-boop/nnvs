import Razorpay from "razorpay";
import crypto from "crypto";

export function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials are not properly configured in environment variables."
    );
  }

  return { keyId, keySecret };
}

export function getRazorpayClient(): Razorpay {
  const { keyId, keySecret } = getRazorpayCredentials();
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Validates Razorpay Payment Signature using HMAC-SHA256.
 * Signature is computed as HMAC_SHA256(orderId + "|" + paymentId, keySecret)
 */
export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { keySecret } = getRazorpayCredentials();
  const { orderId, paymentId, signature } = params;

  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const generatedBuffer = Buffer.from(generatedSignature, "utf-8");
  const providedBuffer = Buffer.from(signature, "utf-8");

  if (generatedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(generatedBuffer, providedBuffer);
}
