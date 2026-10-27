/**
 * Fast2SMS Smart OTP Gateway - STRICTLY SMS OTP ONLY
 * Official Endpoints:
 * - Send OTP:   POST https://www.fast2sms.com/dev/otp/send
 *   Headers: Authorization: process.env.FAST2SMS_API_KEY, accept: application/json, content-type: application/json
 *   Body: { "mobile": mobileNumber, "otp_id": process.env.FAST2SMS_OTP_ID }
 * 
 * - Verify OTP: POST https://www.fast2sms.com/dev/otp/verify
 *   Headers: Authorization: process.env.FAST2SMS_API_KEY, accept: application/json, content-type: application/json
 *   Body: { "mobile": mobileNumber, "otp": userEnteredOtp }
 * 
 * - Resend OTP: POST https://www.fast2sms.com/dev/otp/resend
 *   Headers: Authorization: process.env.FAST2SMS_API_KEY, accept: application/json, content-type: application/json
 *   Body: { "mobile": mobileNumber }
 */

export interface Fast2SmsSendResult {
  success: boolean;
  requestId?: string;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface Fast2SmsVerifyResult {
  success: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface Fast2SmsResendResult {
  success: boolean;
  requestId?: string;
  message?: string;
  error?: string;
  statusCode?: number;
}

export function getFast2SmsConfig() {
  const env = process.env;
  const apiKeyCandidate =
    env.FAST2SMS_API_KEY ||
    env.FAST2SMS_KEY ||
    env.FAST_2_SMS_API_KEY ||
    env.FAST2SMS_SECRET ||
    env.FAST2SMS_AUTH_KEY ||
    env.fast2sms_api_key ||
    Object.entries(env).find(([k]) => /^(fast2sms|fast_2_sms)_(api_)?key$/i.test(k))?.[1] ||
    "";

  const apiKey = String(apiKeyCandidate).replace(/["']/g, "").trim();

  const otpIdCandidate =
    env.FAST2SMS_OTP_ID ||
    env.FAST2SMS_TEMPLATE_ID ||
    env.FAST_2_SMS_OTP_ID ||
    env.fast2sms_otp_id ||
    "bfb224b309";

  const otpId = String(otpIdCandidate).replace(/["']/g, "").trim();

  const relatedKeyNames = Object.keys(env).filter((k) => /fast2|sms/i.test(k));

  return { apiKey, otpId, relatedKeyNames };
}

/**
 * Validate and clean 10-digit Indian mobile number
 */
export function sanitizeIndianMobile(mobile: string): string | null {
  if (!mobile) return null;
  const clean = String(mobile).replace(/\D/g, "").slice(-10);
  if (/^[6-9]\d{9}$/.test(clean)) {
    return clean;
  }
  return null;
}

/**
 * Send OTP via Fast2SMS Smart OTP Gateway
 * POST to https://www.fast2sms.com/dev/otp/send
 * Headers: Authorization, accept, content-type
 * Body: { "mobile": mobileNumber, "otp_id": process.env.FAST2SMS_OTP_ID }
 */
export async function sendFast2SmsOTP(
  mobile: string,
  _customOtp?: string
): Promise<Fast2SmsSendResult> {
  const { apiKey, otpId, relatedKeyNames } = getFast2SmsConfig();

  if (!apiKey) {
    const diagnostic =
      relatedKeyNames.length > 0
        ? ` Found matching keys in runtime: [${relatedKeyNames.join(", ")}]. Ensure FAST2SMS_API_KEY is spelled correctly.`
        : " No FAST2SMS variables found.";
    console.warn(`⚠️ FAST2SMS_API_KEY is not configured in environment variables.${diagnostic}`);
    return {
      success: false,
      error: `SMS service not configured on server. Please configure FAST2SMS_API_KEY.${diagnostic}`,
    };
  }

  const cleanMobile = sanitizeIndianMobile(mobile);
  if (!cleanMobile) {
    return {
      success: false,
      error: "Please enter a valid 10-digit Indian mobile number.",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const payload = {
      mobile: cleanMobile,
      otp_id: otpId,
    };

    const response = await fetch("https://www.fast2sms.com/dev/otp/send", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (response.ok && data && data.return === true && data.status_code === 200) {
      return {
        success: true,
        requestId: data.request_id || "FAST2SMS_OTP",
        message: Array.isArray(data.message)
          ? data.message[0]
          : data.message || "OTP sent successfully via SMS",
        statusCode: 200,
      };
    } else {
      const errorMsg =
        (Array.isArray(data?.message) ? data.message[0] : data?.message) ||
        `Failed to send SMS OTP via Fast2SMS gateway (HTTP ${response.status})`;
      console.error("Fast2SMS Smart OTP send failed:", errorMsg);
      return {
        success: false,
        error: errorMsg,
        statusCode: data?.status_code || response.status,
      };
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      return {
        success: false,
        error: "SMS gateway request timed out. Please try again.",
      };
    }
    console.error("Fast2SMS send OTP network error:", err?.message || err);
    return {
      success: false,
      error: "Unable to reach SMS gateway. Please try again.",
    };
  }
}

/**
 * Verify Smart OTP via Fast2SMS official verification endpoint
 * POST to https://www.fast2sms.com/dev/otp/verify
 * Headers: Authorization, accept, content-type
 * Body: { "mobile": mobileNumber, "otp": userEnteredOtp }
 */
export async function verifyFast2SmsOTP(
  mobile: string,
  otp: string
): Promise<Fast2SmsVerifyResult> {
  const { apiKey } = getFast2SmsConfig();

  if (!apiKey) {
    return {
      success: false,
      error: "SMS service not configured on server. Please configure FAST2SMS_API_KEY.",
    };
  }

  const cleanMobile = sanitizeIndianMobile(mobile);
  if (!cleanMobile) {
    return {
      success: false,
      error: "Invalid 10-digit mobile number.",
    };
  }

  const cleanOtp = String(otp || "").trim();
  if (!/^\d{4,6}$/.test(cleanOtp)) {
    return {
      success: false,
      error: "Please enter the valid OTP received via SMS.",
    };
  }

  const payload = {
    mobile: cleanMobile,
    otp: cleanOtp,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch("https://www.fast2sms.com/dev/otp/verify", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (response.ok && data && data.return === true && data.status_code === 200) {
      return {
        success: true,
        message:
          (Array.isArray(data.message) ? data.message[0] : data.message) ||
          "OTP verified successfully.",
        statusCode: 200,
      };
    } else {
      const errorMsg =
        (Array.isArray(data?.message) ? data.message[0] : data?.message) ||
        "Invalid or expired OTP. Please try again.";
      console.error("Fast2SMS verify OTP failed:", errorMsg);
      return {
        success: false,
        error: errorMsg,
        statusCode: data?.status_code || response.status,
      };
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.error("Fast2SMS verify OTP request timed out");
      return {
        success: false,
        error: "SMS verification request timed out. Please try again.",
      };
    }
    console.error("Fast2SMS verify OTP network error:", err?.message || err);
    return {
      success: false,
      error: "Unable to reach SMS gateway for verification. Please try again.",
    };
  }
}

/**
 * Resend Smart OTP via Fast2SMS official resend endpoint
 * POST to https://www.fast2sms.com/dev/otp/resend
 * Headers: Authorization, accept, content-type
 * Body: { "mobile": mobileNumber }
 */
export async function resendFast2SmsOTP(
  mobile: string
): Promise<Fast2SmsResendResult> {
  const { apiKey } = getFast2SmsConfig();

  if (!apiKey) {
    return {
      success: false,
      error: "SMS service not configured on server. Please configure FAST2SMS_API_KEY.",
    };
  }

  const cleanMobile = sanitizeIndianMobile(mobile);
  if (!cleanMobile) {
    return {
      success: false,
      error: "Invalid 10-digit mobile number.",
    };
  }

  const payload = {
    mobile: cleanMobile,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch("https://www.fast2sms.com/dev/otp/resend", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (response.ok && data && data.return === true && data.status_code === 200) {
      return {
        success: true,
        requestId: data.request_id || "FAST2SMS_RESEND",
        message:
          (Array.isArray(data.message) ? data.message[0] : data.message) ||
          "OTP resent successfully via SMS.",
        statusCode: 200,
      };
    } else {
      const errorMsg =
        (Array.isArray(data?.message) ? data.message[0] : data?.message) ||
        "Failed to resend SMS OTP via Fast2SMS gateway.";
      console.error("Fast2SMS resend OTP failed:", errorMsg);
      return {
        success: false,
        error: errorMsg,
        statusCode: data?.status_code || response.status,
      };
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.error("Fast2SMS resend OTP request timed out");
      return {
        success: false,
        error: "SMS resend request timed out. Please try again.",
      };
    }
    console.error("Fast2SMS resend OTP network error:", err?.message || err);
    return {
      success: false,
      error: "Unable to reach SMS gateway for resend. Please try again.",
    };
  }
}
