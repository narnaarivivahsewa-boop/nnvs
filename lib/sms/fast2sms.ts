/**
 * Fast2SMS Smart OTP Gateway - STRICTLY SMS OTP ONLY
 * Official Endpoints:
 * - Send OTP:   POST https://www.fast2sms.com/dev/otp/send
 * - Verify OTP: POST https://www.fast2sms.com/dev/otp/verify
 * - Resend OTP: POST https://www.fast2sms.com/dev/otp/resend
 * 
 * Configured Template ID: 37afc2db63
 * Channels: Strictly SMS only. No voice calls, no voice fallback, no WhatsApp fallback.
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

function getFast2SmsConfig() {
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
    "37afc2db63";

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
 * Send Smart OTP via Fast2SMS (SMS-only)
 * @param mobile 10-digit Indian mobile number
 * @param customOtp Optional custom OTP string (if omitted, Fast2SMS generates a secure 6-digit OTP)
 */
export async function sendFast2SmsOTP(
  mobile: string,
  customOtp?: string
): Promise<Fast2SmsSendResult> {
  const { apiKey, otpId, relatedKeyNames } = getFast2SmsConfig();

  if (!apiKey) {
    const diagnostic = relatedKeyNames.length > 0
      ? ` Found matching keys in runtime: [${relatedKeyNames.join(", ")}]. Ensure FAST2SMS_API_KEY is spelled correctly.`
      : " No FAST2SMS variables found.";
    console.warn(`⚠️ FAST2SMS_API_KEY is not configured in environment variables.${diagnostic}`);
    return {
      success: false,
      error: `SMS service not configured on server. Please configure FAST2SMS_API_KEY.${diagnostic}`,
    };
  }

  if (!otpId) {
    console.warn("⚠️ FAST2SMS_OTP_ID is not configured in server environment variables.");
    return {
      success: false,
      error: "Smart OTP template ID not configured on server.",
    };
  }

  const cleanMobile = sanitizeIndianMobile(mobile);
  if (!cleanMobile) {
    return {
      success: false,
      error: "Please enter a valid 10-digit Indian mobile number.",
    };
  }

  const payload: Record<string, any> = {
    mobile: cleanMobile,
    otp_id: otpId,
    otp_expiry: 10, // 10 minutes
    otp_length: 6,  // 6 digits
  };

  if (customOtp && /^\d{4,6}$/.test(customOtp.trim())) {
    payload.otp = customOtp.trim();
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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

    const data = await response.json();

    if (response.ok && data && data.return === true && data.status_code === 200) {
      return {
        success: true,
        requestId: data.request_id,
        message: data.message || "OTP sent successfully via SMS",
        statusCode: 200,
      };
    } else {
      console.error(
        "Fast2SMS send OTP failed:",
        data?.message || `HTTP ${response.status}`
      );
      return {
        success: false,
        error: data?.message || "Failed to send SMS OTP via Fast2SMS gateway",
        statusCode: data?.status_code || response.status,
      };
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.error("Fast2SMS send OTP request timed out");
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
 * @param mobile 10-digit Indian mobile number
 * @param otp The 6-digit OTP code entered by the user
 */
export async function verifyFast2SmsOTP(
  mobile: string,
  otp: string
): Promise<Fast2SmsVerifyResult> {
  const { apiKey, otpId } = getFast2SmsConfig();

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
    otp_id: otpId,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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

    const data = await response.json();

    if (response.ok && data && data.return === true && data.status_code === 200) {
      return {
        success: true,
        message: data.message || "OTP verified successfully.",
        statusCode: 200,
      };
    } else {
      console.error(
        "Fast2SMS verify OTP failed:",
        data?.message || `HTTP ${response.status}`
      );
      return {
        success: false,
        error: data?.message || "Invalid or expired OTP. Please try again.",
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
