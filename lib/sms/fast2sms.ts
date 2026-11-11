/**
 * Fast2SMS Gateway - Official DLT Route with Sender ID NNVS
 * Entity ID: 1701179249077069314
 * Sender ID: NNVS
 * Approved DLT Template:
 * "RishteClub me login hetu OTP: {#VAR#}. Valid for 5 mins. Visit: https://rishteclub.com - NNVS MATRIMONY"
 *
 * Official Endpoints:
 * - DLT Quick / Manual: POST https://www.fast2sms.com/dev/bulkV2
 * - Smart OTP Send:     POST https://www.fast2sms.com/dev/otp/send
 * - Smart OTP Verify:   POST https://www.fast2sms.com/dev/otp/verify
 * - Smart OTP Resend:   POST https://www.fast2sms.com/dev/otp/resend
 */

export interface Fast2SmsSendResult {
  success: boolean;
  requestId?: string;
  message?: string;
  error?: string;
  statusCode?: number;
  otp?: string;
  routeUsed?: "DLT" | "SMART_OTP";
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
  otp?: string;
  routeUsed?: "DLT" | "SMART_OTP";
}

export const DLT_APPROVED_TEMPLATE =
  "RishteClub me login hetu OTP: {#VAR#}. Valid for 5 mins. Visit: https://rishteclub.com - NNVS MATRIMONY";

export function formatDltOtpMessage(otp: string): string {
  return `RishteClub me login hetu OTP: ${otp}. Valid for 5 mins. Visit: https://rishteclub.com - NNVS MATRIMONY`;
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

  // DLT verified Sender ID and Entity ID
  const senderId = (env.FAST2SMS_SENDER_ID || "NNVS").replace(/["']/g, "").trim();
  const entityId = (env.FAST2SMS_ENTITY_ID || "1701179249077069314").replace(/["']/g, "").trim();
  const templateId = (env.FAST2SMS_DLT_TEMPLATE_ID || env.FAST2SMS_TEMPLATE_ID || "").replace(/["']/g, "").trim();

  const otpIdCandidate =
    env.FAST2SMS_OTP_ID ||
    env.FAST_2_SMS_OTP_ID ||
    env.fast2sms_otp_id ||
    "bfb224b309";

  const otpId = String(otpIdCandidate).replace(/["']/g, "").trim();

  const relatedKeyNames = Object.keys(env).filter((k) => /fast2|sms/i.test(k));

  return { apiKey, senderId, entityId, templateId, otpId, relatedKeyNames };
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
 * Send OTP via Fast2SMS DLT Gateway with Sender ID NNVS
 * Strictly SMS-only under approved DLT template:
 * "RishteClub me login hetu OTP: {#VAR#}. Valid for 5 mins. Visit: https://rishteclub.com - NNVS MATRIMONY"
 */
export async function sendFast2SmsOTP(
  mobile: string,
  customOtp?: string
): Promise<Fast2SmsSendResult> {
  const { apiKey, senderId, entityId, templateId, otpId, relatedKeyNames } = getFast2SmsConfig();

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

  const otpToSend =
    customOtp && /^\d{4,6}$/.test(customOtp.trim())
      ? customOtp.trim()
      : String(Math.floor(100000 + Math.random() * 900000));

  const dltMessage = formatDltOtpMessage(otpToSend);

  // 1. PRIMARY: Dispatch via Fast2SMS DLT route with Sender ID NNVS (Entity: 1701179249077069314)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const dltPayload: {
      route: string;
      sender_id: string;
      entity_id: string;
      message: string;
      numbers: string;
      flash: number;
      template_id?: string;
    } = {
      route: "dlt_manual",
      sender_id: senderId,
      entity_id: entityId,
      message: dltMessage,
      numbers: cleanMobile,
      flash: 0,
    };

    if (templateId) {
      dltPayload.template_id = templateId;
    }

    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(dltPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);
    console.log(`[Fast2SMS DLT] Dispatch response (${senderId}):`, data);

    if (response.ok && data && data.return === true) {
      return {
        success: true,
        requestId: data.request_id || `NNVS_${Date.now()}`,
        message: Array.isArray(data.message)
          ? data.message[0]
          : data.message || "OTP sent successfully via SMS",
        statusCode: 200,
        otp: otpToSend,
        routeUsed: "DLT",
      };
    }

    // If template_id is provided and dlt_manual returned error, attempt route: "dlt"
    if (templateId) {
      const dltRoutePayload = {
        route: "dlt",
        sender_id: senderId,
        message: templateId,
        variables_values: otpToSend,
        numbers: cleanMobile,
        flash: 0,
      };

      const dltRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: apiKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(dltRoutePayload),
      });

      const dltData = await dltRes.json().catch(() => null);
      if (dltRes.ok && dltData && dltData.return === true) {
        return {
          success: true,
          requestId: dltData.request_id || `NNVS_${Date.now()}`,
          message: Array.isArray(dltData.message)
            ? dltData.message[0]
            : dltData.message || "OTP sent successfully via SMS",
          statusCode: 200,
          otp: otpToSend,
          routeUsed: "DLT",
        };
      }
    }

    console.warn("[Fast2SMS] DLT dispatch unsuccessful, attempting Smart OTP fallback...", data?.message);
  } catch (dltErr: unknown) {
    const err = dltErr as Error | undefined;
    if (err?.name === "AbortError") {
      console.warn("[Fast2SMS] DLT request timed out, attempting Smart OTP fallback...");
    } else {
      console.warn("[Fast2SMS] DLT request error:", err?.message || dltErr);
    }
  }

  // 2. SECONDARY FALLBACK: Fast2SMS Smart OTP Endpoint
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

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

    if (
      response.ok &&
      data &&
      data.return === true &&
      (!data.status_code || Number(data.status_code) === 200)
    ) {
      return {
        success: true,
        requestId: data.request_id || "FAST2SMS_OTP",
        message: Array.isArray(data.message)
          ? data.message[0]
          : data.message || "OTP sent successfully via SMS",
        statusCode: 200,
        routeUsed: "SMART_OTP",
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
  } catch (err: unknown) {
    const error = err as Error | undefined;
    if (error?.name === "AbortError") {
      return {
        success: false,
        error: "SMS gateway request timed out. Please try again.",
      };
    }
    console.error("Fast2SMS send OTP network error:", error?.message || err);
    return {
      success: false,
      error: "Unable to reach SMS gateway. Please try again.",
    };
  }
}

/**
 * Verify Smart OTP via Fast2SMS official verification endpoint
 * POST to https://www.fast2sms.com/dev/otp/verify
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

    if (
      response.ok &&
      data &&
      data.return === true &&
      (!data.status_code || Number(data.status_code) === 200)
    ) {
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
  } catch (err: unknown) {
    const error = err as Error | undefined;
    if (error?.name === "AbortError") {
      console.error("Fast2SMS verify OTP request timed out");
      return {
        success: false,
        error: "SMS verification request timed out. Please try again.",
      };
    }
    console.error("Fast2SMS verify OTP network error:", error?.message || err);
    return {
      success: false,
      error: "Unable to reach SMS gateway for verification. Please try again.",
    };
  }
}

/**
 * Resend Smart OTP via Fast2SMS
 * Tries DLT route first with Sender ID NNVS, then falls back to official resend endpoint
 */
export async function resendFast2SmsOTP(
  mobile: string,
  customOtp?: string
): Promise<Fast2SmsResendResult> {
  const dltResult = await sendFast2SmsOTP(mobile, customOtp);
  if (dltResult.success) {
    return {
      success: true,
      requestId: dltResult.requestId,
      message: dltResult.message || "OTP resent successfully via SMS.",
      statusCode: 200,
      otp: dltResult.otp,
      routeUsed: dltResult.routeUsed,
    };
  }

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
    const timeoutId = setTimeout(() => controller.abort(), 12000);

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

    if (
      response.ok &&
      data &&
      data.return === true &&
      (!data.status_code || Number(data.status_code) === 200)
    ) {
      return {
        success: true,
        requestId: data.request_id || "FAST2SMS_RESEND",
        message:
          (Array.isArray(data.message) ? data.message[0] : data.message) ||
          "OTP resent successfully via SMS.",
        statusCode: 200,
        routeUsed: "SMART_OTP",
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
  } catch (err: unknown) {
    const error = err as Error | undefined;
    if (error?.name === "AbortError") {
      console.error("Fast2SMS resend OTP request timed out");
      return {
        success: false,
        error: "SMS resend request timed out. Please try again.",
      };
    }
    console.error("Fast2SMS resend OTP network error:", error?.message || err);
    return {
      success: false,
      error: "Unable to reach SMS gateway for resend. Please try again.",
    };
  }
}
