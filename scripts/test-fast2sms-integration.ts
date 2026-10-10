import {
  sanitizeIndianMobile,
  sendFast2SmsOTP,
  verifyFast2SmsOTP,
  resendFast2SmsOTP,
} from "../lib/sms/fast2sms";
import { generateOTP, hashOTP, getOTPExpiry } from "../lib/auth/otp";

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log("================================================================================");
  console.log("FAST2SMS SMART OTP INTEGRATION - AUTOMATED TEST SUITE");
  console.log("================================================================================");

  // ---------------------------------------------------------------------------
  // 1. Mobile Sanitization & Validation Tests
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 1: Mobile Number Validation]");
  assert(sanitizeIndianMobile("9876543210") === "9876543210", "Valid 10-digit mobile passes");
  assert(sanitizeIndianMobile("+91 98765 43210") === "9876543210", "Formatted +91 mobile extracts clean 10 digits");
  assert(sanitizeIndianMobile("09876543210") === "9876543210", "Leading zero mobile extracts clean 10 digits");
  assert(sanitizeIndianMobile("5876543210") === null, "Invalid starting digit (< 6) is rejected");
  assert(sanitizeIndianMobile("12345") === null, "Short number (< 10 digits) is rejected");
  assert(sanitizeIndianMobile("") === null, "Empty string is rejected");

  // ---------------------------------------------------------------------------
  // 2. Missing Credentials / Environment Handling Tests
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 2: Missing Credentials & Error Handling]");
  const originalKey = process.env.FAST2SMS_API_KEY;
  const originalOtpId = process.env.FAST2SMS_OTP_ID;

  // Simulate missing API key
  delete process.env.FAST2SMS_API_KEY;
  const missingKeySend = await sendFast2SmsOTP("9876543210");
  assert(!missingKeySend.success, "Send OTP fails gracefully when FAST2SMS_API_KEY is unset");
  assert(Boolean(missingKeySend.error?.includes("FAST2SMS_API_KEY")), "Error message informs server admin about missing key without exposing secrets");

  const missingKeyVerify = await verifyFast2SmsOTP("9876543210", "123456");
  assert(!missingKeyVerify.success, "Verify OTP fails gracefully when FAST2SMS_API_KEY is unset");

  const missingKeyResend = await resendFast2SmsOTP("9876543210");
  assert(!missingKeyResend.success, "Resend OTP fails gracefully when FAST2SMS_API_KEY is unset");

  // Restore mock credentials for downstream mock tests
  process.env.FAST2SMS_API_KEY = "mock_test_key_for_automated_testing_only";
  process.env.FAST2SMS_OTP_ID = "37afc2db63";

  // ---------------------------------------------------------------------------
  // 3. Mocked Provider Send Tests (Success, Validation Error, Timeout)
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 3: Send OTP Gateway Protocol]");
  const originalFetch = global.fetch;

  // Mock Success
  global.fetch = async (url: any, options: any) => {
    if (String(url).includes("/dev/otp/send")) {
      const body = JSON.parse(options.body);
      assert(body.mobile === "9876543210", "Payload contains clean 10-digit mobile");
      assert(body.otp_id === "37afc2db63", "Payload contains configured Template ID 37afc2db63");
      assert(body.otp_length === 6, "Payload specifies 6-digit OTP length");
      assert(body.otp_expiry === 10, "Payload specifies 10-minute expiry");
      assert(options.headers["authorization"] === "mock_test_key_for_automated_testing_only", "Authorization header passes API key");
      assert(!String(options.headers["authorization"]).includes("NEXT_PUBLIC"), "API key is not from a client-exposed variable");

      return new Response(
        JSON.stringify({
          return: true,
          status_code: 200,
          request_id: "test_req_abc123",
          message: "OTP sent successfully",
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }
    return new Response(JSON.stringify({ return: false }), { status: 400 });
  };

  const sendResultSuccess = await sendFast2SmsOTP("9876543210", "654321");
  assert(sendResultSuccess.success === true, "Send OTP returns success on HTTP 200 with return=true");
  assert(sendResultSuccess.requestId === "test_req_abc123", "Send OTP captures provider request_id");

  // Mock Provider Error (e.g. Invalid Template ID or DLT error)
  global.fetch = async () => {
    return new Response(
      JSON.stringify({
        return: false,
        status_code: 400,
        message: "Invalid OTP template ID provided",
      }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  };

  const sendResultProviderError = await sendFast2SmsOTP("9876543210");
  assert(sendResultProviderError.success === false, "Send OTP returns failure when provider returns return=false");
  assert(sendResultProviderError.error === "Invalid OTP template ID provided", "Send OTP returns provider error message");

  // ---------------------------------------------------------------------------
  // 4. Mocked Provider Verify Tests (Success, Incorrect OTP, Expired OTP)
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 4: Verify OTP Gateway Protocol]");

  // Mock Verify Success
  global.fetch = async (url: any, options: any) => {
    if (String(url).includes("/dev/otp/verify")) {
      const body = JSON.parse(options.body);
      assert(body.mobile === "9876543210", "Verify payload contains mobile");
      assert(body.otp === "123456", "Verify payload contains user OTP");
      assert(body.otp_id === "37afc2db63", "Verify payload contains Template ID");

      return new Response(
        JSON.stringify({
          return: true,
          status_code: 200,
          message: "OTP verified successfully",
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }
    return new Response(JSON.stringify({ return: false }), { status: 400 });
  };

  const verifySuccess = await verifyFast2SmsOTP("9876543210", "123456");
  assert(verifySuccess.success === true, "Verify OTP succeeds on return=true && status_code=200");

  // Mock Verify Failure (Incorrect OTP)
  global.fetch = async () => {
    return new Response(
      JSON.stringify({
        return: false,
        status_code: 400,
        message: "Invalid or expired OTP",
      }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  };

  const verifyIncorrect = await verifyFast2SmsOTP("9876543210", "999999");
  assert(verifyIncorrect.success === false, "Verify OTP fails on incorrect OTP");
  assert(verifyIncorrect.error === "Invalid or expired OTP", "Verify OTP returns provider error message");

  // ---------------------------------------------------------------------------
  // 5. Mocked Provider Resend Tests
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 5: Resend OTP Gateway Protocol]");
  global.fetch = async (url: any, options: any) => {
    if (String(url).includes("/dev/otp/resend")) {
      const body = JSON.parse(options.body);
      assert(body.mobile === "9876543210", "Resend payload contains mobile");
      return new Response(
        JSON.stringify({
          return: true,
          status_code: 200,
          request_id: "resend_req_xyz789",
          message: "OTP resent successfully",
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }
    return new Response(JSON.stringify({ return: false }), { status: 400 });
  };

  const resendSuccess = await resendFast2SmsOTP("9876543210");
  assert(resendSuccess.success === true, "Resend OTP succeeds on return=true && status_code=200");
  assert(resendSuccess.requestId === "resend_req_xyz789", "Resend OTP returns request_id");

  // Restore fetch
  global.fetch = originalFetch;

  // Restore env
  if (originalKey) process.env.FAST2SMS_API_KEY = originalKey;
  else delete process.env.FAST2SMS_API_KEY;
  if (originalOtpId) process.env.FAST2SMS_OTP_ID = originalOtpId;
  else delete process.env.FAST2SMS_OTP_ID;

  // ---------------------------------------------------------------------------
  // 6. Security & Leakage Prevention Checks
  // ---------------------------------------------------------------------------
  console.log("\n[Test Suite 6: Security & Leakage Prevention]");
  const envKeys = Object.keys(process.env);
  const leakedClientKeys = envKeys.filter((k) => k.startsWith("NEXT_PUBLIC_") && k.toLowerCase().includes("fast2sms"));
  assert(leakedClientKeys.length === 0, "Zero NEXT_PUBLIC_ variables expose FAST2SMS credentials");

  console.log("\n================================================================================");
  console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log("================================================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test suite runtime error:", err);
  process.exit(1);
});
