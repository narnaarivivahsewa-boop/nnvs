import { POST as sendOtpHandler } from "../app/api/auth/send-otp/route";
import { POST as verifyOtpHandler } from "../app/api/auth/verify-otp/route";
import { NextRequest } from "next/server";
import { prisma } from "../lib/prisma";

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
  }
}

async function testRoutes() {
  console.log("================================================================================");
  console.log("TESTING OTP API ROUTES (SEND-OTP & VERIFY-OTP)");
  console.log("================================================================================");

  // 1. Invalid Mobile Test on send-otp
  console.log("\n[Route Test 1: Invalid Mobile Validation]");
  const reqInvalidMobile = new NextRequest("http://localhost:3000/api/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: "12345", type: "LOGIN" }),
  });
  const resInvalidMobile = await sendOtpHandler(reqInvalidMobile);
  assert(resInvalidMobile.status === 400, "send-otp returns 400 for invalid mobile");
  const dataInvalid = await resInvalidMobile.json();
  assert(dataInvalid.success === false, "send-otp returns success=false for invalid mobile");

  // 2. Unregistered User on LOGIN type
  console.log("\n[Route Test 2: Unregistered Login Validation]");
  const reqUnregistered = new NextRequest("http://localhost:3000/api/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: "9999999999", type: "LOGIN" }),
  });
  const resUnregistered = await sendOtpHandler(reqUnregistered);
  assert(resUnregistered.status === 404, "send-otp returns 404 for unregistered number on LOGIN");
  const dataUnreg = await resUnregistered.json();
  assert(dataUnreg.notRegistered === true, "send-otp sets notRegistered=true flag");

  // 3. Fast2SMS Provider Mocking on send-otp
  console.log("\n[Route Test 3: Fast2SMS Send-OTP Flow]");
  process.env.FAST2SMS_API_KEY = "test_api_key";
  process.env.FAST2SMS_OTP_ID = "37afc2db63";

  const originalFetch = global.fetch;
  global.fetch = async (url: any) => {
    if (String(url).includes("/dev/otp/send")) {
      return new Response(
        JSON.stringify({
          return: true,
          status_code: 200,
          request_id: "req_test_mock_123",
          message: "OTP sent successfully via SMS",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(JSON.stringify({ return: false }), { status: 400 });
  };

  const testMobile = "9876543210";
  // Clean up any test OTP records for testMobile
  await prisma.oTP.deleteMany({ where: { mobile: testMobile } });

  const reqSend = new NextRequest("http://localhost:3000/api/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: testMobile, type: "REGISTRATION" }),
  });

  const resSend = await sendOtpHandler(reqSend);
  assert(resSend.status === 200, "send-otp returns 200 on successful Fast2SMS dispatch");
  const dataSend = await resSend.json();
  assert(dataSend.success === true, "send-otp response has success=true");
  assert(dataSend.maskedMobile?.includes("******"), "send-otp masks mobile number in response");

  // Check DB state
  const dbOtp = await prisma.oTP.findFirst({
    where: { mobile: testMobile, verified: false },
  });
  assert(!!dbOtp, "send-otp creates an unverified oTP record in database");
  assert(Boolean(dbOtp?.code.startsWith("FAST2SMS_")), "Stored code tracks Fast2SMS dispatch request ID");

  // 4. Cooldown Enforcement
  console.log("\n[Route Test 4: 30-Second Cooldown Enforcement]");
  const reqCooldown = new NextRequest("http://localhost:3000/api/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: testMobile, type: "REGISTRATION" }),
  });
  const resCooldown = await sendOtpHandler(reqCooldown);
  assert(resCooldown.status === 429, "send-otp enforces 429 Rate Limit within 30s cooldown");
  const dataCooldown = await resCooldown.json();
  assert(dataCooldown.cooldownRemaining > 0, "send-otp returns cooldownRemaining seconds");

  // 5. Verify OTP with Fast2SMS Mock
  console.log("\n[Route Test 5: Verify-OTP Route Flow]");
  global.fetch = async (url: any, options: any) => {
    if (String(url).includes("/dev/otp/verify")) {
      const body = JSON.parse(options.body);
      if (body.otp === "123456") {
        return new Response(
          JSON.stringify({
            return: true,
            status_code: 200,
            message: "OTP verified successfully",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({
            return: false,
            status_code: 400,
            message: "Invalid or expired OTP",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    return new Response(JSON.stringify({ return: false }), { status: 400 });
  };

  // Bad OTP
  const reqBadVerify = new NextRequest("http://localhost:3000/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: testMobile, otp: "000000", type: "REGISTRATION" }),
  });
  const resBadVerify = await verifyOtpHandler(reqBadVerify);
  assert(resBadVerify.status === 400, "verify-otp returns 400 for incorrect OTP from Fast2SMS");

  // Good OTP
  const reqGoodVerify = new NextRequest("http://localhost:3000/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: testMobile, otp: "123456", type: "REGISTRATION" }),
  });
  const resGoodVerify = await verifyOtpHandler(reqGoodVerify);
  assert(resGoodVerify.status === 200, "verify-otp returns 200 for correct OTP verified by Fast2SMS");
  const dataGoodVerify = await resGoodVerify.json();
  assert(dataGoodVerify.verified === true, "verify-otp returns verified=true");

  const verifiedDbOtp = await prisma.oTP.findFirst({
    where: { mobile: testMobile, verified: true },
  });
  assert(!!verifiedDbOtp, "Database record updated to verified=true");

  // Restore fetch
  global.fetch = originalFetch;

  // Cleanup test OTP
  await prisma.oTP.deleteMany({ where: { mobile: testMobile } });

  console.log("\n================================================================================");
  console.log(`ROUTE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) process.exit(1);
}

testRoutes().catch((err) => {
  console.error("Route test error:", err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
