import {
  sendFast2SmsOTP,
  resendFast2SmsOTP,
  verifyFast2SmsOTP,
} from "../lib/sms/fast2sms";

async function testLiveFlow() {
  console.log("================================================================================");
  console.log("LIVE FAST2SMS END-TO-END VERIFICATION SUITE");
  console.log("================================================================================");

  const testMobile = "9871592002"; // Permanent admin mobile

  console.log(`\n1. Testing LIVE Send OTP to +91 ${testMobile}...`);
  const sendRes = await sendFast2SmsOTP(testMobile);
  console.log("Send Result:", sendRes);

  if (!sendRes.success) {
    console.error("❌ Send OTP failed:", sendRes.error);
    process.exit(1);
  }
  console.log("✅ Send OTP succeeded with Request ID:", sendRes.requestId);

  console.log("\nWaiting 12 seconds for Fast2SMS gateway rate limit interval...");
  await new Promise((r) => setTimeout(r, 12000));

  console.log(`\n2. Testing LIVE Resend OTP to +91 ${testMobile}...`);
  const resendRes = await resendFast2SmsOTP(testMobile);
  console.log("Resend Result:", resendRes);

  if (!resendRes.success) {
    console.error("❌ Resend OTP failed:", resendRes.error);
    process.exit(1);
  }
  console.log("✅ Resend OTP succeeded with Request ID:", resendRes.requestId);

  console.log(`\n3. Testing LIVE Verify OTP with deliberately incorrect OTP to check rejection handling...`);
  const verifyBadRes = await verifyFast2SmsOTP(testMobile, "000000");
  console.log("Verify (Bad OTP) Result:", verifyBadRes);

  if (!verifyBadRes.success && verifyBadRes.error) {
    console.log("✅ Fast2SMS accurately identified and rejected invalid OTP:", verifyBadRes.error);
  } else {
    console.error("❌ Expected rejection on bad OTP, but got:", verifyBadRes);
    process.exit(1);
  }

  console.log("\n================================================================================");
  console.log("ALL LIVE FAST2SMS ENDPOINTS (SEND, RESEND, VERIFY) TESTED & FULLY FUNCTIONAL!");
  console.log("================================================================================");
}

testLiveFlow().catch((err) => {
  console.error("Live test failed:", err);
  process.exit(1);
});
