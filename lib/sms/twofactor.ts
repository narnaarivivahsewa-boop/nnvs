/**
 * 2Factor.in SMS Gateway - STRICTLY SMS OTP ONLY
 * Endpoint: https://2factor.in/API/V1/{API_KEY}/SMS/{MOBILE}/{OTP}/{TEMPLATE_NAME}
 * Sender ID: Rishte
 * Approved Template: Rishteclub Registration OTP
 * Template Text: "XXXX is Your OTP Rishteclub. Please do not share this OTP with anyone."
 * 
 * NOTE: NO VOICE CALLS, NO VOICE OTP ENDPOINTS, NO VOICE FALLBACK.
 */

export interface SendSMSResult {
  success: boolean;
  sessionId?: string;
  message?: string;
  error?: string;
}

export async function sendTwoFactorSMS(
  mobile: string,
  otp: string
): Promise<SendSMSResult> {
  const apiKey = process.env.TWOFACTOR_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ TWOFACTOR_API_KEY is not configured in environment variables.");
    return {
      success: false,
      error: "SMS service not configured on server",
    };
  }

  // Clean 10-digit Indian mobile number
  const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
  if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
    return {
      success: false,
      error: "Please enter a valid 10-digit Indian mobile number",
    };
  }

  const templateName = encodeURIComponent("Rishteclub Registration OTP");
  // Official 2Factor SMS-only endpoint with custom OTP and approved DLT template
  const url = `https://2factor.in/API/V1/${apiKey}/SMS/${cleanMobile}/${otp}/${templateName}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (data && data.Status === "Success") {
      return {
        success: true,
        sessionId: data.Details,
        message: "OTP sent successfully via SMS",
      };
    } else {
      console.error("2Factor SMS API error response:", data?.Details || data?.Status);
      return {
        success: false,
        error: data?.Details || "Failed to send SMS OTP",
      };
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.error("2Factor SMS API timeout");
      return {
        success: false,
        error: "SMS gateway request timed out. Please try again.",
      };
    }
    console.error("2Factor SMS API fetch error:", err?.message || err);
    return {
      success: false,
      error: "Unable to reach SMS gateway. Please try again.",
    };
  }
}
