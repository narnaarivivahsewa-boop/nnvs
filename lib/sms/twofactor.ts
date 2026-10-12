/**
 * DEPRECATED: 2Factor.in has been completely replaced by Fast2SMS.
 * All SMS dispatches route exclusively through Fast2SMS (https://www.fast2sms.com/dev/bulkV2).
 * NO VOICE CALLS, NO VOICE OTP, NO 2FACTOR.IN ACTIVE IN THIS APPLICATION.
 */

import { sendFast2SmsOTP, Fast2SmsSendResult } from "./fast2sms";

export interface SendSMSResult {
  success: boolean;
  sessionId?: string;
  message?: string;
  error?: string;
}

/**
  * Legacy fallback wrapper: Routes directly through Fast2SMS SMS gateway.
  */
export async function sendTwoFactorSMS(
  mobile: string,
  otp: string
): Promise<SendSMSResult> {
  const result: Fast2SmsSendResult = await sendFast2SmsOTP(mobile, otp);
  return {
    success: result.success,
    sessionId: result.requestId,
    message: result.message,
    error: result.error,
  };
}
