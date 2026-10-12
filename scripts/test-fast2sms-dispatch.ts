import { sendFast2SmsOTP } from "../lib/sms/fast2sms";

async function testFast2Sms() {
  console.log("==================================================");
  console.log("TESTING FAST2SMS OTP DISPATCH (STRICTLY SMS ONLY)");
  console.log("==================================================");

  const testMobile = "9871592002";
  const testOtp = "123456";

  console.log(`Sending test OTP ${testOtp} to mobile: +91 ${testMobile}`);
  const result = await sendFast2SmsOTP(testMobile, testOtp);

  console.log("Fast2SMS Result:", result);

  if (result.success) {
    console.log("✓ Fast2SMS dispatch succeeded! Request ID:", result.requestId);
  } else {
    console.log("Notice: Fast2SMS API response:", result.error);
    console.log("Gateway is configured strictly for SMS; No voice call fallback occurred.");
  }
}

testFast2Sms().catch(console.error);
